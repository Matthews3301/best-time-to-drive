import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import {
  acquireForecastLock,
  buildForecastFingerprints,
  createCacheLockToken,
  getCachedForecast,
  releaseForecastLock,
  setCachedForecast,
  waitForExactForecast,
  type CachedForecastEntry,
  type CachedForecastPoint
} from '../utils/forecastCache';

dayjs.extend(utc);
dayjs.extend(timezone);

type ForecastPoint = CachedForecastPoint;

type ForecastRequestBody = {
  origin: string;
  destination: string;
  timezone?: string;
  departDate?: string | null;
  excludeNightHours?: boolean;
};

type ForecastSlot = {
  index: number;
  slotUnix: number;
  departureUnix: number;
  localTime: dayjs.Dayjs;
  hour: number;
  isExcluded: boolean;
};

type QueryMetrics = {
  apiCalls: number;
};

type ForecastComputationResult = {
  data: ForecastPoint[];
  cacheEntry: CachedForecastEntry;
  apiCalls: number;
};

const forecastInFlight = new Map<string, Promise<ForecastComputationResult>>();
const requestRateLimits = new Map<string, { count: number; resetAt: number }>();
const ALLOWED_PRODUCTION_ORIGIN = 'https://rushhourplanner.com';
const RATE_LIMIT_MAX_REQUESTS = 40;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_SHADOW_SAMPLE_RATE = Number(process.env.FORECAST_SHADOW_SAMPLE_RATE || '0');
const PARTIAL_CACHE_TTL_SECONDS = 4 * 60 * 60;
const NEARBY_CACHE_TTL_SECONDS = 48 * 60 * 60;
const LOCK_TTL_SECONDS = 45;
const TOMTOM_MAX_CONCURRENT = 1;
const TOMTOM_MIN_INTERVAL_MS = 200;

let activeTomTomRequests = 0;
const tomTomRequestQueue: Array<() => void> = [];
let lastTomTomRequestStartedAt = 0;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithTomTomThrottle<T>(request: () => Promise<T>): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const run = async () => {
      activeTomTomRequests += 1;
      try {
        const elapsedSinceLastStart = Date.now() - lastTomTomRequestStartedAt;
        const spacingDelay = Math.max(0, TOMTOM_MIN_INTERVAL_MS - elapsedSinceLastStart);
        if (spacingDelay > 0) {
          await wait(spacingDelay);
        }
        lastTomTomRequestStartedAt = Date.now();
        const result = await request();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        activeTomTomRequests -= 1;
        const next = tomTomRequestQueue.shift();
        if (next) {
          next();
        }
      }
    };

    if (activeTomTomRequests < TOMTOM_MAX_CONCURRENT) {
      void run();
      return;
    }

    tomTomRequestQueue.push(() => {
      void run();
    });
  });
}

function getStartTime(departDate: string | null | undefined, timeZone: string) {
  if (departDate) {
    return dayjs.tz(`${departDate} 00:00:00`, timeZone);
  }
  return dayjs().tz(timeZone).startOf('hour');
}

function getExactCacheTtlSeconds(departDate: string | null | undefined) {
  if (departDate) {
    return 24 * 60 * 60;
  }
  return 45 * 60;
}

function getClientIdentifier(event: any) {
  const forwardedFor = getHeader(event, 'x-forwarded-for');
  const realIp = getHeader(event, 'x-real-ip');
  const cfConnectingIp = getHeader(event, 'cf-connecting-ip');
  const socketIp = event.node.req.socket?.remoteAddress;

  const forwardedIp = forwardedFor?.split(',')[0]?.trim();
  return forwardedIp || realIp || cfConnectingIp || socketIp || 'unknown';
}

