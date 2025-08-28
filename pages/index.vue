<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <h1 class="title">Rush Hour Planner</h1>
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
              @click="selectSampleRoute('Eugene, OR', 'Vancouver, WA')"
            >
              Eugene, OR → Vancouver, WA
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
          :selected-route="selectedRoute"
        />
      </div>
      
      <div class="chart-section" v-if="selectedRoute" ref="chartSection">
        <ChartComponent 
          :route-data="selectedRoute"
          :forecast-data="forecastData"
        />
      </div>
      
      <div class="placeholder-message" v-else>
        <p>Select a route to see the traffic forecast timeline</p>
      </div>

      <footer class="footer">
        <div class="footer-content">
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

const analyticsData = computed(() => ({
  sessionUuid: sessionUuid.value,
  startLocation: selectedRoute.value?.start,
  endLocation: selectedRoute.value?.end,
  excludeNightHours: excludeNightHours.value,
  forecastIndex: forecastIndex.value
}));

function handleRouteSelected(routeData) {
  selectedRoute.value = routeData;
  fetchForecastData(routeData);
}

function handleExcludeNightHoursChanged(exclude) {
  excludeNightHours.value = exclude;
  if (selectedRoute.value) {
    fetchForecastData(selectedRoute.value);
  }
}

async function fetchForecastData(routeData) {
  console.log('Fetching forecast for route:', routeData);
  forecastIndex.value += 1;
  forecastData.value = generateMockForecastData(routeData);
  await nextTick();
  const chartSection = document.querySelector('.chart-section');
  if (chartSection) {
    chartSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

function generateMockForecastData(routeData = null) {
  const data = [];
  const now = new Date();
  const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
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
    const time = new Date(startTime.getTime() + (i * 60 * 60 * 1000));
    const hour = time.getHours();
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
      label: time.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
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
  if (mapComponent.value) {
    mapComponent.value.setRouteLocations(from, to);
  }
}

watch(analyticsData, (newData) => {
  console.log('Saving data to analytics:', newData);
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isLocalhost) {
    saveDataToAnalytics(newData);
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
  background: #fafbfc;
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  color: #1a1d29;
}

.header {
  text-align: center;
  padding: 3rem 2rem 3rem;
  background: linear-gradient(135deg, 
    rgba(99, 102, 241, 0.08) 0%, 
    rgba(139, 92, 246, 0.06) 25%,
    rgba(236, 72, 153, 0.04) 50%,
    rgba(59, 130, 246, 0.06) 75%,
    rgba(16, 185, 129, 0.04) 100%
  );
  backdrop-filter: blur(24px) saturate(150%);
  border-bottom: 1px solid rgba(99, 102, 241, 0.12);
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
    radial-gradient(800px circle at 30% 0%, rgba(99, 102, 241, 0.06), transparent 50%),
    radial-gradient(600px circle at 70% 0%, rgba(139, 92, 246, 0.04), transparent 50%),
    linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 100%);
  pointer-events: none;
}

.header::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, 
    transparent 0%, 
    rgba(99, 102, 241, 0.02) 25%, 
    transparent 50%, 
    rgba(139, 92, 246, 0.02) 75%, 
    transparent 100%
  );
  animation: shimmer 8s ease-in-out infinite;
  pointer-events: none;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
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
  font-size: 3.0rem;
  font-weight: 600;
  background: linear-gradient(135deg, 
    #1a1d29 0%, 
    #4f46e5 50%, 
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
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6366f1;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
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
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(99, 102, 241, 0.4);
  color: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 
    0 4px 12px rgba(99, 102, 241, 0.15),
    0 2px 4px rgba(0, 0, 0, 0.05);
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

.map-section {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.04),
    0 12px 40px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.map-section:hover {
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.06),
    0 8px 24px rgba(0, 0, 0, 0.05),
    0 20px 60px rgba(0, 0, 0, 0.03);
}

.chart-section {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.04),
    0 12px 40px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 2rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.chart-section:hover {
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.06),
    0 8px 24px rgba(0, 0, 0, 0.05),
    0 20px 60px rgba(0, 0, 0, 0.03);
}

.placeholder-message {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
  font-size: 1.125rem;
  line-height: 1.6;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
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
  color: #6366f1;
  text-decoration: underline;
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