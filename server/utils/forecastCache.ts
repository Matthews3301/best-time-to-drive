import { createHash, randomUUID } from 'node:crypto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export type CachedForecastPoint = {
  time: string;
  duration: number;
  label: string;
  hour: number;
  isExcluded: boolean;
  isEstimated?: boolean;
};

export type CachedForecastEntry = {
  version: string;
  createdAt: string;
  source: 'exact' | 'partial' | 'nearby';
  fingerprint: string;
  sampledPoints: CachedForecastPoint[];
  interpolatedPoints: CachedForecastPoint[];
  confidenceScore: number;
  chosenBestTime?: {
    label: string;
    duration: number;
    hour: number;
  };
  metadata: {
    googleCallCount: number;
    requestGoogleCallCount?: number;
    refinementLevel: number;
    exactSampleCount: number;
    nearbyFingerprint?: string;
    exactFingerprint?: string;
    departBucket?: string;
    weekdayBucket?: string;
    partialReady?: boolean;
    cacheStatus?: string;
    confidenceScore?: number | null;
    comparedWithFull?: boolean;
    fullComparison?: {
      sameBestHour: boolean;
      adaptiveBestHour: number | null;
      fullBestHour: number | null;
      adaptiveBestDuration: number | null;
      fullBestDuration: number | null;
    };
  };
};

type CacheKind = 'exact' | 'partial' | 'nearby';

type CacheStoreValue = {
  expiresAt: number;
  value: CachedForecastEntry;
};

type LockStoreValue = {
  expiresAt: number;
  token: string;
};

type ForecastFingerprintInput = {
  origin: string;
  destination: string;
  timeZone: string;
  startTime: dayjs.Dayjs;
  departDate?: string | null;
  excludeNightHours: boolean;
};

const CACHE_VERSION = process.env.FORECAST_CACHE_VERSION || 'v1';
const inMemoryCache = new Map<string, CacheStoreValue>();
const inMemoryLocks = new Map<string, LockStoreValue>();

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { url: url.replace(/\/$/, ''), token };
}

function getCacheKey(kind: CacheKind, fingerprint: string) {
  return `${CACHE_VERSION}:forecast:${kind}:${fingerprint}`;
}

function getLockKey(fingerprint: string) {
  return `${CACHE_VERSION}:forecast:lock:${fingerprint}`;
}

function pruneExpiredInMemoryEntries() {
  const now = Date.now();

  for (const [key, entry] of inMemoryCache.entries()) {
    if (entry.expiresAt <= now) {
      inMemoryCache.delete(key);
    }
  }

  for (const [key, entry] of inMemoryLocks.entries()) {
    if (entry.expiresAt <= now) {
      inMemoryLocks.delete(key);
    }
  }
}

async function runRedisCommand(command: unknown[]) {
  const config = getUpstashConfig();
  if (!config) {
    return null;
  }

  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    throw new Error(`Upstash command failed with status ${response.status}`);
  }

  const payload = await response.json();
  return payload?.result ?? null;
}

async function getRedisEntry(key: string): Promise<CachedForecastEntry | null> {
  const result = await runRedisCommand(['GET', key]);
  if (!result || typeof result !== 'string') {
    return null;
  }

  try {
    return JSON.parse(result) as CachedForecastEntry;
  } catch {
    return null;
  }
}

async function setRedisEntry(key: string, value: CachedForecastEntry, ttlSeconds: number) {
  await runRedisCommand(['SET', key, JSON.stringify(value), 'EX', String(ttlSeconds)]);
}

async function deleteRedisKey(key: string) {
  await runRedisCommand(['DEL', key]);
}

async function getRedisLockToken(key: string) {
  const result = await runRedisCommand(['GET', key]);
  return typeof result === 'string' ? result : null;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function hashValue(value: string) {
  return createHash('sha1').update(value).digest('hex').slice(0, 16);
}

function parseCoordinatePair(value: string) {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) {
    return null;
  }

  return {
    lat: Number(match[1]),
    lng: Number(match[2])
  };
}

function roundCoordinate(value: number, decimals: number) {
  return value.toFixed(decimals);
}

function getLocationFingerprint(value: string, decimals: number) {
  const coordinates = parseCoordinatePair(value);
  if (coordinates) {
    return `coord:${roundCoordinate(coordinates.lat, decimals)},${roundCoordinate(coordinates.lng, decimals)}`;
  }

  return `text:${hashValue(normalizeText(value))}`;
}