function consumeRateLimit(clientId: string, now: number) {
  const existing = requestRateLimits.get(clientId);

  if (!existing || existing.resetAt <= now) {
    requestRateLimits.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  existing.count += 1;
  return true;
}

async function fetchDurationMinutes(
  origin: string,
  destination: string,
  departureUnix: number,
  apiKey: string,
  metrics: QueryMetrics
) {
  // TomTom Routing API: uses departAt ISO timestamp for traffic-aware ETA prediction.
  // Path format supports "lat,lng" strings from client (preferred by index.vue). Uses predicted traffic for future departAt.
  const departureIso = new Date(departureUnix * 1000).toISOString();
  const routePath = `${encodeURIComponent(origin)}:${encodeURIComponent(destination)}`;

  const buildUrl = () => {
    const params = new URLSearchParams({
      key: apiKey,
      departAt: departureIso,
      routeType: 'fastest',
      traffic: 'true',
      language: 'en-US'
    });
    return `https://api.tomtom.com/routing/1/calculateRoute/${routePath}/json?${params.toString()}`;
  };

  const requestWithRetry = async (): Promise<number> => {
    const url = buildUrl();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      metrics.apiCalls += 1;
      const response = await runWithTomTomThrottle(async () =>
        await fetch(url, {
          headers: {
            'Accept': 'application/json'
          }
        })
      );

      if (!response.ok) {
        let tomTomMessage = `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`;
        try {
          const rawError = await response.text();
          if (rawError) {
            try {
              const parsed = JSON.parse(rawError);
              tomTomMessage =
                parsed?.error?.description ||
                parsed?.message ||
                parsed?.error_description ||
                tomTomMessage;
            } catch {
              tomTomMessage = rawError.slice(0, 200);
            }
          }
        } catch {
          // keep default tomTomMessage when body cannot be read
        }

        if (attempt < 2) {
          console.warn(`[Forecast] TomTom retry ${attempt + 1}/3: ${tomTomMessage}`);
          await wait(500 * (attempt + 1));
          continue;
        }
        console.error(`[Forecast] TomTom failure: ${tomTomMessage}`);
        throw createError({
          statusCode: response.status,
          statusMessage: `TomTom request failed: ${tomTomMessage}`
        });
      }

      const payload = await response.json();

      // TomTom error format
      if (payload.error || payload.message) {
        const errorDetail = payload.error?.description || payload.message || 'Unknown error';
        const errorCode = payload.error?.code || payload.code;

        if ((errorCode === 429 || errorCode === '429' || payload.statusCode === 429) && attempt < 2) {
          console.warn(`[Forecast] TomTom rate-limited ${attempt + 1}/3: ${errorDetail}`);
          await wait(1000 * (attempt + 2)); // longer backoff for rate limits
          continue;
        }

        console.error(`[Forecast] TomTom payload error: ${errorDetail}`);
        throw createError({
          statusCode: 502,
          statusMessage: `TomTom Routing error: ${errorDetail}`
        });
      }

      const route = payload?.routes?.[0];
      const leg = route?.legs?.[0];
      const travelTimeSeconds = leg?.summary?.travelTimeInSeconds;

      if (typeof travelTimeSeconds === 'number' && travelTimeSeconds > 0) {
        const minutes = Math.max(1, Math.round(travelTimeSeconds / 60));
        return minutes;
      }

      console.error('[Forecast] TomTom response missing travelTimeInSeconds');
      throw createError({
        statusCode: 502,
        statusMessage: 'TomTom response did not include valid travelTimeInSeconds'
      });
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'Unable to calculate directions forecast with TomTom'
    });
  };

  // TomTom gracefully handles past departure times by using current traffic
  // No need for complex INVALID_REQUEST fallbacks like Google
  try {
    return await requestWithRetry();
  } catch (error: any) {
    const reason = error?.statusMessage || error?.message || 'Unknown TomTom request error';
    console.error(`[Forecast] TomTom request failed: ${reason}`);
    throw error;
  }
}

