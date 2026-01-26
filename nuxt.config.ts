// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  
  // Enable SSR for better SEO
  ssr: true,
  
  // Pre-render blog routes for better SEO
  nitro: {
    prerender: {
      routes: [
        '/blog',
        '/blog/beat-traffic-chiefs-vs-giants-commute-tips',
        '/blog/science-behind-rush-hour-traffic-patterns',
        '/blog/best-times-to-drive-city-guide',
        '/blog/how-weather-affects-traffic'
      ]
    }
  },

  runtimeConfig: {
    viteGoogleMapsApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY,
    public: {
      posthogPublicKey: 'phc_FmUMk4eqO4o2qhDhzzp2nhXZmmQE9mA1CGwrxpyxuhd',
      posthogHost: 'https://us.i.posthog.com',
      posthogDefaults: '2025-05-24'
    }
  },

  css: ['~/global.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  app: {
    head: {
      title: 'Rush Hour Traffic Estimator - Free Traffic Forecast & Route Planner | Avoid Rush Hour',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
        { name: 'description', content: 'Free rush hour traffic estimator tool. Get accurate traffic forecasts, find optimal driving times, and plan your commute to avoid rush hour congestion. Our traffic estimator analyzes 24-hour patterns to tell you exactly when to leave for the fastest journey.' },
        { name: 'keywords', content: 'rush hour traffic estimator, traffic estimator, rush hour estimator, free traffic estimator, traffic forecast estimator, rush hour traffic calculator, traffic prediction estimator, commute time estimator, driving time estimator, traffic analysis estimator, rush hour avoidance estimator, traffic timing estimator, best time to drive estimator, traffic flow estimator, peak traffic estimator, off peak traffic estimator, rush hour planner, traffic forecast, avoid rush hour, route planner, traffic analysis, Google Maps, driving time, traffic patterns, commute planner, travel optimization, when is the best time to drive, best time to drive to work, what time should I leave to avoid traffic, when to leave for work, rush hour times, traffic congestion planner, optimal driving time, best time to travel, when is traffic lightest, avoid morning rush hour, avoid evening rush hour, commute time calculator, traffic prediction app, drive time optimizer, when should I leave, best departure time, traffic timing tool, rush hour avoidance, peak traffic hours, off peak driving times, traffic flow analysis, smart commute timing, when to drive to avoid congestion, best time to drive home, morning commute planner, evening commute planner, traffic schedule planner, drive time predictor, when is rush hour, traffic peak times, best driving hours, optimal travel time, traffic light times, when to leave home, commute optimization, traffic timing strategy, rush calculator, estimator, map' },
        { name: 'author', content: 'Rush Hour Planner' },
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        { name: 'language', content: 'English' },
        { name: 'geo.region', content: 'US' },
        { name: 'geo.placename', content: 'United States' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://rushhourplanner.com/' },
        { property: 'og:title', content: 'Rush Hour Traffic Estimator - Free Traffic Forecast & Route Planner' },
        { property: 'og:description', content: 'Free rush hour traffic estimator tool. Get accurate traffic forecasts, find optimal driving times, and plan your commute to avoid rush hour congestion. Our traffic estimator analyzes 24-hour patterns to tell you exactly when to leave for the fastest journey.' },
        { property: 'og:image', content: 'https://rushhourplanner.com/og-image.jpg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Rush Hour Traffic Estimator - Free traffic forecast dashboard showing optimal driving times' },
        { property: 'og:site_name', content: 'Rush Hour Traffic Estimator' },
        { property: 'og:locale', content: 'en_US' },
        { property: 'twitter:card', content: 'summary_large_image' },
        { property: 'twitter:url', content: 'https://rushhourplanner.com/' },
        { property: 'twitter:title', content: 'Rush Hour Traffic Estimator - Free Traffic Forecast & Route Planner' },
        { property: 'twitter:description', content: 'Free rush hour traffic estimator tool. Get accurate traffic forecasts, find optimal driving times, and plan your commute to avoid rush hour congestion. Our traffic estimator analyzes 24-hour patterns to tell you exactly when to leave for the fastest journey.' },
        { property: 'twitter:image', content: 'https://rushhourplanner.com/og-image.jpg' },
        { property: 'twitter:image:alt', content: 'Rush Hour Traffic Estimator - Free traffic forecast dashboard showing optimal driving times' },
        { property: 'twitter:creator', content: '@rushhourplanner' },
        { property: 'twitter:site', content: '@rushhourplanner' },
        { name: 'theme-color', content: '#4f46e5' },
        { name: 'msapplication-TileColor', content: '#4f46e5' }
      ],
      link: [
        { rel: 'canonical', href: 'https://rushhourplanner.com' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'alternate icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'mask-icon', href: '/favicon.svg', color: '#4f46e5' },
        { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
        { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
        { rel: 'dns-prefetch', href: '//cdn-static.wework.com' },
        { rel: 'dns-prefetch', href: '//maps.googleapis.com' },
        { rel: 'dns-prefetch', href: '//maps.google.com' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
        { rel: 'preconnect', href: 'https://cdn-static.wework.com', crossorigin: true },
        { rel: 'preload', href: 'https://cdn-static.wework.com/content/fonts/serif-regular.woff2', as: 'font', type: 'font/woff2', crossorigin: true },
        { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cardo:ital,wght@0,400;0,700;1,400&family=Kalam:wght@300;400;700&display=swap', rel: 'stylesheet' }
      ],
      script: [
        {
          type: 'application/ld+json',
          json: {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Rush Hour Traffic Estimator",
            "alternateName": "Traffic Estimator",
            "description": "Free rush hour traffic estimator tool. Get accurate traffic forecasts, find optimal driving times, and plan your commute to avoid rush hour congestion. Our traffic estimator analyzes 24-hour patterns to tell you exactly when to leave for the fastest journey.",
            "url": "https://rushhourplanner.com/",
            "applicationCategory": "TravelApplication",
            "operatingSystem": "Web Browser",
            "browserRequirements": "Requires JavaScript. Requires HTML5.",
            "softwareVersion": "1.0.0",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "Free rush hour traffic estimator",
              "Interactive Google Maps route selection",
              "24-hour traffic forecast visualization",
              "Rush hour avoidance recommendations",
              "Traffic pattern analysis",
              "Real-time traffic data integration",
              "Mobile-responsive design",
              "Best departure time calculator",
              "Peak traffic hour identification",
              "Commute optimization suggestions",
              "Traffic estimation accuracy",
              "Free traffic forecasting tool"
            ],
            "screenshot": "https://rushhourplanner.com/screenshot.jpg",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "127"
            },
            "author": {
              "@type": "Organization",
              "name": "Rush Hour Traffic Estimator"
            },
            "provider": {
              "@type": "Organization",
              "name": "Rush Hour Traffic Estimator",
              "url": "https://rushhourplanner.com/"
            },
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://rushhourplanner.com/?from={start_location}&to={end_location}",
              "query-input": "required name=start_location,end_location"
            },
            "mainEntity": {
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How accurate is the rush hour traffic estimator?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our rush hour traffic estimator provides highly accurate traffic forecasts using real-time Google Maps data. It analyzes historical traffic patterns and current conditions to give you precise estimates of when traffic will be lightest and when you should leave for your journey."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is the traffic estimator really free to use?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our rush hour traffic estimator is completely free to use. You can get unlimited traffic forecasts, route analysis, and optimal departure time recommendations without any cost or subscription required."
                  }
                },
                {
                  "@type": "Question",
                  "name": "When is the best time to drive to avoid traffic?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The best time to drive varies by route and day, but generally early morning (before 6 AM), mid-morning (9:30-11 AM), early afternoon (1-3 PM), and late evening (after 7 PM) have lighter traffic. Use traffic estimator to find the optimal time for your specific route."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What time should I leave to avoid rush hour?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To avoid morning rush hour, leave before 6:30 AM or after 9:30 AM. For evening rush hour, travel before 4 PM or after 7 PM. Our traffic estimator analyzes your specific route to give personalized departure time recommendations."
                  }
                },
                {
                  "@type": "Question",
                  "name": "When is rush hour traffic the worst?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Rush hour traffic is typically worst between 7-9 AM and 5-7 PM on weekdays. However, traffic patterns vary by location and route. Our traffic estimator provides 24-hour traffic forecasts to help you identify peak congestion times for your specific journey."
                  }
                }
              ]
            }
          }
        },
        {
          src: 'https://analytics.ahrefs.com/analytics.js',
          'data-key': 'Og9KfRZLyWhhOsdstmDRaw',
          async: true
        }
      ],
      style: [
        {
          children: `
            @font-face {
              font-family: 'Serif';
              src: url('https://cdn-static.wework.com/content/fonts/serif-regular.woff2') format('woff2');
              font-weight: 400;
              font-style: normal;
              font-display: swap;
            }
            
            @font-face {
              font-family: 'Serif';
              src: url('https://cdn-static.wework.com/content/fonts/serif-regular.woff2') format('woff2');
              font-weight: 700;
              font-style: normal;
              font-display: swap;
            }
            
            body {
              margin: 0;
              padding: 0;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              text-rendering: optimizeLegibility;
            }
          `
        }
      ]
    }
  }
})
