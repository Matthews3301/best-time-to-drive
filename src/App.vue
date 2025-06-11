<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <h1 class="title">Best Time to Drive</h1>
        <p class="subtitle">Find the optimal time to travel based on real-time traffic forecasts</p>
      </div>
    </header>
    
    <main class="main-content">
      <div class="map-section">
        <MapComponent 
          @route-selected="handleRouteSelected"
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
    </main>
  </div>
</template>

<script>
import MapComponent from './components/MapComponent.vue'
import ChartComponent from './components/ChartComponent.vue'

export default {
  name: 'App',
  components: {
    MapComponent,
    ChartComponent
  },
  data() {
    return {
      selectedRoute: null,
      forecastData: [],
      excludeNightHours: true
    }
  },
  methods: {
    handleRouteSelected(routeData) {
      this.selectedRoute = routeData
      // TODO: Fetch forecast data based on route
      this.fetchForecastData(routeData)
    },
    
    handleExcludeNightHoursChanged(excludeNightHours) {
      this.excludeNightHours = excludeNightHours
      // Regenerate forecast data if route is selected
      if (this.selectedRoute) {
        this.fetchForecastData(this.selectedRoute)
      }
    },
    
    async fetchForecastData(routeData) {
      // TODO: Implement API call to get traffic forecast
      console.log('Fetching forecast for route:', routeData)
      
      // Placeholder data for now
      this.forecastData = this.generateMockForecastData(routeData)
      
      // Scroll to the chart section after calculation is done
      await this.$nextTick()
      if (this.$refs.chartSection) {
        this.$refs.chartSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    },
    
    generateMockForecastData(routeData = null) {
      // Generate 24 hours of mock data starting from current time
      const data = []
      const now = new Date()
      // Round to the nearest hour
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0)
      
      // Extract base journey time from routeData or use default
      let baseTime = 30 // Default fallback
      if (routeData && routeData.baseTime) {
        // Parse the baseTime string from Google Maps (e.g., "2 hours 15 mins", "45 mins", "1 hour")
        const timeString = routeData.baseTime.toLowerCase()
        let totalMinutes = 0
        
        // Extract hours
        const hoursMatch = timeString.match(/(\d+)\s*(hour|hr)s?/)
        if (hoursMatch) {
          totalMinutes += parseInt(hoursMatch[1]) * 60
        }
        
        // Extract minutes
        const minutesMatch = timeString.match(/(\d+)\s*(minute|min)s?/)
        if (minutesMatch) {
          totalMinutes += parseInt(minutesMatch[1])
        }
        
        // If we found time components, use them
        if (totalMinutes > 0) {
          baseTime = totalMinutes
        } else {
          // Fallback: if no explicit time units, assume the first number is minutes
          const numberMatch = timeString.match(/(\d+)/)
          if (numberMatch) {
            baseTime = parseInt(numberMatch[1])
          }
        }
      }
      
      for (let i = 0; i < 24; i++) {
        const time = new Date(startTime.getTime() + (i * 60 * 60 * 1000))
        const hour = time.getHours()
        
        // Create realistic traffic patterns
        let trafficMultiplier = 1
        
        // Morning rush hour (7-9 AM)
        if (hour >= 7 && hour <= 9) {
          trafficMultiplier = 1.4 + (Math.random() * 0.3)
        }
        // Evening rush hour (5-7 PM)  
        else if (hour >= 17 && hour <= 19) {
          trafficMultiplier = 1.5 + (Math.random() * 0.4)
        }
        // Late night (11 PM - 5 AM) - lighter traffic
        else if (hour >= 23 || hour <= 5) {
          trafficMultiplier = 0.8 + (Math.random() * 0.2)
        }
        // Normal hours with some variation
        else {
          trafficMultiplier = 0.9 + (Math.random() * 0.4)
        }
        
        const duration = Math.round(baseTime * trafficMultiplier)
        
        // Check if this hour should be excluded from optimal time calculations
        const isExcluded = this.excludeNightHours && (hour >= 23 || hour <= 5)
        
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
        })
      }
      
      return data
    }
  }
}
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