function buildForecastSlots(
  startTime: dayjs.Dayjs,
  timeZone: string,
  excludeNightHours: boolean
) {
  const nowUnix = dayjs().unix();

  return Array.from({ length: 24 }, (_, index) => {
    const localTime = startTime.add(index, 'hour').tz(timeZone);
    const slotUnix = localTime.unix();
    const hour = localTime.hour();
    const isExcluded = excludeNightHours && (hour >= 23 || hour <= 5);

    return {
      index,
      slotUnix,
      departureUnix: Math.max(slotUnix, nowUnix),
      localTime,
      hour,
      isExcluded
    };
  });
}

function createForecastPoint(slot: ForecastSlot, duration: number, isEstimated = false): ForecastPoint {
  return {
    time: slot.localTime.toISOString(),
    duration,
    label: slot.localTime.format('HH:mm'),
    hour: slot.hour,
    isExcluded: slot.isExcluded,
    isEstimated
  };
}

function getAllowedIndices(slots: ForecastSlot[]) {
  const allowed = slots.filter((slot) => !slot.isExcluded).map((slot) => slot.index);
  return allowed.length > 0 ? allowed : slots.map((slot) => slot.index);
}

function toSortedUniqueIndices(indices: number[], maxLength: number) {
  return Array.from(new Set(indices.filter((index) => index >= 0 && index < maxLength))).sort((a, b) => a - b);
}

function pickInitialSampleIndices(slots: ForecastSlot[], nearbySeed?: CachedForecastEntry | null) {
  const allowedIndices = getAllowedIndices(slots);
  const base = allowedIndices.filter((index) => index % 3 === 0);
  const anchorHours = new Set([6, 8, 12, 17, 19]);
  const anchors = slots
    .filter((slot) => anchorHours.has(slot.hour) && !slot.isExcluded)
    .map((slot) => slot.index);
  const nearbyBestHour = nearbySeed?.chosenBestTime?.hour;
  const nearbyWindow =
    typeof nearbyBestHour === 'number'
      ? slots
          .filter((slot) => Math.abs(slot.hour - nearbyBestHour) <= 1 && !slot.isExcluded)
          .map((slot) => slot.index)
      : [];

  return toSortedUniqueIndices(
    [
      allowedIndices[0] ?? -1,
      allowedIndices[allowedIndices.length - 1] ?? -1,
      ...base,
      ...anchors,
      ...nearbyWindow
    ],
    slots.length
  );
}

function getBestAllowedPoint(points: ForecastPoint[]) {
  const allowed = points.filter((point) => !point.isExcluded);
  const source = allowed.length > 0 ? allowed : points;

  if (source.length === 0) {
    return null;
  }

  return source.reduce((best, current) => (current.duration < best.duration ? current : best));
}

function pickRefinementIndices(slots: ForecastSlot[], queried: Map<number, ForecastPoint>) {
  const exactPoints = Array.from(queried.entries())
    .map(([index, point]) => ({ index, point }))
    .filter(({ point }) => !point.isExcluded)
    .sort((a, b) => a.point.duration - b.point.duration);

  const topCandidates = exactPoints.slice(0, 2);
  const refinement = new Set<number>();

  for (const candidate of topCandidates) {
    refinement.add(candidate.index - 1);
    refinement.add(candidate.index + 1);
  }

  const allowed = new Set(getAllowedIndices(slots));
  return toSortedUniqueIndices(
    Array.from(refinement).filter((index) => allowed.has(index) && !queried.has(index)),
    slots.length
  );
}

