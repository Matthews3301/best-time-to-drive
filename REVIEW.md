# Parking reliability review

Short notes from the parking 429 investigation. Scope stayed limited to the parking path.

## What is solid about the forecast path

`server/api/directions-forecast.post.ts` plus `server/utils/forecastCache.ts` already treat provider cost and rate limits as a product problem:

- Destination/origin fingerprints, exact + nearby + partial cache layers, and Upstash Redis when `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are set
- In-process in-flight dedupe plus Redis/memory locks so cache misses do not stampede TomTom
- Retries with longer backoff on 429, and `NO_ROUTE_FOUND` mapped to a clear 422 instead of a raw provider status
- Production origin allowlist and a per-client request cap

That is why forecast stays usable under load while parking did not.

## Parking risks (before this fix)

`POST /api/parking` called OpenAI `gpt-4o-mini` on every request with no cache, lock, or retry. A non-OK provider response was forwarded as-is:

```ts
throw createError({
  statusCode: response.status,
  statusMessage: 'Failed to fetch parking information'
});
```

Production reproduced this for `{"destination":"Long Beach, CA"}` as HTTP 429 in ~700ms. Long Beach is also a popular sample destination, so repeat traffic (scroll-triggered load + Try Again) kept hitting the same uncached OpenAI call.

The UI discarded the server body and always showed "Failed to fetch parking information", then offered an immediate retry that made the rate limit worse.

## What this change does

- Destination-keyed cache (24h, in-memory + Upstash when configured)
- In-flight dedupe and a short lock so concurrent lookups share one provider call
- Up to 3 OpenAI attempts with backoff, honoring `Retry-After` when present
- Provider 429/5xx mapped to 503/502 with a specific message, not a raw OpenAI status
- Client shows that message and disables Try Again during a cooldown

## Prioritized follow-ups

1. Confirm Upstash env vars are set in the production Vercel project. Without them, cache is per-instance only and cold starts still miss.
2. Add a light per-client cap on `/api/parking` (forecast already has one) so a single browser cannot burn the OpenAI quota.
3. Stop using a general LLM as the source of parking prices/permits, or at least ground it in a maps/places API. Cached LLM output can be stale or wrong.
4. Auto-load on scroll still fires a request as soon as parking is in view. A click-to-load default would cut unnecessary spend.
5. Extract shared Upstash helpers from forecast + parking caches if a third endpoint needs the same pattern.
