import { captureTomTomRateLimited } from '../utils/posthog'

/**
 * Server-side alert signal: when TomTom Routing returns HTTP 429
 * (prepaid empty / provider rate limit), emit PostHog `tomtom_rate_limited`.
 *
 * Distinct from the app's own client rate limit ("Too many requests"), which
 * never calls TomTom and therefore never hits this wrapper.
 */
export default defineNitroPlugin(() => {
  if (process.env.VITE_ENV === 'dev') {
    return
  }

  const originalFetch = globalThis.fetch.bind(globalThis)
  /** Attempt counters keyed by TomTom path (no query string → no API key). */
  const attemptByPath = new Map<string, number>()

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url

    const response = await originalFetch(input, init)

    if (
      typeof url === 'string' &&
      url.includes('api.tomtom.com/routing/') &&
      response.status === 429
    ) {
      const pathKey = url.split('?')[0] || 'tomtom-routing'
      const attempt = (attemptByPath.get(pathKey) || 0) + 1
      attemptByPath.set(pathKey, attempt)
      // Drop counter after the retry window so later bursts start at attempt 1.
      setTimeout(() => {
        attemptByPath.delete(pathKey)
      }, 60_000)

      captureTomTomRateLimited(attempt, 429)
    }

    return response
  }
})