function interpolatePoints(slots: ForecastSlot[], queried: Map<number, ForecastPoint>) {
  const results: ForecastPoint[] = [];

  for (const slot of slots) {
    const exact = queried.get(slot.index);
    if (exact) {
      results.push(exact);
      continue;
    }

    let previousIndex = slot.index - 1;
    while (previousIndex >= 0 && !queried.has(previousIndex)) {
      previousIndex -= 1;
    }

    let nextIndex = slot.index + 1;
    while (nextIndex < slots.length && !queried.has(nextIndex)) {
      nextIndex += 1;
    }

    const previousPoint = previousIndex >= 0 ? queried.get(previousIndex) : null;
    const nextPoint = nextIndex < slots.length ? queried.get(nextIndex) : null;

    if (previousPoint && nextPoint && nextIndex !== previousIndex) {
      const ratio = (slot.index - previousIndex) / (nextIndex - previousIndex);
      const duration = Math.round(previousPoint.duration + (nextPoint.duration - previousPoint.duration) * ratio);
      results.push(createForecastPoint(slot, duration, true));
      continue;
    }

    if (previousPoint) {
      results.push(createForecastPoint(slot, previousPoint.duration, true));
      continue;
    }

    if (nextPoint) {
      results.push(createForecastPoint(slot, nextPoint.duration, true));
      continue;
    }

    results.push(createForecastPoint(slot, 0, true));
  }

  return results;
}

function buildCacheEntry(
  points: ForecastPoint[],
  fingerprint: string,
  source: 'exact' | 'partial' | 'nearby',
  metrics: QueryMetrics,
  refinementLevel: number,
  metadata: Omit<CachedForecastEntry['metadata'], 'apiCallCount' | 'refinementLevel' | 'exactSampleCount'>
): CachedForecastEntry {
  const bestPoint = getBestAllowedPoint(points);
  const exactSampleCount = points.filter((point) => !point.isEstimated).length;
  const estimatedCount = points.length - exactSampleCount;
  const confidenceScore = Number(
    Math.max(0.2, Math.min(0.98, 1 - estimatedCount / Math.max(points.length, 1))).toFixed(2)
  );

  return {
    version: process.env.FORECAST_CACHE_VERSION || 'v1',
    createdAt: new Date().toISOString(),
    source,
    fingerprint,
    sampledPoints: points.filter((point) => !point.isEstimated),
    interpolatedPoints: points,
    confidenceScore,
    chosenBestTime: bestPoint
      ? {
          label: bestPoint.label,
          duration: bestPoint.duration,
          hour: bestPoint.hour
        }
      : undefined,
    metadata: {
      apiCallCount: metrics.apiCalls,
      refinementLevel,
      exactSampleCount,
      ...metadata
    }
  };
}

async function queryIndices(
  indices: number[],
  slots: ForecastSlot[],
  queried: Map<number, ForecastPoint>,
  origin: string,
  destination: string,
  apiKey: string,
  metrics: QueryMetrics
) {
  const pending = indices.filter((index) => !queried.has(index));
  const chunkSize = 3;

  for (let start = 0; start < pending.length; start += chunkSize) {
    const chunk = pending.slice(start, start + chunkSize);
    const values = await Promise.all(
      chunk.map(async (index) => {
        const slot = slots[index]!;
        const duration = await fetchDurationMinutes(origin, destination, slot.departureUnix, apiKey, metrics);
        return {
          index,
          point: createForecastPoint(slot, duration, false)
        };
      })
    );

    for (const value of values) {
      queried.set(value.index, value.point);
    }
  }
}

async function buildFullForecast(
  origin: string,
  destination: string,
  slots: ForecastSlot[],
  apiKey: string,
  metrics: QueryMetrics
) {
  const queried = new Map<number, ForecastPoint>();
  await queryIndices(
    slots.map((slot) => slot.index),
    slots,
    queried,
    origin,
    destination,
    apiKey,
    metrics
  );
  return slots.map((slot) => queried.get(slot.index) || createForecastPoint(slot, 0, true));
}

