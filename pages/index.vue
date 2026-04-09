<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <a href="/" class="title-link"><h1 class="title"><img src="/favicon.svg" alt="Rush Hour Planner logo" class="title-logo" />Rush Hour Planner</h1></a>
        <p class="subtitle">Find the optimal time to travel based on real-time traffic forecasts</p>
        
        <div class="sample-routes">
          <div class="sample-routes-grid">
            <button 
              class="sample-route-btn" 
              @click="selectSampleRoute('Pasadena, CA', 'Long Beach, CA')"
            >
              Pasadena, CA → Long Beach, CA
            </button>
            <button 
              class="sample-route-btn" 
              @click="selectSampleRoute('Eugene, OR', 'Vancouver, BC, Canada')"
            >
              Eugene, OR → Vancouver, BC
            </button>
            <button 
              class="sample-route-btn" 
              @click="selectSampleRoute('Spring, TX', 'Houston, TX')"
            >
              Spring, TX → Houston, TX
            </button>
          </div>
        </div>
      </div>

      
    </header>
    
    <main class="main-content">
      <div class="map-section">
        <MapComponent 
          ref="mapComponent"
          @route-selected="handleRouteSelected"
          @route-selected-error="handleRouteSelectedError"
          @exclude-night-hours-changed="handleExcludeNightHoursChanged"
          @departure-date-changed="handleDepartureDateChanged"
          :selected-route="selectedRoute"
        />
      </div>
      
      <div v-if="selectedRoute">
        <div class="chart-section" ref="chartSection" id="forecast-chart">
          <ChartComponent 
            :route-data="selectedRoute"
            :forecast-data="forecastData"
            :depart-date="selectedDepartDate"
            :timezone="selectedRoute.timezone"
          />
        </div>

        <div class="chart-section" style="margin-top: 2rem;" id="parking-card">
          <ParkingComponent :destination="selectedRoute.end" />
        </div>

        <div class="bmc-cta">
          <p class="bmc-cta-text">
            If Rush Hour Planner saves you time, support the project and help cover the hosting costs.
          </p>
          <a
            href="https://buymeacoffee.com/rush.hour.planner"
            target="_blank"
            rel="noopener noreferrer"
            class="bmc-link"
          >Buy me a coffee</a>
        </div>

        <div class="chart-section" style="margin-top: 1.5rem;" id="results-card">
          <AddToWebsite :target="selectedRoute.end" :forecast-data="forecastData" />
        </div>
      </div>
      
      <div class="placeholder-message" v-else>
        <p>Use rush hour traffic estimator to select a route and see the traffic forecast timeline</p>
      </div>

      <footer class="footer">
        <div class="footer-content">
          <!-- <a href="/blog" class="contact-link">
            Blog
          </a>
          <span class="footer-separator">•</span> -->
          <a href="https://x.com/matthews8000" target="_blank" rel="noopener noreferrer" class="contact-link">
            Contact / Feedback
          </a>
        </div>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import MapComponent from '../components/MapComponent.vue';
import ChartComponent from '../components/ChartComponent.vue';
import ParkingComponent from '../components/ParkingComponent.vue';
import AddToWebsite from '../components/AddToWebsite.vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

// Initialize Vercel Analytics
import { inject } from '@vercel/analytics';
inject();

const { $posthog } = useNuxtApp();
const posthog = $posthog ? $posthog() : null;

// Dynamic canonical URL based on URL parameters
const route = useRoute();
const canonicalUrl = computed(() => {
  const params = new URLSearchParams();
  
  if (route.query.from) {
    params.set('from', String(route.query.from));
  }
  if (route.query.exclude) {
    params.set('exclude', String(route.query.exclude));
  }
  if (route.query.to) {
    params.set('to', String(route.query.to));
  }
  if (route.query.depart) {
    params.set('depart', String(route.query.depart));
  }
  
  const queryString = params.toString();
  return `https://rushhourplanner.com/${queryString ? '?' + queryString : ''}`;
});