function getDistanceBucket(origin: string, destination: string) {
  const originCoordinates = parseCoordinatePair(origin);
  const destinationCoordinates = parseCoordinatePair(destination);

  if (!originCoordinates || !destinationCoordinates) {
    return 'unknown';
  }

  const latDistance = originCoordinates.lat - destinationCoordinates.lat;
  const lngDistance = originCoordinates.lng - destinationCoordinates.lng;
  const roughDistance = Math.sqrt(latDistance * latDistance + lngDistance * lngDistance);

  if (roughDistance < 0.1) {
    return 'xs';
  }
  if (roughDistance < 0.5) {
    return 's';
  }
  if (roughDistance < 2) {
    return 'm';
  }
  if (roughDistance < 6) {
    return 'l';
  }
  return 'xl';
}

function getWeekdayBucket(startTime: dayjs.Dayjs) {
  const dayOfWeek = startTime.day();
  return dayOfWeek === 0 || dayOfWeek === 6 ? 'weekend' : 'weekday';
}

function getDepartBucket(startTime: dayjs.Dayjs, timeZone: string, departDate?: string | null) {
  const now = dayjs().tz(timeZone);
  if (!departDate) {
    return `now:${startTime.format('YYYY-MM-DD-HH')}`;
  }

  const diffDays = startTime.startOf('day').diff(now.startOf('day'), 'day');
  if (diffDays <= 1) {
    return `tomorrow:${startTime.format('YYYY-MM-DD')}`;
  }

  return `future:${startTime.format('YYYY-MM-DD')}`;
}

export function buildForecastFingerprints(input: ForecastFingerprintInput) {
  const originExact = getLocationFingerprint(input.origin, 3);
  const destinationExact = getLocationFingerprint(input.destination, 3);
  const originNearby = getLocationFingerprint(input.origin, 2);
  const destinationNearby = getLocationFingerprint(input.destination, 2);
  const weekdayBucket = getWeekdayBucket(input.startTime);
  const departBucket = getDepartBucket(input.startTime, input.timeZone, input.departDate);
  const excludeBucket = input.excludeNightHours ? 'exclude' : 'all';
  const directionBucket = `${originExact}->${destinationExact}`;
  const exactFingerprint = hashValue(
    [
      input.timeZone,
      directionBucket,
      weekdayBucket,
      departBucket,
      excludeBucket
    ].join('|')
  );
  const nearbyFingerprint = hashValue(
    [
      input.timeZone,
      `${originNearby}->${destinationNearby}`,
      weekdayBucket,
      excludeBucket,
      getDistanceBucket(input.origin, input.destination)
    ].join('|')
  );

  return {
    exactFingerprint,
    nearbyFingerprint,
    departBucket,
    weekdayBucket
  };
}

export function createCacheLockToken() {
  return randomUUID();
}

export async function getCachedForecast(kind: CacheKind, fingerprint: string) {
  pruneExpiredInMemoryEntries();
  const key = getCacheKey(kind, fingerprint);
  const local = inMemoryCache.get(key);

  if (local && local.expiresAt > Date.now()) {
    return local.value;
  }

  if (local) {
    inMemoryCache.delete(key);
  }

  const remote = await getRedisEntry(key);
  if (remote) {
    return remote;
  }

  return null;
}

export async function setCachedForecast(
  kind: CacheKind,
  fingerprint: string,
  value: CachedForecastEntry,
  ttlSeconds: number
) {
  const key = getCacheKey(kind, fingerprint);
  const expiresAt = Date.now() + ttlSeconds * 1000;

  inMemoryCache.set(key, {
    value,
    expiresAt
  });

  if (getUpstashConfig()) {
    await setRedisEntry(key, value, ttlSeconds);
  }
}

export async function acquireForecastLock(fingerprint: string, token: string, ttlSeconds: number) {
  pruneExpiredInMemoryEntries();
  const key = getLockKey(fingerprint);
  const now = Date.now();
  const local = inMemoryLocks.get(key);

  if (!getUpstashConfig()) {
    if (local && local.expiresAt > now) {
      return false;
    }

    inMemoryLocks.set(key, {
      token,
      expiresAt: now + ttlSeconds * 1000
    });

    return true;
  }

  const result = await runRedisCommand(['SET', key, token, 'EX', String(ttlSeconds), 'NX']);
  return result === 'OK';
}

export async function releaseForecastLock(fingerprint: string, token: string) {
  const key = getLockKey(fingerprint);
  const local = inMemoryLocks.get(key);

  if (local?.token === token) {
    inMemoryLocks.delete(key);
  }

  if (!getUpstashConfig()) {
    return;
  }

  const remoteToken = await getRedisLockToken(key);
  if (remoteToken === token) {
    await deleteRedisKey(key);
  }
}

export async function waitForExactForecast(
  fingerprint: string,
  attempts = 4,
  delayMs = 250
) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const exact = await getCachedForecast('exact', fingerprint);
    if (exact) {
      return exact;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return null;
}