async function buildAdaptiveForecast(
  origin: string,
  destination: string,
  timeZone: string,
  startTime: dayjs.Dayjs,
  excludeNightHours: boolean,
  apiKey: string,
  exactFingerprint: string,
  nearbyFingerprint: string,
  departBucket: string,
  weekdayBucket: string,
  partialSeed: CachedForecastEntry | null,
  nearbySeed: CachedForecastEntry | null,
  savePartial: (entry: CachedForecastEntry) => Promise<void>
) {
  const slots = buildForecastSlots(startTime, timeZone, excludeNightHours);
  const queried = new Map<number, ForecastPoint>();
  const metrics: QueryMetrics = { apiCalls: 0 };

  for (const seedPoint of partialSeed?.sampledPoints || []) {
    const slotIndex = slots.findIndex(
      (slot) => slot.localTime.format('HH:mm') === seedPoint.label && slot.hour === seedPoint.hour
    );
    if (slotIndex >= 0) {
      queried.set(slotIndex, {
        ...seedPoint,
        isEstimated: false
      });
    }
  }

  const initialIndices = pickInitialSampleIndices(slots, nearbySeed);
  await queryIndices(initialIndices, slots, queried, origin, destination, apiKey, metrics);

  const stageOnePoints = interpolatePoints(slots, queried);
  await savePartial(
    buildCacheEntry(stageOnePoints, exactFingerprint, 'partial', metrics, 1, {
      exactFingerprint,
      nearbyFingerprint,
      departBucket,
      weekdayBucket,
      partialReady: true
    })
  );

  const refinementIndices = pickRefinementIndices(slots, queried);
  if (refinementIndices.length > 0) {
    await queryIndices(refinementIndices, slots, queried, origin, destination, apiKey, metrics);
  }

  let adaptivePoints = interpolatePoints(slots, queried);
  const bestPoint = getBestAllowedPoint(adaptivePoints);
  if (bestPoint?.isEstimated) {
    const estimatedBestIndex = adaptivePoints.findIndex(
      (point) => point.label === bestPoint.label && point.hour === bestPoint.hour
    );
    const extraIndices = toSortedUniqueIndices(
      [estimatedBestIndex - 1, estimatedBestIndex, estimatedBestIndex + 1].filter((index) => !queried.has(index)),
      slots.length
    );
    if (extraIndices.length > 0) {
      await queryIndices(extraIndices, slots, queried, origin, destination, apiKey, metrics);
      adaptivePoints = interpolatePoints(slots, queried);
    }
  }

  const cacheEntry = buildCacheEntry(adaptivePoints, exactFingerprint, 'exact', metrics, 2, {
    exactFingerprint,
    nearbyFingerprint,
    departBucket,
    weekdayBucket,
    partialReady: false
  });

  return {
    data: adaptivePoints,
    cacheEntry,
    apiCalls: metrics.apiCalls
  };
}

function compareForecasts(adaptivePoints: ForecastPoint[], fullPoints: ForecastPoint[]) {
  const adaptiveBest = getBestAllowedPoint(adaptivePoints);
  const fullBest = getBestAllowedPoint(fullPoints);

  return {
    sameBestHour: adaptiveBest?.hour === fullBest?.hour,
    adaptiveBestHour: adaptiveBest?.hour ?? null,
    fullBestHour: fullBest?.hour ?? null,
    adaptiveBestDuration: adaptiveBest?.duration ?? null,
    fullBestDuration: fullBest?.duration ?? null
  };
}

async function maybeRunShadowComparison(
  origin: string,
  destination: string,
  slots: ForecastSlot[],
  apiKey: string,
  adaptiveResult: ForecastComputationResult
) {
  if (!DEFAULT_SHADOW_SAMPLE_RATE || Number.isNaN(DEFAULT_SHADOW_SAMPLE_RATE) || Math.random() > DEFAULT_SHADOW_SAMPLE_RATE) {
    return adaptiveResult.cacheEntry.metadata;
  }

  console.log(`[Forecast] 🔬 Running shadow full-24h comparison`);

  const metrics: QueryMetrics = { apiCalls: 0 };
  const fullForecast = await buildFullForecast(origin, destination, slots, apiKey, metrics);
  const comparison = compareForecasts(adaptiveResult.data, fullForecast);

  return {
    ...adaptiveResult.cacheEntry.metadata,
    comparedWithFull: true,
    fullComparison: comparison
  };
}