// Dynamic title based on URL parameters
const dynamicTitle = computed(() => {
  const from = route.query.from;
  const to = route.query.to;
  
  if (from && to) {
    return `${from} -> ${to} | Best time to drive - Rush Hour Planner`;
  }
  
  return 'Rush Hour Planner - Traffic Forecast & Route Optimizer | Avoid Rush Hour';
});

// Set dynamic canonical URL and title
useHead({
  title: dynamicTitle,
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl
    }
  ]
});


const selectedRoute = ref(null);
const forecastData = ref([]);
const excludeNightHours = ref(true);
const sessionUuid = ref(uuidv4());
const forecastIndex = ref(0);
const mapComponent = ref(null);
const selectedDepartDate = ref(null);
const forecastDebug = ref(null);

const analyticsData = computed(() => ({
  sessionUuid: sessionUuid.value,
  startLocation: selectedRoute.value?.start,
  endLocation: selectedRoute.value?.end,
  excludeNightHours: excludeNightHours.value,
  forecastIndex: forecastIndex.value,
  forecastCacheStatus: forecastDebug.value?.cacheStatus || null,
  forecastRequestGoogleCalls: forecastDebug.value?.requestGoogleCallCount !== undefined
    ? Number(forecastDebug.value.requestGoogleCallCount)
    : null,
  forecastModelGoogleCalls: forecastDebug.value?.googleCallCount !== undefined
    ? Number(forecastDebug.value.googleCallCount)
    : null,
  forecastRefinementLevel: forecastDebug.value?.refinementLevel !== undefined
    ? Number(forecastDebug.value.refinementLevel)
    : null,
  forecastConfidenceScore: forecastDebug.value?.confidenceScore !== undefined
    ? Number(forecastDebug.value.confidenceScore)
    : null
}));

function handleRouteSelected(routeData) {
  selectedRoute.value = routeData;
  fetchForecastData(routeData);
}

function handleExcludeNightHoursChanged(exclude) {
  excludeNightHours.value = exclude;
  if (forecastData.value.length > 0) {
    forecastData.value = applyExcludeNightHours(forecastData.value, excludeNightHours.value);
    return;
  }
  if (selectedRoute.value) {
    fetchForecastData(selectedRoute.value);
  }
}

function handleDepartureDateChanged(date) {
  selectedDepartDate.value = date;
  if (selectedRoute.value) {
    fetchForecastData(selectedRoute.value);
  }
}

async function fetchForecastData(routeData) {
  console.log('Fetching forecast for route:', routeData);
  const timezoneValue = routeData.timezone || 'UTC';
  const originCoordinates = routeData?.coordinates?.start;
  const destinationCoordinates = routeData?.coordinates?.end;
  const origin = originCoordinates ? `${originCoordinates.lat},${originCoordinates.lng}` : routeData.start;
  const destination = destinationCoordinates ? `${destinationCoordinates.lat},${destinationCoordinates.lng}` : routeData.end;

  try {
    const response = await $fetch.raw('/api/directions-forecast', {
      method: 'POST',
      body: {
        origin,
        destination,
        timezone: timezoneValue,
        departDate: selectedDepartDate.value ? dayjs(selectedDepartDate.value).format('YYYY-MM-DD') : null,
        excludeNightHours: excludeNightHours.value
      }
    });
    const responseData = response?._data;

    if (responseData?.success && Array.isArray(responseData.data)) {
      forecastData.value = applyExcludeNightHours(responseData.data, excludeNightHours.value);
      forecastDebug.value = {
        ...responseData.metadata,
        cacheStatus: response.headers.get('x-forecast-cache-status') || responseData.metadata?.cacheStatus || 'unknown',
        googleCallCount: response.headers.get('x-forecast-google-calls') || responseData.metadata?.googleCallCount || null,
        requestGoogleCallCount: response.headers.get('x-forecast-request-google-calls') || responseData.metadata?.requestGoogleCallCount || null,
        confidenceScore: response.headers.get('x-forecast-confidence') || responseData.metadata?.confidenceScore || null
      };
    } else {
      forecastData.value = generateFallbackForecastData(routeData, selectedDepartDate.value, timezoneValue);
      forecastDebug.value = {
        cacheStatus: 'fallback_response_shape',
        requestGoogleCallCount: 0,
        googleCallCount: 0,
        refinementLevel: 0,
        confidenceScore: 0
      };
    }
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    forecastData.value = generateFallbackForecastData(routeData, selectedDepartDate.value, timezoneValue);
    forecastDebug.value = {
      cacheStatus: 'fallback_error',
      requestGoogleCallCount: 0,
      googleCallCount: 0,
      refinementLevel: 0,
      confidenceScore: 0
    };
  }

  forecastIndex.value += 1;
  await nextTick();
}

