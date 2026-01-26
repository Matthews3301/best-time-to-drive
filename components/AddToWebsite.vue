<template>
  <div class="add-website">
    <div class="header-section">
      <h2 class="add-title"> Add to Your Website</h2>
      <p class="add-desc">
        Help your visitors plan their trip better. Perfect for restaurants, retail stores, offices, event venues, and any business where timing matters.
      </p>
    </div>

    <div class="benefits-grid">
      <div class="benefit-card">
        <span class="benefit-icon">⏰</span>
        <h3>Reduce No-Shows</h3>
        <p>Help customers avoid traffic delays</p>
      </div>
      <div class="benefit-card">
        <span class="benefit-icon">✨</span>
        <h3>Better Experience</h3>
        <p>Show you care about their time</p>
      </div>
      <div class="benefit-card">
        <span class="benefit-icon">🎯</span>
        <h3>More Visits</h3>
        <p>Make it easier to plan visits during off-peak times</p>
      </div>
    </div>

    <div class="snippet-section">
      <h3 class="section-title">Choose Your Style</h3>
      
      <div class="style-options">
        <button 
          v-for="style in styles" 
          :key="style.id"
          class="style-btn"
          :class="{ active: selectedStyle === style.id }"
          @click="selectedStyle = style.id"
        >
          {{ style.name }}
        </button>
      </div>

      <div class="preview-section">
        <div class="preview-container">
          <div class="preview-label">Preview</div>
          <button class="copy-btn" @click="copyHtml" :disabled="copied">
            <span v-if="copied">Copied!</span>
            <span v-else>Copy HTML Code</span>
          </button>
          </div>
          <div class="preview" v-html="currentPreview"></div>
      </div>

    </div>

    <div class="footer-note">
      <p>No signup required. Just copy and paste the code above into your website.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, computed } from 'vue';

const props = defineProps({
  target: {
    type: String,
    required: true
  },
  forecastData: {
    type: Array,
    required: true
  }
});

const url = computed(() => `https://rushhourplanner.com/?to=${encodeURIComponent(props.target)}`);
const selectedStyle = ref('detailed');
const copied = ref(false);

const styles = [
  { id: 'detailed', name: 'Detailed' },
  { id: 'icon', name: 'Icon' },
  { id: 'graph', name: 'Graph' }
];

// Calculate min and max durations from forecast data
const minDuration = computed(() => {
  const availableTimes = props.forecastData.filter(d => !d.isExcluded);
  return availableTimes.length > 0 ? Math.min(...availableTimes.map(d => d.duration)) : Math.min(...props.forecastData.map(d => d.duration));
});

const maxDuration = computed(() => {
  return Math.max(...props.forecastData.map(d => d.duration));
});

// Generate bar HTML for a data point
const getBarColor = (dataPoint) => {
  if (dataPoint.isExcluded) {
    return 'linear-gradient(135deg, #d1d5db, #9ca3af)';
  }
  const isOptimal = dataPoint.duration === minDuration.value;
  const isHighTraffic = dataPoint.duration > (minDuration.value * 1.3);
  
  if (isOptimal) {
    return 'linear-gradient(135deg, #3b82f6, #2563eb)';
  } else if (isHighTraffic) {
    return 'linear-gradient(135deg, #f87171, #ef4444)';
  } else {
    return 'linear-gradient(135deg, #6b7280, #4b5563)';
  }
};

const getBarHeight = (dataPoint) => {
  return Math.round((dataPoint.duration / maxDuration.value) * 100);
};

const formatTimeLabel = (timeString) => {
  const [hourStr] = timeString.split(':');
  const hourNum = parseInt(hourStr);
  if (hourNum === 0) return '12AM';
  if (hourNum === 12) return '12PM';
  if (hourNum < 12) return `${hourNum}AM`;
  return `${hourNum - 12}PM`;
};

// Normalize data to always start at 12AM (midnight)
const normalizedForecastData = computed(() => {
  if (!props.forecastData || props.forecastData.length === 0) return [];
  
  // Find the index where hour is 0 (12AM/midnight)
  const midnightIndex = props.forecastData.findIndex(d => d.hour === 0);
  
  // If midnight is not found or already at the start, return as-is
  if (midnightIndex === -1 || midnightIndex === 0) {
    return props.forecastData;
  }
  
  // Rearrange: take everything from midnight onwards, then everything before midnight
  return [
    ...props.forecastData.slice(midnightIndex),
    ...props.forecastData.slice(0, midnightIndex)
  ];
});

// Generate all 24 bars HTML
const generateBarsHtml = () => {
  return normalizedForecastData.value.map(dataPoint => {
    const height = getBarHeight(dataPoint);
    const color = getBarColor(dataPoint);
    const label = formatTimeLabel(dataPoint.label);
    return `<div class="bar" title="${label}" style="background:${color};height:${height}%"></div>`;
  }).join('');
};