async function resolveCachedOrComputeForecast(
  origin: string,
  destination: string,
  timeZone: string,
  departDate: string | null,
  excludeNightHours: boolean,
  apiKey: string
) {
  const startTime = getStartTime(departDate, timeZone);
  const { exactFingerprint, nearbyFingerprint, departBucket, weekdayBucket } = buildForecastFingerprints({
    origin,
    destination,
    timeZone,
    startTime,
    departDate,
    excludeNightHours
  });

  const cachedExact = await getCachedForecast('exact', exactFingerprint);
  if (cachedExact) {
    console.log(`[Forecast] ✅ Cache HIT (exact)`);
    return {
      data: cachedExact.interpolatedPoints,
      cached: true,
      metadata: {
        ...cachedExact.metadata,
        cacheStatus: 'exact',
        confidenceScore: cachedExact.confidenceScore,
        requestApiCallCount: 0
      }
    };
  }

  const cachedPartial = await getCachedForecast('partial', exactFingerprint);
  const nearbySeed = await getCachedForecast('nearby', nearbyFingerprint);

  if (forecastInFlight.has(exactFingerprint)) {
    const inFlight = await forecastInFlight.get(exactFingerprint)!;
    console.log(`[Forecast] ⏳ In-flight request deduped`);
    return {
      data: inFlight.data,
      cached: true,
      metadata: {
        ...inFlight.cacheEntry.metadata,
        cacheStatus: 'in_flight',
        confidenceScore: inFlight.cacheEntry.confidenceScore,
        requestApiCallCount: 0
      }
    };
  }

  const lockToken = createCacheLockToken();
  const lockAcquired = await acquireForecastLock(exactFingerprint, lockToken, LOCK_TTL_SECONDS);

  if (!lockAcquired) {
    const exactAfterWait = await waitForExactForecast(exactFingerprint);
    if (exactAfterWait) {
      return {
        data: exactAfterWait.interpolatedPoints,
        cached: true,
        metadata: {
          ...exactAfterWait.metadata,
          cacheStatus: 'exact_after_wait',
          confidenceScore: exactAfterWait.confidenceScore,
          requestApiCallCount: 0
        }
      };
    }

    if (cachedPartial) {
      return {
        data: cachedPartial.interpolatedPoints,
        cached: true,
        metadata: {
          ...cachedPartial.metadata,
          cacheStatus: 'partial',
          confidenceScore: cachedPartial.confidenceScore,
          requestApiCallCount: 0
        }
      };
    }
  }

  const requestPromise = (async () => {
    try {
      console.log(`[Forecast] 🔄 Computing new adaptive forecast`);
      const adaptiveResult = await buildAdaptiveForecast(
        origin,
        destination,
        timeZone,
        startTime,
        excludeNightHours,
        apiKey,
        exactFingerprint,
        nearbyFingerprint,
        departBucket,
        weekdayBucket,
        cachedPartial,
        nearbySeed,
        async (partialEntry) => {
          await setCachedForecast('partial', exactFingerprint, partialEntry, PARTIAL_CACHE_TTL_SECONDS);
        }
      );

      const slots = buildForecastSlots(startTime, timeZone, excludeNightHours);
      const metadata = await maybeRunShadowComparison(origin, destination, slots, apiKey, adaptiveResult);
      const exactEntry = {
        ...adaptiveResult.cacheEntry,
        metadata
      };
      const nearbyEntry = {
        ...exactEntry,
        source: 'nearby' as const,
        fingerprint: nearbyFingerprint
      };

      await setCachedForecast('exact', exactFingerprint, exactEntry, getExactCacheTtlSeconds(departDate));
      await setCachedForecast('nearby', nearbyFingerprint, nearbyEntry, NEARBY_CACHE_TTL_SECONDS);

      return {
        data: exactEntry.interpolatedPoints,
        cacheEntry: exactEntry,
        apiCalls: exactEntry.metadata.apiCallCount ?? 0
      };
    } finally {
      if (lockAcquired) {
        await releaseForecastLock(exactFingerprint, lockToken);
      }
    }
  })();

  forecastInFlight.set(exactFingerprint, requestPromise);

  try {
    const result = await requestPromise;
    return {
      data: result.data,
      cached: false,
      metadata: {
        ...result.cacheEntry.metadata,
        cacheStatus: nearbySeed ? 'nearby_seed' : cachedPartial ? 'partial_seed' : 'miss',
        confidenceScore: result.cacheEntry.confidenceScore,
        requestApiCallCount: result.apiCalls
      }
    };
  } finally {
    forecastInFlight.delete(exactFingerprint);
  }
}

