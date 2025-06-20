<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>24-Hour Traffic Forecast</h3>
    </div>
    
    <div class="chart-content">
      <div class="chart-wrapper" :class="{ 'hide-hint': !showScrollHint }">
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color optimal"></div>
            <span>Optimal Time ({{ optimalTime }})</span>
          </div>
          <div class="legend-item">
            <div class="legend-color current"></div>
            <span>Current Time</span>
          </div>
          <div class="legend-item">
            <div class="legend-color high-traffic"></div>
            <span>Heavy Traffic</span>
          </div>
          <div class="legend-item" v-if="hasExcludedTimes">
            <div class="legend-color excluded"></div>
            <span>Excluded Hours</span>
          </div>
        </div>
        
        <div class="chart-area">
          <div class="y-axis">
            <div class="y-axis-label" v-for="tick in yAxisTicks" :key="tick" :style="getYAxisLabelStyle(tick)">
              {{ formatDuration(tick) }}
            </div>
          </div>
          
          <div class="chart-bars-container">
            <div class="chart-bars">
              <div 
                v-for="(dataPoint, index) in forecastData" 
                :key="index"
                class="bar-wrapper"
                @click="selectTime(dataPoint)"
                @mouseenter="hoveredBarIndex = index"
                @mouseleave="hoveredBarIndex = null"
                @touchstart="handleTouchStart(index)"
                @touchend="handleTouchEnd"
              >
                <div class="bar-container">
                  <div 
                    class="bar"
                    :class="getBarClass(dataPoint)"
                    :style="getBarStyle(dataPoint)"
                    :title="`${dataPoint.label}: ${formatDurationLong(dataPoint.duration)} total journey time`"
                  >
                    <div 
                      class="bar-value" 
                      :class="{ 
                        'hover-value': hoveredBarIndex === index,
                        'always-show': shouldShowValue(index)
                      }"
                      v-if="shouldShowValue(index) || hoveredBarIndex === index"
                    >
                      {{ formatDuration(dataPoint.duration) }}
                    </div>
                  </div>
                </div>
                <div class="time-label" :class="{ 'invisible': !shouldShowTimeLabel(index) }">
                  {{ formatTimeLabel(dataPoint.label) }}
                </div>
              </div>
            </div>
            
            <div class="x-axis-line"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="chart-footer">
      <div class="insights">
        <div class="insight-item best-time">
          <div class="insight-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12C3 4.5 9 4 9 4C9 4 9 4.5 12 4.5C15 4.5 15 4 15 4C15 4 21 4.5 21 12C21 19.5 15 20 15 20H9C9 20 3 19.5 3 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="9" cy="10" r="1" fill="currentColor"/>
              <circle cx="15" cy="10" r="1" fill="currentColor"/>
              <path d="M9 15H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M7 7L17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="insight-content">
            <h4>Best Time to Leave</h4>
            <p class="optimal-time">{{ optimalTime }}</p>
            <span class="optimal-duration">{{ formatDurationLong(optimalDuration) }} total journey</span>
          </div>
        </div>
        
        <div class="insight-item time-saved">
          <div class="insight-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 2L4 6M16 2L20 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="insight-content">
            <h4>Time Saved</h4>
            <p class="time-saved-value">{{ formatDuration(timeSaved) }}</p>
            <span class="vs-current">vs. leaving now</span>
          </div>
        </div>
        
        <div class="insight-item rush-hour">
          <div class="insight-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
              <circle cx="9" cy="9" r="2" fill="currentColor"/>
              <path d="M13 5V9L17 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="6" cy="15.5" r="1" fill="currentColor"/>
              <circle cx="10" cy="15.5" r="1" fill="currentColor"/>
              <circle cx="14" cy="15.5" r="1" fill="currentColor"/>
              <circle cx="18" cy="15.5" r="1" fill="currentColor"/>
              <path d="M6 18.5H18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="insight-content">
            <h4>Rush Hour Impact</h4>
            <p class="rush-impact-value">+{{ rushHourIncrease }}%</p>
            <span class="rush-description">longer during peak</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChartComponent',
  props: {
    routeData: {
      type: Object,
      required: true
    },
    forecastData: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      selectedTimeSlot: null,
      windowWidth: window.innerWidth,
      showScrollHint: true,
      hoveredBarIndex: null,
      touchTimeout: null
    }
  },
  computed: {
    currentTime() {
      return new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    },
    
    maxDuration() {
      // For visual scaling, use all times including excluded ones
      return Math.max(...this.forecastData.map(d => d.duration))
    },
    
    minDuration() {
      // Only consider non-excluded times for min/max calculations
      const availableTimes = this.forecastData.filter(dataPoint => !dataPoint.isExcluded)
      return availableTimes.length > 0 ? Math.min(...availableTimes.map(d => d.duration)) : Math.min(...this.forecastData.map(d => d.duration))
    },
    
    yAxisMax() {
      // Round up to nearest 10 minutes for clean axis, ensure we start from a reasonable max
      return Math.ceil(this.maxDuration / 10) * 10
    },
    
    yAxisTicks() {
      // Use clean, even time intervals for the Y-axis
      const maxDuration = this.yAxisMax
      const preferredIntervals = [10, 15, 20, 30, 45, 60, 90, 120, 150, 180, 240, 300, 360]
      
      // Find the best interval based on the max duration
      let interval = 10
      if (maxDuration <= 60) {
        interval = 10 // 10min intervals for short trips
      } else if (maxDuration <= 120) {
        interval = 15 // 15min intervals for medium trips
      } else if (maxDuration <= 180) {
        interval = 30 // 30min intervals for longer trips
      } else {
        interval = 60 // 1h intervals for very long trips
      }
      
      const ticks = []
      for (let i = 0; i <= maxDuration; i += interval) {
        ticks.push(i)
      }
      
      // Ensure we always include the max value if it's not already included
      if (ticks[ticks.length - 1] < maxDuration) {
        ticks.push(maxDuration)
      }
      
      return ticks
    },
    
    optimalTimeData() {
      // Only consider non-excluded times for optimal calculation
      const availableTimes = this.forecastData.filter(dataPoint => !dataPoint.isExcluded)
      return availableTimes.reduce((min, current) => 
        current.duration < min.duration ? current : min
      )
    },
    
    optimalTime() {
      return this.formatTimeLabel(this.optimalTimeData.label)
    },
    
    optimalDuration() {
      return this.optimalTimeData.duration
    },
    
    currentDuration() {
      // First data point is current time (current hour)
      return this.forecastData[0]?.duration || 0
    },
    
    timeSaved() {
      // Only calculate time saved if current time is not excluded
      const currentTimeData = this.forecastData[0]
      if (currentTimeData && currentTimeData.isExcluded) {
        return 0 // No meaningful comparison if current time is excluded
      }
      return Math.max(0, this.currentDuration - this.optimalDuration)
    },
    
    rushHourIncrease() {
      const increase = ((this.maxDuration - this.minDuration) / this.minDuration) * 100
      return Math.round(increase)
    },
    
    hasExcludedTimes() {
      return this.forecastData.some(dataPoint => dataPoint.isExcluded)
    }
  },
  methods: {
    getBarStyle(dataPoint) {
      // Calculate height as percentage of yAxisMax, ensuring bars start from 0
      const heightPercent = (dataPoint.duration / this.yAxisMax) * 100
      return {
        height: `${Math.max(heightPercent, 1)}%` // Minimum 1% height for visibility
      }
    },
    
    getBarClass(dataPoint) {
      const isCurrent = dataPoint === this.forecastData[0] // First hour is current
      const isExcluded = dataPoint.isExcluded
      
      // If the dataPoint is excluded but also current, show as both
      if (isExcluded && isCurrent) {
        return { 'excluded': true, 'current': true }
      }
      
      // If just excluded, show as excluded
      if (isExcluded) {
        return { 'excluded': true }
      }
      
      const isOptimal = dataPoint.duration === this.minDuration
      const isHighTraffic = dataPoint.duration > (this.minDuration * 1.3)
      
      return {
        'optimal': isOptimal,
        'high-traffic': isHighTraffic && !isOptimal,
        'current': isCurrent,
        'normal': !isOptimal && !isHighTraffic && !isCurrent
      }
    },
    
    getYAxisLabelStyle(tick) {
      // Adjust positioning to keep labels above the X-axis line (28px from bottom)
      const chartHeight = 100 - (28 / 3); // Adjust for X-axis spacing
      const position = (tick / this.yAxisMax) * chartHeight
      return {
        bottom: `${position + 10}%` // Add 10% offset to keep above X-axis
      }
    },
    
    shouldShowTimeLabel(index) {
      // Responsive label display based on window width
      if (this.windowWidth >= 1200) {
        // Desktop: Show every hour
        return true
      } else if (this.windowWidth >= 768) {
        // Tablet: Show every 2 hours
        return index % 2 === 0
      } else if (this.windowWidth >= 480) {
        // Small tablet: Show every 3 hours
        return index % 3 === 0
      } else {
        // Mobile: Show every 4 hours
        return index % 4 === 0
      }
    },
    
    shouldShowValue(index) {
      // Show value for optimal and peak times, or on hover
      const dataPoint = this.forecastData[index]
      return dataPoint.duration === this.minDuration || dataPoint.duration === this.maxDuration
    },
    
    formatTimeLabel(timeString) {
      // Handle both "HH:MM" and full time strings
      const timePart = timeString.includes('T') ? 
        new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) :
        timeString
      
      const [hour, minute] = timePart.split(':')
      const hourNum = parseInt(hour)
      
      // For chart labels, show in 12-hour format without space
      if (hourNum === 0) return '12AM'
      if (hourNum === 12) return '12PM'
      if (hourNum < 12) return `${hourNum}AM`
      return `${hourNum - 12}PM`
    },
    
    formatDuration(minutes) {
      // Format duration in a user-friendly way
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        if (remainingMinutes === 0) {
          return `${hours}h`
        }
        return `${hours}h ${remainingMinutes}m`
      }
      return `${minutes}m`
    },
    
    formatDurationLong(minutes) {
      // Format duration for longer descriptions
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        if (remainingMinutes === 0) {
          return `${hours} hour${hours > 1 ? 's' : ''}`
        }
        return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`
      }
      return `${minutes} minute${minutes > 1 ? 's' : ''}`
    },
    
    selectTime(dataPoint) {
      this.selectedTimeSlot = dataPoint
      this.$emit('time-selected', dataPoint)
    },
    
    formatCurrentHour() {
      const currentDate = new Date()
      const currentHour = currentDate.getHours()
      const formattedHour = currentHour.toString().padStart(2, '0')
      const formattedMinute = currentDate.getMinutes().toString().padStart(2, '0')
      return `${formattedHour}:${formattedMinute}`
    },
    
    handleResize() {
      this.windowWidth = window.innerWidth
    },
    
    scrollToCurrentTime() {
      if (this.windowWidth <= 768) {
        this.$nextTick(() => {
          const chartBarsContainer = this.$el.querySelector('.chart-bars-container')
          if (chartBarsContainer) {
            // Scroll to show the first few bars (current time area)
            chartBarsContainer.scrollLeft = 0
          }
        })
      }
    },
    
    hideScrollHint() {
      this.showScrollHint = false
    },
    
    handleTouchStart(index) {
      // Clear any existing timeout
      if (this.touchTimeout) {
        clearTimeout(this.touchTimeout)
      }
      // Show the bar value on touch
      this.hoveredBarIndex = index
    },
    
    handleTouchEnd() {
      // Hide the bar value after a delay on touch end
      this.touchTimeout = setTimeout(() => {
        this.hoveredBarIndex = null
      }, 2000) // Hide after 2 seconds
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
    this.scrollToCurrentTime()
    
    // Add scroll listener to hide hint after user interacts
    this.$nextTick(() => {
      const chartBarsContainer = this.$el.querySelector('.chart-bars-container')
      if (chartBarsContainer) {
        chartBarsContainer.addEventListener('scroll', this.hideScrollHint)
        chartBarsContainer.addEventListener('touchstart', this.hideScrollHint)
      }
    })
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    
    // Clean up scroll listeners
    const chartBarsContainer = this.$el?.querySelector('.chart-bars-container')
    if (chartBarsContainer) {
      chartBarsContainer.removeEventListener('scroll', this.hideScrollHint)
      chartBarsContainer.removeEventListener('touchstart', this.hideScrollHint)
    }
    
    // Clean up touch timeout
    if (this.touchTimeout) {
      clearTimeout(this.touchTimeout)
    }
  }
}
</script>

<style scoped>
.chart-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.chart-header {
  margin-bottom: 1.5rem;
  flex-shrink: 0;
}

.chart-header h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.5rem;
  font-weight: 600;
}

.chart-header p {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.9rem;
}

.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.current-time {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.chart-content {
  margin-bottom: 1.5rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.chart-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  height: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.chart-wrapper.hide-hint::after {
  opacity: 0;
}

.chart-legend {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #374151;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.optimal {
  background: linear-gradient(135deg, #10b981, #059669);
}

.legend-color.current {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.legend-color.high-traffic {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.legend-color.excluded {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
  opacity: 0.7;
}

.chart-area {
  display: flex;
  height: 300px;
  position: relative;
  max-width: 100%;
  overflow: hidden;
}

.y-axis {
  top: 20px;
  width: 60px;
  position: relative;
  border-right: 2px solid #e5e7eb;
}

.y-axis-label {
  position: absolute;
  right: 8px;
  font-size: 0.75rem;
  color: #6b7280;
  transform: translateY(50%);
  padding: 0 4px;
}

.chart-bars-container {
  flex: 1;
  padding-top: 20px;
  position: relative;
  overflow-x: auto;
  overflow-y: visible;
}

.chart-bars {
  display: flex;
  height: 100%;
  align-items: end;
  gap: 1px;
  padding: 0 8px;
  min-width: 100%;
  width: max-content;
}

.bar-wrapper {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  height: 100%;
  cursor: pointer;
  position: relative;
  min-width: 24px;
  width: calc(100% / 24);
}

.bar-container {
  flex: 1;
  display: flex;
  align-items: end;
  padding: 0 2px;
  height: 100%;
  overflow: visible;
}

.bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
  position: relative;
  min-height: 4px;
  display: flex;
  align-items: end;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: visible;
}

.bar:hover {
  transform: scaleY(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.bar.optimal {
  background: linear-gradient(135deg, #10b981, #059669);
}

.bar.current {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.bar.high-traffic {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.bar.normal {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.bar.excluded {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
  opacity: 0.7;
}

.bar.excluded.current {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
  border: 2px solid #3b82f6;
  opacity: 0.9;
}

.bar-value {
  color: white;
  font-size: 0.6rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  padding: 1px 3px;
  position: absolute;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  transition: all 0.2s ease;
}

.bar-value.always-show {
  top: -18px;
}

.bar-value.hover-value {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  font-size: 0.65rem;
  padding: 2px 4px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.time-label {
  font-size: 0.7rem;
  color: #6b7280;
  text-align: center;
  margin-top: 8px;
  font-weight: 500;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.2;
}

.time-label.invisible {
  color: transparent;
}

.x-axis-line {
  position: absolute;
  bottom: 28px;
  left: 0;
  right: 0;
  height: 2px;
  background: #e5e7eb;
}

.chart-footer {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.insights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.insight-item {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.insight-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.insight-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.best-time .insight-icon {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.time-saved .insight-icon {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.rush-hour .insight-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.insight-content h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 0.9rem;
  font-weight: 600;
}

.optimal-time {
  color: #10b981;
  font-weight: 700;
  font-size: 1.3rem;
  margin: 0;
}

.optimal-duration {
  color: #6b7280;
  font-size: 0.85rem;
}

.time-saved-value {
  color: #3b82f6;
  font-weight: 700;
  font-size: 1.3rem;
  margin: 0;
}

.vs-current {
  color: #6b7280;
  font-size: 0.85rem;
}

.rush-impact-value {
  color: #ef4444;
  font-weight: 700;
  font-size: 1.3rem;
  margin: 0;
}

.rush-description {
  color: #6b7280;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .chart-wrapper {
    padding: 1rem;
    position: relative;
    overflow: hidden;
  }
  
  .chart-wrapper::after {
    content: "← Swipe to explore all hours →";
    position: absolute;
    bottom: 0.5rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7rem;
    color: #9ca3af;
    font-style: italic;
    pointer-events: none;
    opacity: 1;
    transition: opacity 0.3s ease;
  }
  
  .chart-legend {
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    align-items: flex-start;
  }
  
  .legend-item {
    font-size: 0.8rem;
  }
  
  .chart-area {
    height: 220px;
    overflow: hidden;
  }
  
  .y-axis {
    top: 20px;
    width: 35px;
  }
  
  .y-axis-label {
    font-size: 0.65rem;
    right: 4px;
  }
  
  .chart-bars-container {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    padding-top: 20px;
    overflow-x: auto;
    overflow-y: visible;
  }
  
  .chart-bars {
    gap: 2px;
    padding: 0 8px;
    width: 600px;
    min-width: 500px;
  }
  
  .bar-wrapper {
    min-width: 22px;
    width: 22px;
    flex: 0 0 22px;
  }
  
  .bar-container {
    padding: 0 1px;
  }
  
  .time-label {
    font-size: 0.6rem;
    margin-top: 6px;
    height: 18px;
  }
  
  .x-axis-line {
    bottom: 24px;
  }
  
  .bar-value {
    font-size: 0.6rem;
    padding: 1px 3px;
  }
  
  .bar-value.hover-value {
    font-size: 0.6rem;
    padding: 2px 3px;
  }
  
  .insights {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .insight-item {
    padding: 1rem;
    gap: 0.75rem;
  }
  
  .insight-icon {
    font-size: 1.5rem;
  }
  
  .insight-content h4 {
    font-size: 0.8rem;
  }
  
  .optimal-time,
  .time-saved-value,
  .rush-impact-value {
    font-size: 1.1rem;
  }
  
  .optimal-duration,
  .vs-current,
  .rush-description {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .chart-header h3 {
    font-size: 1.2rem;
  }
  
  .chart-header p {
    font-size: 0.8rem;
  }
  
  .current-time {
    font-size: 0.8rem;
  }
  
  .chart-wrapper {
    padding: 0.75rem;
    position: relative;
    overflow: hidden;
  }
  
  .chart-legend {
    gap: 0.5rem;
  }
  
  .legend-item {
    font-size: 0.75rem;
  }
  
  .chart-area {
    height: 180px;
    overflow: hidden;
  }
  
  .y-axis {
    top: 20px;
    width: 30px;
  }
  
  .y-axis-label {
    font-size: 0.6rem;
    right: 2px;
  }
  
  .chart-bars {
    gap: 1px;
    padding: 0 4px;
    width: 480px;
    min-width: 400px;
  }
  
  .bar-wrapper {
    min-width: 18px;
    width: 18px;
    flex: 0 0 18px;
  }
  
  .time-label {
    font-size: 0.55rem;
    height: 16px;
  }
  
  .x-axis-line {
    bottom: 22px;
  }
  
  .bar-value {
    font-size: 0.6rem;
    padding: 1px 3px;
  }
  
  .bar-value.hover-value {
    font-size: 0.6rem;
    padding: 2px 3px;
  }
  
  .chart-footer {
    padding: 1rem;
  }
  
  .insight-item {
    padding: 0.75rem;
    gap: 0.5rem;
  }
  
  .insight-icon {
    font-size: 1.25rem;
  }
  
  .insight-content h4 {
    font-size: 0.75rem;
  }
  
  .optimal-time,
  .time-saved-value,
  .rush-impact-value {
    font-size: 1rem;
  }
  
  .optimal-duration,
  .vs-current,
  .rush-description {
    font-size: 0.7rem;
  }
}
</style> 