const snippets = computed(() => ({
  icon: `<a href="${url.value}" target="_blank" rel="noopener" title="Check traffic times for ${props.target}" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none; transition: transform 0.2s;">
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
    <circle cx="16" cy="10" r="3" fill="#EF4444"/>
    <circle cx="16" cy="16" r="3" fill="#FCD34D"/>
    <circle cx="16" cy="22" r="3" fill="#10B981"/>
  </svg>
  <span style="color: #1e293b; font-size: 14px; font-weight: 600;">Traffic</span>
</a>`,
  
  detailed: `<div style="padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
  <h4 style="margin: 0 0 8px 0; color: #1e293b; font-size: 18px;">🚗 Planning Your Visit?</h4>
  <p style="margin: 0; color: #475569; font-size: 14px;">
    Use <a href="${url.value}" target="_blank" rel="noopener" style="color: #6366f1; text-decoration: none; font-weight: 600;">rush hour calculator for ${props.target}</a> to avoid traffic delays.
  </p>
</div>`,
  
  graph: `<style>
  .bar{flex:1;border-radius:4px 4px 0 0;box-shadow:0 2px 4px rgba(0,0,0,.1);cursor:pointer;transition:transform .2s,box-shadow .2s}
  .bar:hover{transform:scaleY(1.05);box-shadow:0 4px 8px rgba(0,0,0,.2)}
  @media (max-width:640px){
    .traffic-y-axis{display:none!important}
    .traffic-chart-container{gap:0!important}
    .traffic-time-labels{padding-left:0!important}
  }
</style>
<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.05);margin:20px 0;width:100%;box-sizing:border-box">
  <h4 style="margin:0 0 16px 0;color:#1e293b;font-size:18px;font-weight:600">Daily Traffic Levels</h4>
  <div class="traffic-chart-container" style="display:flex;gap:12px;height:180px;margin-bottom:16px;align-items:flex-end">
    <div class="traffic-y-axis" style="display:flex;flex-direction:column;justify-content:space-between;height:100%;padding-right:10px;border-right:2px solid #e5e7eb;min-width:50px">
      <span style="font-size:12px;color:#6b7280;font-weight:500">High</span>
      <span style="font-size:12px;color:#6b7280;font-weight:500">Medium</span>
      <span style="font-size:12px;color:#6b7280;font-weight:500">Low</span>
    </div>
    <div style="flex:1;display:flex;gap:3px;align-items:flex-end;height:100%">
      ${generateBarsHtml()}
    </div>
  </div>
  <div class="traffic-time-labels" style="display:flex;justify-content:space-between;font-size:11px;color:#6b7280;margin-bottom:16px;padding-left:62px;font-weight:500">
    <span>12AM</span>
    <span>6AM</span>
    <span>12PM</span>
    <span>6PM</span>
    <span>11PM</span>
  </div>
  <div class="traffic-legend" style="display:flex;justify-content:center;gap:20px;margin-bottom:12px;font-size:11px;color:#6b7280">
    <span style="display:flex;align-items:center;gap:6px">
      <span style="width:10px;height:10px;border-radius:2px;background:linear-gradient(135deg,#f87171,#ef4444)"></span>
      <span>Heavy Traffic</span>
    </span>
    <span style="display:flex;align-items:center;gap:6px">
      <span style="width:10px;height:10px;border-radius:2px;background:linear-gradient(135deg,#3b82f6,#2563eb)"></span>
      <span>Low Traffic</span>
    </span>
  </div>
  <div style="text-align:right;padding-top:12px;border-top:1px solid #e5e7eb">
    <a href="${url.value}" target="_blank" rel="noopener" style="color:#9ca3af;text-decoration:none;font-size:12px">Source: Rush Hour Planner</a>
  </div>
</div>`
}));

