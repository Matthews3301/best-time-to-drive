import { createHash, randomUUID } from 'node:crypto';

export type ParkingLocation = {
  name: string;
  category: string;
  location: string;
  paymentInfo: string;
  hours: string;
  description: string;
};

export type ParkingData = {
  parkingLocations: ParkingLocation[];
  otherInformation?: string;
};

export type CachedParkingEntry = {
  version: string;
  createdAt: string;
  fingerprint: string;
  destination: string;
  data: ParkingData;
};

type CacheStoreValue = {
  expiresAt: number;
  value: CachedParkingEntry;
};

type LockStoreValue = {
  expiresAt: number;
  token: string;
};

const CACHE_VERSION = process.env.PARKING_CACHE_VERSION || 'v1';
const inMemoryCache = new Map<string, CacheStoreValue>();
const inMemoryLocks = new Map<string, LockStoreValue>();

export const PARKING_CACHE_TTL_SECONDS = Number(
  process.env.PARKING_CACHE_TTL_SECONDS || String(24 * 60 * 60)
);
export const PARKING_LOCK_TTL_SECONDS = 60;

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { url: url.replace(/\/$/, ''), token };
}

function getCacheKey(fingerprint: string) {
  return `${CACHE_VERSION}:parking:${fingerprint}`;
}

function getLockKey(fingerprint: string) {
  return `${CACHE_VERSION}:parking:lock:${fingerprint}`;
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

function isParkingData(value: unknown): value is ParkingData {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const data = value as ParkingData;
  return Array.isArray(data.parkingLocations);
}

function parseCachedEntry(raw: string): CachedParkingEntry | null {
  try {
    const parsed = JSON.parse(raw) as CachedParkingEntry;
    if (!parsed?.data || !isParkingData(parsed.data)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function getRedisEntry(key: string): Promise<CachedParkingEntry | null> {
  try {
    const result = await runRedisCommand(['GET', key]);
    if (!result || typeof result !== 'string') {
      return null;
    }
    return parseCachedEntry(result);
  } catch (error) {
    console.warn('[Parking] Redis get failed:', error);
    return null;
  }
}

async function setRedisEntry(key: string, value: CachedParkingEntry, ttlSeconds: number) {
  try {
    await runRedisCommand(['SET', key, JSON.stringify(value), 'EX', String(ttlSeconds)]);
  } catch (error) {
    console.warn('[Parking] Redis set failed:', error);
  }
}

async function deleteRedisKey(key: string) {
  try {
    await runRedisCommand(['DEL', key]);
  } catch (error) {
    console.warn('[Parking] Redis delete failed:', error);
  }
}

async function getRedisLockToken(key: string) {
  try {
    const result = await runRedisCommand(['GET', key]);
    return typeof result === 'string' ? result : null;
  } catch (error) {
    console.warn('[Parking] Redis lock read failed:', error);
    return null;
  }
}

export function normalizeDestination(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function buildParkingFingerprint(destination: string) {
  return createHash('sha1').update(normalizeDestination(destination)).digest('hex').slice(0, 16);
}

export function createParkingLockToken() {
  return randomUUID();
}

export function parseRetryAfterMs(header: string | null, fallbackMs: number) {
  if (!header) {
    return fallbackMs;
  }

  const asSeconds = Number(header);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.min(asSeconds * 1000, 15_000);
  }

  const asDate = Date.parse(header);
  if (!Number.isNaN(asDate)) {
    return Math.min(Math.max(asDate - Date.now(), 0), 15_000);
  }

  return fallbackMs;
}

export async function getCachedParking(fingerprint: string) {
  pruneExpiredInMemoryEntries();
  const key = getCacheKey(fingerprint);
  const local = inMemoryCache.get(key);

  if (local && local.expiresAt > Date.now()) {
    return local.value;
  }

  if (local) {
    inMemoryCache.delete(key);
  }

  return await getRedisEntry(key);
}

export async function setCachedParking(
  fingerprint: string,
  destination: string,
  data: ParkingData,
  ttlSeconds = PARKING_CACHE_TTL_SECONDS
) {
  const key = getCacheKey(fingerprint);
  const value: CachedParkingEntry = {
    version: CACHE_VERSION,
    createdAt: new Date().toISOString(),
    fingerprint,
    destination,
    data
  };
  const expiresAt = Date.now() + ttlSeconds * 1000;

  inMemoryCache.set(key, {
    value,
    expiresAt
  });

  if (getUpstashConfig()) {
    await setRedisEntry(key, value, ttlSeconds);
  }
}

export async function acquireParkingLock(fingerprint: string, token: string, ttlSeconds: number) {
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

  try {
    const result = await runRedisCommand(['SET', key, token, 'EX', String(ttlSeconds), 'NX']);
    return result === 'OK';
  } catch (error) {
    console.warn('[Parking] Redis lock acquire failed:', error);
    return true;
  }
}

export async function releaseParkingLock(fingerprint: string, token: string) {
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

export async function waitForCachedParking(
  fingerprint: string,
  attempts = 8,
  delayMs = 750
) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const cached = await getCachedParking(fingerprint);
    if (cached) {
      return cached;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return null;
}
