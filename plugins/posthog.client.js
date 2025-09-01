import { defineNuxtPlugin } from '#app'
import posthog from 'posthog-js'

export default defineNuxtPlugin(nuxtApp => {
  // Check if VITE_ENV is set to "dev" to prevent PostHog from running
  if (import.meta.env.VITE_ENV === 'dev') {
    console.log('PostHog disabled: VITE_ENV is set to "dev"')
    return {
      provide: {
        posthog: () => ({
          // Provide a mock PostHog object with no-op methods
          capture: () => {},
          identify: () => {},
          set: () => {},
          get: () => null,
          isFeatureEnabled: () => false,
          onFeatureFlags: () => {},
          reloadFeatureFlags: () => {},
          debug: () => {},
          opt_out_capturing: () => {},
          opt_in_capturing: () => {},
          has_opted_out_capturing: () => false,
          has_opted_in_capturing: () => false,
          clear_opt_in_out_capturing: () => {},
          group: () => {},
          alias: () => {},
          register: () => {},
          unregister: () => {},
          reset: () => {},
          shutdown: () => {}
        })
      }
    }
  }

  const runtimeConfig = useRuntimeConfig();
  const posthogClient = posthog.init(runtimeConfig.public.posthogPublicKey, {
    api_host: runtimeConfig.public.posthogHost,
    defaults: runtimeConfig.public.posthogDefaults,
    person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
    loaded: (posthog) => {
      if (import.meta.env.MODE === 'development') posthog.debug();
    }
  })

  return {
    provide: {
      posthog: () => posthogClient
    }
  }
})