function applyExcludeNightHours(data, excludeEnabled) {
  return data.map((point) => ({
    ...point,
    isExcluded: excludeEnabled && (point.hour >= 23 || point.hour <= 5)
  }));
}

function generateFallbackForecastData(routeData = null, departDate = null, timezone = 'UTC') {
  const data = [];
  const now = dayjs().tz(timezone);
  let startTime;
  if (departDate instanceof Date) {
    startTime = dayjs.tz(`${departDate.getFullYear()}-${departDate.getMonth() + 1}-${departDate.getDate()} 00:00:00`, timezone);
  } else {
    startTime = now.startOf('hour');
  }
  let baseTime = 30;
  if (routeData && routeData.baseTime) {
    const timeString = routeData.baseTime.toLowerCase();
    let totalMinutes = 0;
    const hoursMatch = timeString.match(/(\d+)\s*(hour|hr)s?/);
    if (hoursMatch) {
      totalMinutes += parseInt(hoursMatch[1]) * 60;
    }
    const minutesMatch = timeString.match(/(\d+)\s*(minute|min)s?/);
    if (minutesMatch) {
      totalMinutes += parseInt(minutesMatch[1]);
    }
    if (totalMinutes > 0) {
      baseTime = totalMinutes;
    } else {
      const numberMatch = timeString.match(/(\d+)/);
      if (numberMatch) {
        baseTime = parseInt(numberMatch[1]);
      }
    }
  }
  for (let i = 0; i < 24; i++) {
    const time = startTime.add(i, 'hour');
    const hour = time.hour();
    let trafficMultiplier = 1;
    if (hour >= 7 && hour <= 9) {
      trafficMultiplier = 1.4 + (Math.random() * 0.3);
    } else if (hour >= 17 && hour <= 19) {
      trafficMultiplier = 1.5 + (Math.random() * 0.4);
    } else if (hour >= 23 || hour <= 5) {
      trafficMultiplier = 0.8 + (Math.random() * 0.2);
    } else {
      trafficMultiplier = 0.9 + (Math.random() * 0.4);
    }
    const duration = Math.round(baseTime * trafficMultiplier);
    const isExcluded = excludeNightHours.value && (hour >= 23 || hour <= 5);
    data.push({
      time: time.toISOString(),
      duration: duration,
      label: time.format('HH:mm'),
      hour: hour,
      isExcluded: isExcluded
    });
  }
  return data;
}

async function saveDataToAnalytics(data) {
  try {
    posthog?.capture('route_selected', data);
  } catch (error) {
    console.error('Error saving data to analytics:', error);
  }
}

function handleRouteSelectedError(error) {
  posthog?.capture('route_selected_error', {
    startLocation: selectedRoute.value?.start || 'unknown',
    endLocation: selectedRoute.value?.end || 'unknown',
    excludeNightHours: excludeNightHours.value || null,
    error: error
  });
}

function selectSampleRoute(from, to) {
  console.log('selectSampleRoute called with:', from, to);
  if (mapComponent.value) {
    console.log('mapComponent found, calling setRouteLocations');
    mapComponent.value.setRouteLocations(from, to);
  } else {
    console.log('mapComponent not found');
  }
}

watch(forecastIndex, () => {
  // Only send analytics when we have both start and end locations
  if (!selectedRoute.value?.start || !selectedRoute.value?.end) {
    return;
  }
  
  const data = analyticsData.value;
  console.log('Saving data to analytics:', data);
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isLocalhost) {
    saveDataToAnalytics(data);
  }
});

onMounted(() => {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isLocalhost) {
    saveDataToAnalytics(analyticsData.value);
  }
});
</script>