const previews = computed(() => ({
  icon: `<a href="${url.value}" target="_blank" rel="noopener" title="Check traffic times for ${props.target}" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none; transition: transform 0.2s;">
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
    <circle cx="16" cy="10" r="3" fill="#EF4444"/>
    <circle cx="16" cy="16" r="3" fill="#FCD34D"/>
    <circle cx="16" cy="22" r="3" fill="#10B981"/>
  </svg>
  <span style="color: #1e293b; font-size: 14px; font-weight: 600;">Traffic</span>
</a>`,
  
  detailed: `<div style="padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
  <h4 style="margin: 0 0 8px 0; color: #1e293b; font-size: 18px;">🚗 Planning Your Visit?</h4>
  <p style="margin: 0; color: #475569; font-size: 14px;">
    Use <a href="${url.value}" target="_blank" rel="noopener" style="color: #6366f1; text-decoration: none; font-weight: 600;">rush hour calculator for ${props.target}</a> to avoid traffic delays.
  </p>
</div>`,
  
  graph: `<style>
  .bar{flex:1;border-radius:4px 4px 0 0;box-shadow:0 2px 4px rgba(0,0,0,.1);cursor:pointer;transition:transform .2s,box-shadow .2s}
  .bar:hover{transform:scaleY(1.05);box-shadow:0 4px 8px rgba(0,0,0,.2)}
  @media (max-width:640px){
    .traffic-y-axis{display:none!important}
    .traffic-chart-container{gap:0!important}
    .traffic-time-labels{padding-left:0!important}
  }
</style>
<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.05);width:100%;box-sizing:border-box">
  <h4 style="margin:0 0 16px 0;color:#1e293b;font-size:18px;font-weight:600">Daily Traffic Levels</h4>
  <div class="traffic-chart-container" style="display:flex;gap:12px;height:180px;margin-bottom:16px;align-items:flex-end">
    <div class="traffic-y-axis" style="display:flex;flex-direction:column;justify-content:space-between;height:100%;padding-right:10px;border-right:2px solid #e5e7eb;min-width:50px">
      <span style="font-size:12px;color:#6b7280;font-weight:500">High</span>
      <span style="font-size:12px;color:#6b7280;font-weight:500">Medium</span>
      <span style="font-size:12px;color:#6b7280;font-weight:500">Low</span>
    </div>
    <div style="flex:1;display:flex;gap:3px;align-items:flex-end;height:100%">
      ${generateBarsHtml()}
    </div>
  </div>
  <div class="traffic-time-labels" style="display:flex;justify-content:space-between;font-size:11px;color:#6b7280;margin-bottom:16px;padding-left:62px;font-weight:500">
    <span>12AM</span>
    <span>6AM</span>
    <span>12PM</span>
    <span>6PM</span>
    <span>11PM</span>
  </div>
  <div class="traffic-legend" style="display:flex;justify-content:center;gap:20px;margin-bottom:12px;font-size:11px;color:#6b7280">
    <span style="display:flex;align-items:center;gap:6px">
      <span style="width:10px;height:10px;border-radius:2px;background:linear-gradient(135deg,#f87171,#ef4444)"></span>
      <span>Heavy Traffic</span>
    </span>
    <span style="display:flex;align-items:center;gap:6px">
      <span style="width:10px;height:10px;border-radius:2px;background:linear-gradient(135deg,#3b82f6,#2563eb)"></span>
      <span>Low Traffic</span>
    </span>
  </div>
  <div style="text-align:right;padding-top:12px;border-top:1px solid #e5e7eb">
    <a href="${url.value}" target="_blank" rel="noopener" style="color:#9ca3af;text-decoration:none;font-size:12px">Source: Rush Hour Planner</a>
  </div>
</div>`
}));

const currentSnippet = computed(() => snippets.value[selectedStyle.value]);
const currentPreview = computed(() => previews.value[selectedStyle.value]);

async function copyHtml() {
  try {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(currentSnippet.value);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = currentSnippet.value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch (e) {
    // Best-effort; keep silent if clipboard fails
    copied.value = false;
  }
}
</script>

<style scoped>
.add-website {
  display: grid;
  gap: 2rem;
}

.header-section {
  text-align: left;
}

.add-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: #1f2937;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.add-desc {
  margin: 0;
  color: #64748b;
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 600px;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.benefit-card {
  background: #ffffff;
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #e2e8f0;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.benefit-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(99, 102, 241, 0.12);
}

.benefit-icon {
  font-size: 1.6rem;
  display: block;
  margin-bottom: 0.5rem;
}

.benefit-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.benefit-card p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.4;
}

.snippet-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
}

.section-title {
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #1f2937;
}

.style-options {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.style-btn {
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.625rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.style-btn:hover {
  border-color: #a5b4fc;
  background: #f5f6ff;
  color: #4f46e5;
}

.style-btn.active {
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  border-color: #6366f1;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.preview-section {
  margin-bottom: 1.5rem;
}

.preview-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.preview-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preview {
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 1.5rem;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.code-section {
  background: #0f172a;
  border-radius: 12px;
  overflow: hidden;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.code-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.copy-btn {
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-width: 150px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.copy-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.copy-btn:active {
  transform: translateY(0);
}

.copy-btn:disabled {
  background: #10b981;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: default;
}

.code-snippet {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
}

.code-snippet code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-break: break-word;
}

.footer-note {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 1px solid #fbbf24;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  text-align: center;
}

.footer-note p {
  margin: 0;
  color: #78350f;
  font-size: 0.95rem;
  line-height: 1.6;
}

.footer-note strong {
  color: #92400e;
}

@media (max-width: 640px) {
  .add-title {
    font-size: 1.5rem;
  }
  
  .add-desc {
    font-size: 1rem;
  }
  
  .benefits-grid {
    grid-template-columns: 1fr;
  }
  
  .snippet-section {
    padding: 1.5rem;
  }
  
  .style-options {
    flex-direction: column;
  }
  
  .style-btn {
    width: 100%;
  }
}
</style>