export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const requestOrigin = getHeader(event, 'origin');
    if (requestOrigin !== ALLOWED_PRODUCTION_ORIGIN) {
      console.warn('[Forecast] Forbidden origin:', requestOrigin);
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden origin'
      });
    }

    const clientId = getClientIdentifier(event);
    const allowed = consumeRateLimit(clientId, Date.now());
    if (!allowed) {
      console.warn('[Forecast] Rate limit exceeded for client:', clientId);
      throw createError({
        statusCode: 429,
        statusMessage: 'Too many requests'
      });
    }
  }

  const body = await readBody<ForecastRequestBody>(event);
  const origin = body?.origin?.trim();
  const destination = body?.destination?.trim();

  if (!origin || !destination) {
    console.error('[Forecast] Missing origin or destination');
    throw createError({
      statusCode: 400,
      statusMessage: 'Origin and destination are required'
    });
  }

  const timeZone = body?.timezone || 'UTC';
  const departDate = body?.departDate || null;
  const excludeNightHours = Boolean(body?.excludeNightHours);

  const config = useRuntimeConfig();
  const apiKey =
    config.tomTomApiKey ||
    process.env.TOMTOM_API_KEY

  if (!apiKey) {
    console.error('[Forecast] ❌ No TomTom API key configured');
    throw createError({
      statusCode: 500,
      statusMessage: 'TomTom API key not configured. Please set TOMTOM_API_KEY in your environment.'
    });
  }

  const result = await resolveCachedOrComputeForecast(
    origin,
    destination,
    timeZone,
    departDate,
    excludeNightHours,
    apiKey
  );

  const durationMs = Date.now() - startTime;
  const apiCalls = result.metadata?.apiCallCount ?? result.metadata?.googleCallCount ?? 0;
  const bestPoint = result.data?.reduce((best, p) => (!best || p.duration < best.duration) && !p.isExcluded ? p : best, null as any);
  const bestTime = bestPoint ? `${bestPoint.label} (${bestPoint.duration}min)` : 'unknown';

  console.log(`[Forecast] Completed in ${durationMs}ms | cache=${result.metadata?.cacheStatus || 'unknown'} | tomTomCalls=${apiCalls} | best=${bestTime} | confidence=${result.metadata?.confidenceScore || 0} | refinement=${result.metadata?.refinementLevel || 0}`);

  setHeader(event, 'x-forecast-cache-status', String(result.metadata?.cacheStatus || 'unknown'));
  setHeader(event, 'x-forecast-api-calls', String(result.metadata?.apiCallCount ?? result.metadata?.googleCallCount ?? 0));
  setHeader(event, 'x-forecast-request-api-calls', String(result.metadata?.requestApiCallCount ?? 0));
  setHeader(
    event,
    'x-forecast-confidence',
    String(result.metadata?.confidenceScore ?? 0)
  );
  setHeader(event, 'x-forecast-refinement-level', String(result.metadata?.refinementLevel ?? 0));

  return {
    success: true,
    data: result.data,
    cached: result.cached,
    metadata: {
      ...result.metadata,
      confidenceScore: result.metadata?.confidenceScore ?? null
    }
  };
});