<style>
.app {
  min-height: 100vh;
  background: transparent;
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  color: #0f172a;
}

.header {
  text-align: center;
  padding: 3rem 2rem 3rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(244, 250, 255, 0.72) 100%);
  border-bottom: 1px solid var(--app-border);
  backdrop-filter: blur(10px) saturate(120%);
  -webkit-backdrop-filter: blur(10px) saturate(120%);
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(700px circle at 30% 0%, rgba(109, 77, 255, 0.14), transparent 55%),
    radial-gradient(500px circle at 70% 0%, rgba(45, 212, 191, 0.1), transparent 55%),
    linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.64) 100%);
  pointer-events: none;
}

.header::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 15%, rgba(255, 255, 255, 0.46) 36%, transparent 52%);
  transform: translateX(-110%);
  animation: headerShimmer 9s linear infinite;
  pointer-events: none;
}

@keyframes headerShimmer {
  0% { transform: translateX(-110%); }
  100% { transform: translateX(110%); }
}

.header-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
}

.header-icon {
  margin-bottom: 1.5rem;
  animation: float 6s ease-in-out infinite;
}

.header-icon svg {
  width: 64px;
  height: 64px;
  filter: drop-shadow(0 4px 12px rgba(99, 102, 241, 0.15));
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-icon:hover svg {
  transform: scale(1.1) rotate(5deg);
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

.title {
  font-size: 2.4rem;
  font-weight: 600;
  background: linear-gradient(135deg,
    #0f172a 0%,
    #4f46e5 60%,
    #7c3aed 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 1rem 0;
  letter-spacing: -0.05em;
  line-height: 1.1;
  font-family: 'Inter', -apple-system, 'Roboto', Arial, sans-serif;
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.title-link {
  text-decoration: none;
  color: inherit;
}

.title-logo {
  width: 36px;
  height: 36px;
}

.subtitle {
  font-size: 1.25rem;
  color: #475569;
  margin: 0 0 1rem 0;
  font-weight: 400;
  line-height: 1.7;
  max-width: 620px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
  z-index: 1;
  opacity: 0.9;
}

.sample-routes {
  margin-top: 2rem;
  position: relative;
  z-index: 1;
}

.sample-routes-label {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1rem 0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sample-routes-grid {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 600px;
  margin: 0 auto;
}

.sample-route-btn {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.86), rgba(234, 249, 252, 0.7));
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--app-primary-strong);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 20px rgba(109, 77, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.75);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
}

.sample-route-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(99, 102, 241, 0.1) 50%, 
    transparent 100%
  );
  transition: left 0.5s ease;
}

.sample-route-btn:hover {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(230, 246, 255, 0.8));
  border-color: rgba(109, 77, 255, 0.4);
  color: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 
    0 12px 26px rgba(109, 77, 255, 0.16),
    0 4px 12px rgba(15, 23, 42, 0.08);
}

.sample-route-btn:hover::before {
  left: 100%;
}

.sample-route-btn:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 8px rgba(99, 102, 241, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Mobile-specific improvements */
@media (hover: none) and (pointer: coarse) {
  .sample-route-btn {
    min-height: 44px; /* Minimum touch target size */
    padding: 0.875rem 1.5rem;
  }
  
  .sample-route-btn:active {
    background: rgba(255, 255, 255, 0.95);
    transform: scale(0.98);
  }
}

.header-decoration {
  width: 120px;
  height: 4px;
  background: linear-gradient(90deg, 
    #6366f1 0%, 
    #8b5cf6 25%, 
    #ec4899 50%, 
    #3b82f6 75%, 
    #10b981 100%
  );
  border-radius: 2px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
}

.header-decoration::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.6) 50%, 
    transparent 100%
  );
  animation: slide 3s ease-in-out infinite;
}

@keyframes slide {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  gap: 2rem;
}

@media (min-width: 1280px) {
  .main-content {
    max-width: 1040px;
  }
}

.map-section {
  background: var(--app-glass);
  border-radius: 16px;
  box-shadow: var(--app-shadow);
  border: 1px solid var(--app-border);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(12px) saturate(130%);
  -webkit-backdrop-filter: blur(12px) saturate(130%);
}

