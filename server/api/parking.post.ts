import {
  acquireParkingLock,
  buildParkingFingerprint,
  createParkingLockToken,
  getCachedParking,
  PARKING_CACHE_TTL_SECONDS,
  PARKING_LOCK_TTL_SECONDS,
  parseRetryAfterMs,
  releaseParkingLock,
  setCachedParking,
  waitForCachedParking,
  type ParkingData
} from '../utils/parkingCache';

const parkingInFlight = new Map<string, Promise<ParkingData>>();
const OPENAI_MAX_ATTEMPTS = 3;

type ParkingErrorData = {
  code: string;
  retryAfterSeconds?: number;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createParkingError(statusCode: number, statusMessage: string, data: ParkingErrorData) {
  return createError({
    statusCode,
    statusMessage,
    data
  });
}

function mapProviderFailure(status: number) {
  if (status === 429) {
    return createParkingError(
      503,
      'Parking information is temporarily unavailable due to high demand. Please try again in a few minutes.',
      {
        code: 'PROVIDER_RATE_LIMITED',
        retryAfterSeconds: 60
      }
    );
  }

  if (status === 401 || status === 403) {
    return createParkingError(
      502,
      'Parking information is temporarily unavailable.',
      { code: 'PROVIDER_AUTH' }
    );
  }

  return createParkingError(
    502,
    'Parking information is temporarily unavailable. Please try again shortly.',
    { code: 'PROVIDER_ERROR' }
  );
}

function parseParkingPayload(content: string): ParkingData {
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parkingData = JSON.parse(cleanContent) as ParkingData;

  if (!parkingData || !Array.isArray(parkingData.parkingLocations)) {
    throw new Error('Invalid parking payload');
  }

  return parkingData;
}

async function fetchParkingFromOpenAi(destination: string, openaiApiKey: string): Promise<ParkingData> {
  const prompt = `I'm driving to ${destination}. List places to park. List car parks, street parking and any other options. Include prices, times and necessary permits if you can find this.

Return your response in the following JSON format (return ONLY valid JSON, no markdown formatting or code blocks):
{
  "parkingLocations": [
    {
      "name": "string - name of the parking location",
      "category": "string - one of: Car Park, Street Parking, Garage, Lot, Other",
      "location": "string - specific address or location description",
      "paymentInfo": "string - pricing information and payment methods",
      "hours": "string - operating hours or time restrictions. Use short time formats like '9am-5pm' or '24 hours', 'Sat', 'Mon', etc.",
      "description": "string - additional details about the parking option, keep short, just the important information"
    }
  ],
  "otherInformation": "string - any additional relevant parking information, tips, or restrictions for the area. Keep short, just the important information"
}`;

  let lastStatus = 502;

  for (let attempt = 0; attempt < OPENAI_MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that provides accurate parking information for locations. Always return valid JSON without any markdown formatting or code blocks.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw createParkingError(502, 'Parking information is temporarily unavailable. Please try again shortly.', {
          code: 'PROVIDER_EMPTY'
        });
      }

      try {
        return parseParkingPayload(content);
      } catch {
        console.error('[Parking] Failed to parse OpenAI response');
        throw createParkingError(502, 'Parking information could not be read. Please try again shortly.', {
          code: 'PROVIDER_PARSE'
        });
      }
    }

    lastStatus = response.status;
    let errorDetail = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorDetail = errorData?.error?.message || errorData?.message || errorDetail;
      console.error('[Parking] OpenAI API error:', errorData);
    } catch {
      console.error('[Parking] OpenAI API error with unreadable body:', response.status);
    }

    const retryable = response.status === 429 || response.status === 500 || response.status === 502 || response.status === 503;
    if (retryable && attempt < OPENAI_MAX_ATTEMPTS - 1) {
      const backoffMs = parseRetryAfterMs(response.headers.get('retry-after'), 1000 * 2 ** attempt);
      console.warn(`[Parking] Retry ${attempt + 1}/${OPENAI_MAX_ATTEMPTS - 1} after ${backoffMs}ms: ${errorDetail}`);
      await wait(backoffMs);
      continue;
    }

    throw mapProviderFailure(lastStatus);
  }

  throw mapProviderFailure(lastStatus);
}

async function resolveParking(destination: string, openaiApiKey: string) {
  const fingerprint = buildParkingFingerprint(destination);
  const cached = await getCachedParking(fingerprint);
  if (cached) {
    console.log('[Parking] Cache HIT');
    return {
      data: cached.data,
      cacheStatus: 'hit' as const
    };
  }

  const inFlight = parkingInFlight.get(fingerprint);
  if (inFlight) {
    console.log('[Parking] In-flight request deduped');
    return {
      data: await inFlight,
      cacheStatus: 'in_flight' as const
    };
  }

  const lockToken = createParkingLockToken();
  const lockAcquired = await acquireParkingLock(fingerprint, lockToken, PARKING_LOCK_TTL_SECONDS);

  if (!lockAcquired) {
    const cachedAfterWait = await waitForCachedParking(fingerprint, 12, 1000);
    if (cachedAfterWait) {
      return {
        data: cachedAfterWait.data,
        cacheStatus: 'exact_after_wait' as const
      };
    }

    throw createParkingError(
      503,
      'Parking information is temporarily unavailable due to high demand. Please try again in a few minutes.',
      {
        code: 'PROVIDER_RATE_LIMITED',
        retryAfterSeconds: 60
      }
    );
  }

  const requestPromise = (async () => {
    try {
      console.log('[Parking] Cache MISS, fetching from provider');
      const data = await fetchParkingFromOpenAi(destination, openaiApiKey);
      await setCachedParking(fingerprint, destination, data, PARKING_CACHE_TTL_SECONDS);
      return data;
    } finally {
      if (lockAcquired) {
        await releaseParkingLock(fingerprint, lockToken);
      }
    }
  })();

  parkingInFlight.set(fingerprint, requestPromise);

  try {
    return {
      data: await requestPromise,
      cacheStatus: 'miss' as const
    };
  } finally {
    parkingInFlight.delete(fingerprint);
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const destination = typeof body?.destination === 'string' ? body.destination.trim() : '';

  if (!destination) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Destination address is required'
    });
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Parking service is not configured'
    });
  }

  try {
    const result = await resolveParking(destination, openaiApiKey);

    setHeader(event, 'x-parking-cache-status', result.cacheStatus);
    if (result.cacheStatus === 'hit' || result.cacheStatus === 'in_flight' || result.cacheStatus === 'exact_after_wait') {
      setHeader(event, 'x-parking-cached', '1');
    }

    return {
      success: true,
      data: result.data,
      cached: result.cacheStatus !== 'miss'
    };
  } catch (error: any) {
    console.error('[Parking] Error fetching parking information:', error?.statusMessage || error?.message || error);

    if (error?.data?.retryAfterSeconds) {
      setHeader(event, 'Retry-After', String(error.data.retryAfterSeconds));
    }

    if (error?.statusCode) {
      throw error;
    }

    throw createParkingError(
      502,
      'Parking information is temporarily unavailable. Please try again shortly.',
      { code: 'PROVIDER_ERROR' }
    );
  }
});
