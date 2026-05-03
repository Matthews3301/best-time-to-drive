<template>
  <div class="chart-container">
    <div
      v-if="isLoading"
      class="chart-loading chart-ready"
      :class="{ 'chart-loading-non-today': departDate }"
      aria-busy="true"
      aria-live="polite"
    >
      <div class="chart-header chart-loading-header">
        <h3>{{ chartTitle }}</h3>
        <div class="skeleton skeleton-subtitle"></div>
        <div class="skeleton skeleton-subtitle short"></div>
        <div class="route-summary-card skeleton-summary-card">
          <div class="skeleton skeleton-headline"></div>
          <div class="skeleton skeleton-headline short"></div>
        </div>
      </div>

      <div class="chart-footer">
        <div class="insights">
          <div class="insight-item skeleton-insight" v-for="item in departDate ? 1 : 3" :key="`loading-insight-${item}`">
            <div class="skeleton skeleton-insight-icon"></div>
            <div class="skeleton-insight-content">
              <div class="skeleton skeleton-insight-label"></div>
              <div class="skeleton skeleton-insight-value"></div>
              <div class="skeleton skeleton-insight-meta"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-content">
        <div class="chart-wrapper hide-hint">
          <div class="chart-legend">
            <div class="legend-item" v-for="item in 2" :key="`loading-legend-${item}`">
              <div class="skeleton skeleton-legend-color"></div>
              <div class="skeleton skeleton-legend-label"></div>
            </div>
          </div>

          <div class="chart-area">
            <div class="y-axis">
              <div
                class="skeleton skeleton-y-tick"
                v-for="(position, tick) in ['85%', '58%', '31%', '4%']"
                :key="`loading-y-${tick}`"
                :style="{ bottom: position }"
              ></div>
            </div>

            <div class="chart-bars-container">
              <div class="chart-bars">
                <div class="bar-wrapper" v-for="bar in 24" :key="`loading-bar-${bar}`">
                  <div class="bar-container">
                    <div class="skeleton skeleton-bar"></div>
                  </div>
                  <div class="skeleton skeleton-time-label" :class="{ 'invisible': bar % 3 !== 1 }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="forecastData.length === 0" class="chart-empty">
      <p>{{ routeSummary || 'Unable to generate a traffic forecast for this route. Please try a different route.' }}</p>
    </div>
    <div v-else class="chart-ready">
    <div class="chart-header">
      <h3>{{ chartTitle }}</h3>
      <p class="route-subtitle">{{ routeData.start }} → {{ routeData.end }} ({{ routeData.distance }})</p>
      <p class="route-subtitle">Current drive time: {{ formatDuration(currentDuration) }}</p>
      <div v-if="routeSummary" class="route-summary-card">
        <p class="route-summary-text">
          {{ routeSummary }}
        </p>
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
        
        <div class="insight-item time-saved" v-if="!departDate">
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
        
        <div class="insight-item rush-hour" v-if="!departDate">
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
    
    <div class="chart-content">
      <div class="chart-wrapper" :class="{ 'hide-hint': !showScrollHint }">
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color optimal"></div>
            <span>Optimal Time ({{ optimalTime }})</span>
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
              {{ formatDurationYAxis(tick) }}
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
                  </div>
                  <div 
                    class="bar-value" 
                    :class="{ 
                      'hover-value': hoveredBarIndex === index,
                      'always-show': shouldShowValue(index)
                    }"
                    :style="getBarValueStyle(dataPoint, index)"
                    v-if="shouldShowValue(index) || hoveredBarIndex === index"
                  >
                    {{ formatDuration(dataPoint.duration) }}
                  </div>
                </div>
                <div class="time-label" :class="{ 'invisible': !shouldShowTimeLabel(index) }">
                  {{ formatTimeLabel(dataPoint.label) }}
                </div>
              </div>
            </div>
            
            <!-- <div class="x-axis-line"></div> -->
          </div>
        </div>
      </div>
    </div>
    
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const props = defineProps({
  routeData: {
    type: Object,
    required: true
  },
  forecastData: {
    type: Array,
    required: true
  },
  departDate: {
    type: [Date, null],
    required: false,
    default: null
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  routeSummary: {
    type: String,
    default: ''
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});
const chartTitle = computed(() => {
  if (props.departDate instanceof Date) {
    const y = props.departDate.getFullYear();
    const m = String(props.departDate.getMonth() + 1).padStart(2, '0');
    const d = String(props.departDate.getDate()).padStart(2, '0');
    return `24-Hour Traffic Forecast for ${y}-${m}-${d}`;
  }
  return '24-Hour Traffic Forecast';
});

const emit = defineEmits(['time-selected']);

const selectedTimeSlot = ref(null);
const windowWidth = ref(window.innerWidth);
const showScrollHint = ref(true);
const hoveredBarIndex = ref(null);
const touchTimeout = ref(null);

const currentTime = computed(() => {
  return dayjs().tz(props.timezone).format('HH:mm');
});

const maxDuration = computed(() => {
  if (props.forecastData.length === 0) return 0;
  return Math.max(...props.forecastData.map(d => d.duration));
});

const minDuration = computed(() => {
  if (props.forecastData.length === 0) return 0;
  const availableTimes = props.forecastData.filter(dataPoint => !dataPoint.isExcluded);
  return availableTimes.length > 0 ? Math.min(...availableTimes.map(d => d.duration)) : Math.min(...props.forecastData.map(d => d.duration));
});

const yAxisMax = computed(() => {
  return Math.ceil(maxDuration.value / 10) * 10;
});

const yAxisTicks = computed(() => {
  const maxDuration = yAxisMax.value;
  const preferredIntervals = [10, 15, 20, 30, 45, 60, 90, 120, 150, 180, 240, 300, 360];
  let interval = 15;
  if (maxDuration <= 60) {
    interval = 15;
  } else if (maxDuration <= 120) {
    interval = 30;
  } else if (maxDuration <= 180) {
    interval = 45;
  } else {
    interval = 90;
  }
  // Calculate the number of ticks based on the interval
  let numberOfTicks = Math.ceil(maxDuration / interval);
  // Adjust the interval if the number of ticks exceeds 8
  while (numberOfTicks > 8) {
    interval *= 2;
    numberOfTicks = Math.ceil(maxDuration / interval);
  }
  const ticks = [];
  for (let i = 0; i <= maxDuration; i += interval) {
    ticks.push(i);
  }
  if (ticks[ticks.length - 1] < maxDuration) {
    ticks.push(maxDuration);
  }
  // Remove second-to-last tick if it's too close to the last tick (within 10%)
  if (ticks.length >= 2) {
    const lastTick = ticks[ticks.length - 1];
    const secondLastTick = ticks[ticks.length - 2];
    if (lastTick - secondLastTick < lastTick * 0.1) {
      ticks.splice(ticks.length - 2, 1);
    }
  }
  return ticks;
});

const optimalTimeData = computed(() => {
  if (props.forecastData.length === 0) {
    return { time: '', duration: 0, label: '00:00', hour: 0, isExcluded: false };
  }
  const availableTimes = props.forecastData.filter(dataPoint => !dataPoint.isExcluded);
  if (availableTimes.length === 0) {
    return props.forecastData[0];
  }
  return availableTimes.reduce((min, current) => 
    current.duration < min.duration ? current : min
  );
});

const optimalTime = computed(() => {
  return formatTimeLabel(optimalTimeData.value.label);
});

const optimalDuration = computed(() => {
  return optimalTimeData.value.duration;
});

const currentDuration = computed(() => {
  return props.forecastData[0]?.duration || 0;
});

const timeSaved = computed(() => {
  const currentTimeData = props.forecastData[0];
  if (currentTimeData && currentTimeData.isExcluded) {
    return 0;
  }
  return Math.max(0, currentDuration.value - optimalDuration.value);
});

const rushHourIncrease = computed(() => {
  const increase = ((maxDuration.value - minDuration.value) / minDuration.value) * 100;
  return Math.round(increase);
});

const hasExcludedTimes = computed(() => {
  return props.forecastData.some(dataPoint => dataPoint.isExcluded);
});

const getBarStyle = (dataPoint) => {
  const heightPercent = (dataPoint.duration / yAxisMax.value) * 100;
  return {
    height: `${Math.max(heightPercent, 1)}%`
  };
};

const getBarValueStyle = (dataPoint, index) => {
  const heightPercent = (dataPoint.duration / yAxisMax.value) * 100;
  const isHovered = hoveredBarIndex.value === index;
  
  if (isHovered) {
    // Center the hover value on the bar
    return {
      bottom: `calc(${Math.max(heightPercent, 1)}% / 2)`,
    };
  } else {
    // Position always-show value at the top of the bar
    return {
      bottom: `${Math.max(heightPercent, 1)}%`,
    };
  }
};

const getBarClass = (dataPoint) => {
  const isCurrent = dataPoint === props.forecastData[0];
  const isExcluded = dataPoint.isExcluded;
  if (isExcluded && isCurrent) {
    return { 'excluded': true, 'current': true };
  }
  if (isExcluded) {
    return { 'excluded': true };
  }
  const isOptimal = dataPoint.duration === minDuration.value;
  const isHighTraffic = dataPoint.duration > (minDuration.value * 1.3);
  return {
    'optimal': isOptimal,
    'high-traffic': isHighTraffic && !isOptimal,
    'current': isCurrent,
    'normal': !isOptimal && !isHighTraffic && !isCurrent
  };
};

const getYAxisLabelStyle = (tick) => {
  const chartHeight = 100;
  const position = (tick / yAxisMax.value) * chartHeight;
  return {
    bottom: `${position}%`
  };
};

const shouldShowTimeLabel = (index) => {
  if (windowWidth.value >= 1200) {
    return true;
  } else if (windowWidth.value >= 768) {
    return index % 2 === 0;
  } else if (windowWidth.value >= 480) {
    return index % 3 === 0;
  } else {
    return index % 4 === 0;
  }
};

const shouldShowValue = (index) => {
  const dataPoint = props.forecastData[index];
  const isMinOrMax = dataPoint.duration === minDuration.value || dataPoint.duration === maxDuration.value;
  
  if (!isMinOrMax) return false;
  
  // Hide if previous bar has the same value (keep first occurrence only)
  if (index > 0) {
    const prevDuration = props.forecastData[index - 1].duration;
    const prevIsMinOrMax = prevDuration === minDuration.value || prevDuration === maxDuration.value;
    if (prevIsMinOrMax && prevDuration === dataPoint.duration) {
      return false;
    }
  }
  
  return true;
};

const formatTimeLabel = (timeString) => {
  const [hourStr] = timeString.split(':');
  const hourNum = parseInt(hourStr);
  if (hourNum === 0) return '12AM';
  if (hourNum === 12) return '12PM';
  if (hourNum < 12) return `${hourNum}AM`;
  return `${hourNum - 12}PM`;
};

const formatDuration = (minutes) => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
};

const formatDurationYAxis = (minutes) => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}`;
  }
  return `0:${minutes.toString().padStart(2, '0')}`;
};

const formatDurationLong = (minutes) => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
};

const selectTime = (dataPoint) => {
  selectedTimeSlot.value = dataPoint;
  emit('time-selected', dataPoint);
};

const formatCurrentHour = () => {
  const currentDate = new Date();
  const currentHour = currentDate.getHours();
  const formattedHour = currentHour.toString().padStart(2, '0');
  const formattedMinute = currentDate.getMinutes().toString().padStart(2, '0');
  return `${formattedHour}:${formattedMinute}`;
};

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

const scrollToCurrentTime = () => {
  if (windowWidth.value <= 768) {
    nextTick(() => {
      const chartBarsContainer = document.querySelector('.chart-bars-container');
      if (chartBarsContainer) {
        chartBarsContainer.scrollLeft = 0;
      }
    });
  }
};

const hideScrollHint = () => {
  showScrollHint.value = false;
};

const handleTouchStart = (index) => {
  if (touchTimeout.value) {
    clearTimeout(touchTimeout.value);
  }
  hoveredBarIndex.value = index;
};

const handleTouchEnd = () => {
  touchTimeout.value = setTimeout(() => {
    hoveredBarIndex.value = null;
  }, 2000);
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  scrollToCurrentTime();
  nextTick(() => {
    const chartBarsContainer = document.querySelector('.chart-bars-container');
    if (chartBarsContainer) {
      chartBarsContainer.addEventListener('scroll', hideScrollHint);
      chartBarsContainer.addEventListener('touchstart', hideScrollHint);
    }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  const chartBarsContainer = document.querySelector('.chart-bars-container');
  if (chartBarsContainer) {
    chartBarsContainer.removeEventListener('scroll', hideScrollHint);
    chartBarsContainer.removeEventListener('touchstart', hideScrollHint);
  }
  if (touchTimeout.value) {
    clearTimeout(touchTimeout.value);
  }
});
</script>

<style scoped>
.chart-container {
  --chart-state-min-height: 897px;
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

.chart-loading {
  min-height: var(--chart-state-min-height);
}

.skeleton {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: linear-gradient(100deg, #e2e8f0 30%, #f8fafc 45%, #e2e8f0 60%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

.skeleton-subtitle {
  width: min(560px, 100%);
  height: 19px;
  margin: 0 0 0.6rem 0;
}

.skeleton-subtitle.short {
  width: min(320px, 70%);
}

.skeleton-summary-card {
  background: linear-gradient(135deg, #eef2ff, #f8fafc);
}

.skeleton-headline {
  width: 100%;
  height: 18px;
  margin-bottom: 0.45rem;
}

.skeleton-headline.short {
  width: 72%;
  margin-bottom: 0;
}

.skeleton-y-tick {
  position: absolute;
  right: 8px;
  width: 44px;
  height: 10px;
  transform: translateY(50%);
}

.skeleton-legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.skeleton-legend-label {
  width: 120px;
  height: 14px;
}

.skeleton-insight {
  pointer-events: none;
}

.skeleton-insight-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
  flex-shrink: 0;
}

.skeleton-insight-content {
  flex: 1;
}

.skeleton-insight-label {
  width: 125px;
  height: 17px;
  margin: 0 0 0.5rem 0;
}

.skeleton-insight-value {
  width: 90px;
  height: 25px;
  margin-bottom: 0.35rem;
}

.skeleton-insight-meta {
  width: 145px;
  height: 14px;
}

.skeleton-bar {
  width: 100%;
  min-height: 4px;
  border-radius: 6px 6px 0 0;
}

.bar-wrapper:nth-child(1) .skeleton-bar { height: 46%; }
.bar-wrapper:nth-child(2) .skeleton-bar { height: 65%; }
.bar-wrapper:nth-child(3) .skeleton-bar { height: 58%; }
.bar-wrapper:nth-child(4) .skeleton-bar { height: 76%; }
.bar-wrapper:nth-child(5) .skeleton-bar { height: 52%; }
.bar-wrapper:nth-child(6) .skeleton-bar { height: 68%; }
.bar-wrapper:nth-child(7) .skeleton-bar { height: 84%; }
.bar-wrapper:nth-child(8) .skeleton-bar { height: 60%; }
.bar-wrapper:nth-child(9) .skeleton-bar { height: 55%; }
.bar-wrapper:nth-child(10) .skeleton-bar { height: 70%; }
.bar-wrapper:nth-child(11) .skeleton-bar { height: 62%; }
.bar-wrapper:nth-child(12) .skeleton-bar { height: 82%; }
.bar-wrapper:nth-child(13) .skeleton-bar { height: 66%; }
.bar-wrapper:nth-child(14) .skeleton-bar { height: 49%; }
.bar-wrapper:nth-child(15) .skeleton-bar { height: 72%; }
.bar-wrapper:nth-child(16) .skeleton-bar { height: 64%; }
.bar-wrapper:nth-child(17) .skeleton-bar { height: 79%; }
.bar-wrapper:nth-child(18) .skeleton-bar { height: 57%; }
.bar-wrapper:nth-child(19) .skeleton-bar { height: 74%; }
.bar-wrapper:nth-child(20) .skeleton-bar { height: 53%; }
.bar-wrapper:nth-child(21) .skeleton-bar { height: 69%; }
.bar-wrapper:nth-child(22) .skeleton-bar { height: 61%; }
.bar-wrapper:nth-child(23) .skeleton-bar { height: 77%; }
.bar-wrapper:nth-child(24) .skeleton-bar { height: 59%; }

.skeleton-time-label {
  width: 20px;
  height: 10px;
  margin: 8px auto 0 auto;
  border-radius: 4px;
}

.skeleton-time-label.invisible {
  opacity: 0;
}

@keyframes skeleton-shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}

.chart-empty {
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  padding: 0 1rem;
}

.chart-empty p {
  margin: 0;
  max-width: 560px;
  line-height: 1.5;
}

.chart-header {
  margin-bottom: 1.5rem;
  flex-shrink: 0;
}

.chart-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: #1f2937;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: left;
}

.chart-header p {
  margin: 0 0 0.6rem 0;
  color: #64748b;
  font-size: 0.9rem;
}

.route-subtitle {
  margin: 0 0 0.6rem 0;
  color: #6b7280;
  font-size: 1rem;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
}

.route-summary-card {
  margin-top: 1rem;
  padding: 1rem 1.1rem;
  border-radius: 10px;
  background: linear-gradient(135deg, #eef2ff, #f8fafc);
  border: 1px solid #dbeafe;
}

.route-summary-label {
  margin: 0 0 0.35rem 0;
  color: #4338ca;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.route-summary-text {
  margin: 0;
  color: #334155;
  font-size: 0.98rem;
  line-height: 1.5;
  font-weight: 500;
  margin: 0 !important;
}

.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.current-time {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.chart-content {
  margin-bottom: 1.5rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.chart-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.5rem;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
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
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.legend-color.current {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.legend-color.high-traffic {
  background: linear-gradient(135deg, #f87171, #ef4444);
}

.legend-color.excluded {
  background: linear-gradient(135deg, #d1d5db, #9ca3af);
  opacity: 0.7;
}

.chart-area {
  display: flex;
  height: 300px;
  position: relative;
  max-width: calc(100vw - 12rem);
  overflow: hidden;
}

.y-axis {
  top: 0px;
  margin-bottom: 30px;
  margin-top: 22px;
  width: 70px;
  position: relative;
  border-right: 2px solid #e2e8f0;
  z-index: 1;
}

.y-axis-label {
  position: absolute;
  right: 8px;
  font-size: 0.75rem;
  color: #64748b;
  transform: translateY(50%);
  padding: 0 4px;
}

.chart-bars-container {
  flex: 1;
  padding-top: 30px;
  position: relative;
  overflow-x: auto;
  overflow-y: visible;
  z-index: 10;
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
  width: calc((100% - 23px) / 24);
  overflow: visible;
}

.bar-container {
  flex: 1;
  display: flex;
  align-items: end;
  padding: 0 2px;
  height: 100%;
  overflow: visible;
  position: relative;
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
  z-index: 1;
}

.bar:hover {
  transform: scaleY(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  z-index: 2;
}

.bar.optimal {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.bar.current {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.bar.high-traffic {
  background: linear-gradient(135deg, #f87171, #ef4444);
}

.bar.normal {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.bar.excluded {
  background: linear-gradient(135deg, #d1d5db, #9ca3af);
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
  z-index: 1000;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  padding: 1px 3px;
  position: absolute;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  transition: all 0.2s ease;
  left: 50%;
  transform: translateX(-50%);
}

.bar-value.always-show {
  margin-bottom: 2px;
}

.bar-value.hover-value {
  transform: translate(-50%, 50%);
  background: rgba(0, 0, 0, 0.85);
  font-size: 0.65rem;
  padding: 2px 4px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin-bottom: 0;
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
  background: linear-gradient(135deg, #f1f5f9, #e5e7eb);
  padding: 2rem;
  margin-bottom: 1.5rem;
  border-radius: 10px;
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
  border-radius: 10px;
  flex-shrink: 0;
}

.insight-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.best-time .insight-icon {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.time-saved .insight-icon {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.rush-hour .insight-icon {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.insight-content h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 0.9rem;
  font-weight: 600;
}

.optimal-time {
  color: #3b82f6;
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
  .chart-container {
    --chart-state-min-height: 910px;
  }

  .chart-loading-non-today {
    --chart-state-min-height: 709px;
  }

  .chart-wrapper {
    padding: 1rem;
    position: relative;
    overflow: hidden;
  }
  
  .chart-wrapper::after {
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
    max-width: calc(100vw - 6.5rem);
    overflow: hidden;
  }
  
  .y-axis {
    width: 35px;
    margin-bottom: 24px;
    margin-top: 20px;
  }
  
  .y-axis-label {
    font-size: 0.65rem;
    right: 4px;
  }

  .skeleton-y-tick {
    right: 4px;
  }
  
  .chart-bars-container {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    padding-top: 30px;
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
    width: calc((100% - 46px) / 24);
    flex: 0 0 auto;
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

  .skeleton-insight-label {
    height: 15px;
  }
  
  .optimal-time,
  .time-saved-value,
  .rush-impact-value {
    font-size: 1.1rem;
  }
  
  .optimal-duration,
  .vs-current,
  .rush-description,
  .route-summary-label,
  .route-summary-text {
    font-size: 0.75rem;
    margin: 0 !important;
  }

  .route-summary-card {
    margin-top: 0.85rem;
    padding: 0.9rem 1rem;
  }
}

@media (max-width: 480px) {
  .chart-header h3 {
    font-size: 1.2rem;
  }

  .skeleton-subtitle {
    height: 14px;
  }

  .skeleton-headline {
    height: 16px;
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
    margin-bottom: 44px;
    margin-top: 20px;
  }
  
  .y-axis-label {
    font-size: 0.6rem;
    right: 2px;
  }

  .skeleton-y-tick {
    right: 2px;
  }
  
  .chart-bars {
    gap: 1px;
    padding: 0 10px;
    width: 480px;
    min-width: 400px;
  }
  
  .bar-wrapper {
    min-width: 18px;
    width: calc((100% - 23px) / 24);
    flex: 0 0 auto;
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