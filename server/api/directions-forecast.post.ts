import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

type ForecastPoint = {
  time: string;
  duration: number;
  label: string;
  hour: number;
  isExcluded: boolean;
};

type ForecastRequestBody = {
  origin: string;
  destination: string;
  timezone?: string;
  departDate?: string | null;
  excludeNightHours?: boolean;
};

const forecastCache = new Map<string, { expiresAt: number; data: ForecastPoint[] }>();
const forecastInFlight = new Map<string, Promise<ForecastPoint[]>>();
const requestRateLimits = new Map<string, { count: number; resetAt: number }>();
const ALLOWED_PRODUCTION_ORIGIN = 'https://rushhourplanner.com';
const RATE_LIMIT_MAX_REQUESTS = 40;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStartTime(departDate: string | null | undefined, timeZone: string) {
  if (departDate) {
    return dayjs.tz(`${departDate} 00:00:00`, timeZone);
  }
  return dayjs().tz(timeZone).startOf('hour');
}

function getCacheKey(origin: string, destination: string, timeZone: string, startUnix: number) {
  return `${origin}|${destination}|${timeZone}|${startUnix}`;
}

function getCacheTtlMs(departDate: string | null | undefined) {
  if (departDate) {
    return 24 * 60 * 60 * 1000;
  }
  return 10 * 60 * 1000;
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
  apiKey: string
) {
  const buildUrl = (options: { departureTime?: number | 'now'; includeTrafficModel: boolean }) => {
    const params = new URLSearchParams({
      origin,
      destination,
      mode: 'driving',
      alternatives: 'false',
      key: apiKey
    });

    if (options.departureTime !== undefined) {
      params.set('departure_time', String(options.departureTime));
    }
    if (options.includeTrafficModel) {
      params.set('traffic_model', 'best_guess');
    }

    return `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;
  };

  const requestWith = async (
    options: { departureTime?: number | 'now'; includeTrafficModel: boolean }
  ): Promise<number> => {
    const url = buildUrl(options);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(url);

      if (!response.ok) {
        if (attempt < 2) {
          await wait(300 * (attempt + 1));
          continue;
        }
        throw createError({
          statusCode: response.status,
          statusMessage: 'Failed to fetch directions from Google'
        });
      }

      const payload = await response.json();
      const status = payload?.status;

      if (status === 'OK') {
        const firstLeg = payload?.routes?.[0]?.legs?.[0];
        const durationSeconds = firstLeg?.duration_in_traffic?.value ?? firstLeg?.duration?.value;

        if (typeof durationSeconds !== 'number') {
          throw createError({
            statusCode: 502,
            statusMessage: 'Directions response did not include duration'
          });
        }

        return Math.max(1, Math.round(durationSeconds / 60));
      }

      if ((status === 'OVER_QUERY_LIMIT' || status === 'UNKNOWN_ERROR') && attempt < 2) {
        await wait(600 * (attempt + 1));
        continue;
      }

      const errorMessage = payload?.error_message ? ` (${payload.error_message})` : '';
      throw createError({
        statusCode: 502,
        statusMessage: `Google Directions error: ${status || 'UNKNOWN'}${errorMessage}`
      });
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'Unable to calculate directions forecast'
    });
  };

  try {
    return await requestWith({ departureTime: departureUnix, includeTrafficModel: true });
  } catch (error: any) {
    const message = String(error?.statusMessage || error?.message || '');
    if (!message.includes('INVALID_REQUEST')) {
      throw error;
    }
  }

  try {
    return await requestWith({ departureTime: 'now', includeTrafficModel: true });
  } catch (error: any) {
    const message = String(error?.statusMessage || error?.message || '');
    if (!message.includes('INVALID_REQUEST')) {
      throw error;
    }
  }

  return requestWith({ includeTrafficModel: false });
}

async function buildForecast(
  origin: string,
  destination: string,
  timeZone: string,
  startTime: dayjs.Dayjs,
  excludeNightHours: boolean,
  apiKey: string
) {
  const hourlyDepartures = Array.from({ length: 24 }, (_, i) => startTime.add(i, 'hour').unix());
  const result: ForecastPoint[] = new Array(24);
  const nowUnix = dayjs().unix();
  let cursor = 0;

  const workerCount = 2;
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= hourlyDepartures.length) {
        return;
      }

      const slotUnix = hourlyDepartures[index];
      const departureUnix = Math.max(slotUnix, nowUnix);
      const localTime = dayjs.unix(slotUnix).tz(timeZone);
      const hour = localTime.hour();
      const duration = await fetchDurationMinutes(origin, destination, departureUnix, apiKey);

      result[index] = {
        time: localTime.toISOString(),
        duration,
        label: localTime.format('HH:mm'),
        hour,
        isExcluded: excludeNightHours && (hour >= 23 || hour <= 5)
      };
    }
  });

  await Promise.all(workers);
  return result;
}

export default defineEventHandler(async (event) => {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    const requestOrigin = getHeader(event, 'origin');
    if (requestOrigin !== ALLOWED_PRODUCTION_ORIGIN) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden origin'
      });
    }

    const clientId = getClientIdentifier(event);
    const allowed = consumeRateLimit(clientId, Date.now());
    if (!allowed) {
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
    config.googleDirectionsApiKey ||
    process.env.GOOGLE_DIRECTIONS_API_KEY ||
    config.viteGoogleMapsApiKey ||
    process.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Google Maps API key not configured'
    });
  }

  const startTime = getStartTime(departDate, timeZone);
  const startUnix = startTime.unix();
  const cacheKey = getCacheKey(origin, destination, timeZone, startUnix);
  const now = Date.now();

  const cached = forecastCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return {
      success: true,
      data: cached.data,
      cached: true
    };
  }

  if (forecastInFlight.has(cacheKey)) {
    const inFlightData = await forecastInFlight.get(cacheKey)!;
    return {
      success: true,
      data: inFlightData,
      cached: true
    };
  }

  const requestPromise = buildForecast(
    origin,
    destination,
    timeZone,
    startTime,
    excludeNightHours,
    apiKey
  );

  forecastInFlight.set(cacheKey, requestPromise);

  try {
    const data = await requestPromise;
    forecastCache.set(cacheKey, {
      data,
      expiresAt: now + getCacheTtlMs(departDate)
    });

    return {
      success: true,
      data,
      cached: false
    };
  } finally {
    forecastInFlight.delete(cacheKey);
  }
});