.map-section:hover {
  box-shadow: 
    0 10px 28px rgba(15, 23, 42, 0.08),
    0 4px 10px rgba(15, 23, 42, 0.05);
}

.chart-section {
  background: var(--app-glass);
  border-radius: 16px;
  box-shadow: var(--app-shadow);
  border: 1px solid var(--app-border);
  padding: 2rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  backdrop-filter: blur(12px) saturate(130%);
  -webkit-backdrop-filter: blur(12px) saturate(130%);
}

.chart-section:hover {
  box-shadow: 
    0 18px 34px rgba(82, 84, 170, 0.18),
    0 8px 16px rgba(15, 23, 42, 0.08);
}

.bmc-cta {
  margin: 1rem 0 0.5rem;
  padding: 1rem 1.25rem;
  text-align: center;
  background: linear-gradient(180deg, rgba(109, 77, 255, 0.1), rgba(45, 212, 191, 0.12));
  border: 1px solid rgba(109, 77, 255, 0.22);
  border-radius: 14px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.bmc-cta-text {
  margin: 0 0 0.75rem;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
}

.bmc-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.25rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #6d4dff 0%, #8b5cf6 60%, #2dd4bf 100%);
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 10px 24px rgba(86, 63, 214, 0.24);
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
}

.bmc-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(99, 102, 241, 0.24);
}

.placeholder-message {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
  font-size: 1.125rem;
  line-height: 1.6;
  background: var(--app-glass-strong);
  border-radius: 16px;
  box-shadow: var(--app-shadow);
  border: 1px solid var(--app-border);
  position: relative;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.placeholder-message::before {
  content: '';
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, #e2e8f0, #cbd5e1, #e2e8f0);
  border-radius: 2px;
}

.footer {
  text-align: center;
  padding: 1rem 0;
}

.footer-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0.5rem;
}

.contact-link {
  color: #6366f1;
  text-decoration: none;
  transition: color 0.3s ease;
}

.contact-link:hover {
  color: #4f46e5;
  text-decoration: underline;
}

.footer-separator {
  color: #94a3b8;
  margin: 0 0.75rem;
}

@media (max-width: 768px) {
  .header {
    padding: 3rem 1.5rem 3rem;
  }
  
  .header-icon svg {
    width: 56px;
    height: 56px;
  }
  
  .title {
    font-size: 2.75rem;
    letter-spacing: -0.04em;
  }
  
  .title-logo {
    width: 36px;
    height: 36px;
  }
  
  .subtitle {
    font-size: 1.125rem;
    max-width: 420px;
  }
  
  .sample-routes {
    margin-top: 1.5rem;
  }
  
  .sample-routes-grid {
    gap: 0.5rem;
  }
  
  .sample-route-btn {
    padding: 0.625rem 1rem;
    font-size: 0.8125rem;
  }
  
  .header-decoration {
    width: 100px;
  }
  
  .main-content {
    padding: 1rem;
    gap: 1.5rem;
  }
  
  .chart-section {
    padding: 1.5rem;
    overflow: hidden;
  }
  
  .placeholder-message {
    padding: 3rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 2.5rem 1rem 2.5rem;
  }
  
  .header-icon {
    margin-bottom: 1rem;
  }
  
  .header-icon svg {
    width: 48px;
    height: 48px;
  }
  
  .title {
    font-size: 2.25rem;
    margin-bottom: 1rem;
  }
  
  .title-logo {
    width: 32px;
    height: 32px;
  }
  
  .subtitle {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .sample-routes {
    margin-top: 1rem;
  }
  
  .sample-routes-label {
    font-size: 0.75rem;
  }
  
  .sample-routes-grid {
    gap: 0.375rem;
  }
  
  .sample-route-btn {
    padding: 0.5rem 0.875rem;
    font-size: 0.75rem;
    border-radius: 8px;
  }
  
  .header-decoration {
    width: 80px;
    height: 3px;
  }
  
  .main-content {
    padding: 0.75rem;
    gap: 1rem;
  }
  
  .chart-section {
    padding: 1.25rem;
    overflow: hidden;
  }
}
</style> 