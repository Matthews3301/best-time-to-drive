import { PostHog } from 'posthog-node'

type CaptureProperties = Record<string, string | number | boolean | null | undefined>

let posthogClient: PostHog | null = null
let initAttempted = false

function shouldCapture(): boolean {
  // Match client plugin: disable analytics noise in local/dev.
  if (process.env.VITE_ENV === 'dev') {
    return false
  }
  return true
}

function getPostHogClient(): PostHog | null {
  if (!shouldCapture()) {
    return null
  }
  if (initAttempted) {
    return posthogClient
  }
  initAttempted = true

  try {
    const config = useRuntimeConfig()
    const apiKey = config.public.posthogPublicKey
    const host = config.public.posthogHost

    if (!apiKey || typeof apiKey !== 'string') {
      console.warn('[PostHog] Missing public.posthogPublicKey; server capture disabled')
      return null
    }

    posthogClient = new PostHog(apiKey, {
      host: typeof host === 'string' && host ? host : 'https://us.i.posthog.com',
      // Serverless-friendly: flush promptly after each capture.
      flushAt: 1,
      flushInterval: 0
    })
  } catch (error) {
    console.error('[PostHog] Failed to initialize server client:', error)
    posthogClient = null
  }

  return posthogClient
}

/**
 * Fire-and-forget server-side PostHog capture.
 * Never throws; safe to call from request handlers / retries.
 */
export function captureServerEvent(
  event: string,
  properties: CaptureProperties = {},
  distinctId = 'server'
): void {
  try {
    const client = getPostHogClient()
    if (!client) {
      return
    }

    const cleaned: Record<string, string | number | boolean | null> = {}
    for (const [key, value] of Object.entries(properties)) {
      if (value !== undefined) {
        cleaned[key] = value
      }
    }

    client.capture({
      distinctId,
      event,
      properties: cleaned
    })

    // Best-effort flush for short-lived serverless invocations.
    void client.flush().catch((error: unknown) => {
      console.error('[PostHog] flush failed:', error)
    })
  } catch (error) {
    console.error('[PostHog] capture failed:', error)
  }
}

/** Distinct event for TomTom Routing prepaid-empty / rate-limit (HTTP 429). */
export function captureTomTomRateLimited(attempt: number, httpStatus = 429): void {
  captureServerEvent('tomtom_rate_limited', {
    provider: 'tomtom',
    http_status: httpStatus,
    attempt
  })
}
