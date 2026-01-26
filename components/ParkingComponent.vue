<template>
  <div class="parking-container">
    <div class="parking-header">
      <h3 class="parking-title">
        Parking Options
      </h3>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Finding parking options...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>{{ error }}</p>
      <button @click="fetchParkingInfo" class="retry-button">Try Again</button>
    </div>

    <div v-else-if="parkingData" class="parking-content">
      <div ref="parkingCardContainer">
        <div v-if="parkingData.parkingLocations && parkingData.parkingLocations.length > 0" class="parking-locations">
          <div 
            v-for="(location, index) in parkingData.parkingLocations" 
            :key="index"
            class="parking-card"
          >
            <div class="parking-card-header">
              <div class="parking-title-row">
                <div class="title-left">
                  <a 
                    :href="getGoogleMapsUrl(location.location)" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="location-icon-link"
                    :title="location.location"
                  >
                    <svg class="location-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </a>
                  <h3 class="parking-name">{{ location.name }}</h3>
                </div>
                <div class="title-right">
                  <span class="parking-category" :class="getCategoryClass(location.category)">{{ location.category }}</span>
                </div>
              </div>
            </div>
            
            <div class="parking-hours" v-if="location.hours">
              <svg class="hours-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>{{ location.hours }}</span>
            </div>
            
            <div class="parking-rates" v-if="location.paymentInfo">
              <svg class="rate-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              <span>{{ location.paymentInfo }}</span>
            </div>
            
            <p class="parking-description" v-if="location.description">{{ location.description }}</p>
          </div>
        </div>

        <div v-if="parkingData.otherInformation" class="other-info">
          <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <p class="other-info-text">{{ parkingData.otherInformation }}</p>
        </div>

        <div v-if="!parkingData.parkingLocations || parkingData.parkingLocations.length === 0" class="no-results">
          <p>No parking information available for this location.</p>
        </div>
      </div>

      <button @click="copyHtmlCode" class="copy-html-button">
        <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        {{ copyButtonText }}
      </button>
    </div>

    <div v-else class="initial-state">
      <button @click="fetchParkingInfo" class="load-button">
        Load Parking Information
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  destination: {
    type: String,
    required: true
  }
});

const loading = ref(false);
const error = ref(null);
const parkingData = ref(null);
const hasTriggeredLoad = ref(false);
const parkingCardContainer = ref(null);
const copyButtonText = ref('Copy HTML Code to Add to Your Website');

async function fetchParkingInfo() {
  if (!props.destination) {
    return;
  }

  loading.value = true;
  error.value = null;
  parkingData.value = null;

  try {
    const response = await fetch('/api/parking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destination: props.destination
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch parking information');
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      parkingData.value = data.data;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (err) {
    console.error('Error fetching parking info:', err);
    error.value = err.message || 'Failed to load parking information';
  } finally {
    loading.value = false;
  }
}

// Handle scroll events to trigger parking info loading
function handleScroll() {
  if (props.destination && !hasTriggeredLoad.value && !loading.value && !parkingData.value) {
    hasTriggeredLoad.value = true;
    fetchParkingInfo();
  }
}

// Get category class for styling
function getCategoryClass(category) {
  if (!category) return '';
  
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory.includes('street') || lowerCategory.includes('meter')) {
    return 'category-street';
  } else if (lowerCategory.includes('garage') || lowerCategory.includes('parking garage')) {
    return 'category-garage';
  } else if (lowerCategory.includes('lot') || lowerCategory.includes('parking lot')) {
    return 'category-lot';
  } else if (lowerCategory.includes('valet')) {
    return 'category-valet';
  } else if (lowerCategory.includes('residential')) {
    return 'category-residential';
  }
  
  return 'category-default';
}

// Get Google Maps URL
function getGoogleMapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// Get category background style
function getCategoryStyle(category) {
  if (!category) return 'background: linear-gradient(135deg, #6366f1, #4f46e5);';
  
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory.includes('street') || lowerCategory.includes('meter')) {
    return 'background: linear-gradient(135deg, #10b981, #059669);';
  } else if (lowerCategory.includes('garage') || lowerCategory.includes('parking garage')) {
    return 'background: linear-gradient(135deg, #6366f1, #4f46e5);';
  } else if (lowerCategory.includes('lot') || lowerCategory.includes('parking lot')) {
    return 'background: linear-gradient(135deg, #f59e0b, #d97706);';
  } else if (lowerCategory.includes('valet')) {
    return 'background: linear-gradient(135deg, #8b5cf6, #7c3aed);';
  } else if (lowerCategory.includes('residential')) {
    return 'background: linear-gradient(135deg, #64748b, #475569);';
  }
  
  return 'background: linear-gradient(135deg, #6366f1, #4f46e5);';
}

// Copy HTML code to clipboard
async function copyHtmlCode() {
  if (!parkingData.value) return;

  let htmlContent = `<style>
  .parking-widget * {
    box-sizing: border-box;
  }
  .parking-widget {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
  }
  .parking-widget .attribution-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .parking-widget .parking-locations {
    display: grid;
    gap: 0.5rem;
  }
  .parking-widget .parking-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 0.625rem;
  }
  .parking-widget .parking-card-header {
    margin-bottom: 0.25rem;
  }
  .parking-widget .parking-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .parking-widget .title-left {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex: 1;
    min-width: 0;
  }
  .parking-widget .title-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }
  .parking-widget .parking-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1a1d29;
    margin: 0;
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: auto;
    line-height: 1.4;
  }
  .parking-widget .location-icon-link {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6366f1;
    text-decoration: none;
    transition: all 0.2s;
    padding: 0.25rem;
    border-radius: 4px;
    margin-right: 0.25rem;
  }
  .parking-widget .location-icon-link:hover {
    color: #4f46e5;
    background: #f0f4ff;
  }
  .parking-widget .location-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
  .parking-widget .parking-hours {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0;
    color: #475569;
    font-size: 0.875rem;
    font-weight: 400;
    margin-bottom: 0.25rem;
  }
  .parking-widget .hours-icon {
    width: 18px;
    height: 18px;
    color: #64748b;
    flex-shrink: 0;
  }
  .parking-widget .parking-category {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    white-space: nowrap;
    color: white;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .parking-widget .parking-rates {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0;
    color: #475569;
    font-size: 0.875rem;
    font-weight: 400;
    margin-bottom: 0.25rem;
  }
  .parking-widget .rate-icon {
    width: 18px;
    height: 18px;
    color: #64748b;
    flex-shrink: 0;
  }
  .parking-widget .parking-description {
    color: #64748b;
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0.25rem 0 0 0;
    padding-top: 0.375rem;
    border-top: 1px solid #e2e8f0;
  }
  .parking-widget .other-info {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
  }
  .parking-widget .info-icon {
    width: 18px;
    height: 18px;
    color: #6366f1;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
  .parking-widget .other-info-text {
    color: #64748b;
    font-size: 0.875rem;
    line-height: 1.6;
    margin: 0;
  }
  .parking-widget .attribution-visible {
    text-align: center;
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e2e8f0;
  }
  .parking-widget .attribution-link {
    color: #6366f1;
    text-decoration: none;
    font-size: 0.75rem;
    transition: color 0.2s;
  }
  .parking-widget .attribution-link:hover {
    color: #4f46e5;
    text-decoration: underline;
  }
  @media (max-width: 768px) {
    .parking-widget .parking-card {
      padding: 0.5rem;
    }
    .parking-widget .parking-title-row {
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .parking-widget .parking-name {
      font-size: 1rem;
    }
    .parking-widget .location-icon {
      width: 16px;
      height: 16px;
    }
    .parking-widget .parking-category {
      font-size: 0.7rem;
      padding: 0.2rem 0.6rem;
    }
  }
</style>
<div class="parking-widget">
  <a href="https://rushhourplanner.com" target="_blank" rel="noopener noreferrer" class="attribution-hidden">Rush Hour Planner</a>
  
`;

  // Add parking locations
  if (parkingData.value.parkingLocations && parkingData.value.parkingLocations.length > 0) {
    htmlContent += '  <div class="parking-locations">\n';
    
    parkingData.value.parkingLocations.forEach(location => {
      const categoryStyle = getCategoryStyle(location.category);
      htmlContent += `    <div class="parking-card">
      <div class="parking-card-header">
        <div class="parking-title-row">
          <div class="title-left">
            <a href="${getGoogleMapsUrl(location.location)}" target="_blank" rel="noopener noreferrer" class="location-icon-link" title="${location.location}">
              <svg class="location-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </a>
            <h3 class="parking-name">${location.name}</h3>
          </div>
          <div class="title-right">
            <span class="parking-category" style="${categoryStyle}">${location.category}</span>
          </div>
        </div>
      </div>
`;
      
      if (location.hours) {
        htmlContent += `      <div class="parking-hours">
        <svg class="hours-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>${location.hours}</span>
      </div>
`;
      }
      
      if (location.paymentInfo) {
        htmlContent += `      <div class="parking-rates">
        <svg class="rate-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
        <span>${location.paymentInfo}</span>
      </div>
`;
      }
      
      if (location.description) {
        htmlContent += `      <p class="parking-description">${location.description}</p>
`;
      }
      
      htmlContent += '    </div>\n';
    });
    
    htmlContent += '  </div>\n';
  }

  // Add other information
  if (parkingData.value.otherInformation) {
    htmlContent += `  <div class="other-info">
    <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
    <p class="other-info-text">${parkingData.value.otherInformation}</p>
  </div>
`;
  }

  // Add visible attribution at the bottom
  htmlContent += `    
  <div class="attribution-visible">
    <a href="https://rushhourplanner.com" target="_blank" rel="noopener noreferrer" class="attribution-link">Rush Hour Planner</a>
  </div>
</div>`;

  try {
    await navigator.clipboard.writeText(htmlContent);
    copyButtonText.value = '✓ Copied!';
    setTimeout(() => {
      copyButtonText.value = 'Copy HTML Code to Add to Your Website';
    }, 2000);
  } catch (err) {
    console.error('Failed to copy HTML:', err);
    copyButtonText.value = 'Failed to copy';
    setTimeout(() => {
      copyButtonText.value = 'Copy HTML Code to Add to Your Website';
    }, 2000);
  }
}

// Watch for destination changes
watch(() => props.destination, () => {
  parkingData.value = null;
  error.value = null;
  hasTriggeredLoad.value = false;
});

// Set up scroll listener on mount
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
});

// Clean up scroll listener on unmount
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.parking-container {
  width: 100%;
}

.parking-header {
  margin-bottom: 1.5rem;
}

.parking-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: left;
}

.parking-icon {
  width: 28px;
  height: 28px;
  color: #6366f1;
}

.parking-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  gap: 1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #64748b;
  font-size: 0.875rem;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  gap: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
}

.error-icon {
  width: 48px;
  height: 48px;
  color: #ef4444;
}

.error-state p {
  color: #dc2626;
  font-size: 0.875rem;
  text-align: center;
}

.retry-button {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-button:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.parking-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.parking-locations {
  display: grid;
  gap: 0.5rem;
}

.parking-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.625rem;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
}

.parking-card-header {
  margin-bottom: 0.25rem;
}

.parking-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.title-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.parking-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1d29;
  margin: 0;
  overflow-wrap: break-word;
  word-wrap: break-word;
  hyphens: auto;
  line-height: 1.4;
}

.location-icon-link {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  text-decoration: none;
  transition: all 0.2s;
  padding: 0.25rem;
  border-radius: 4px;
  margin-right: 0.25rem;
}

.location-icon-link:hover {
  color: #4f46e5;
  background: #eef2ff;
}

.location-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.parking-hours {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 400;
  margin-bottom: 0.25rem;
}

.hours-icon {
  width: 18px;
  height: 18px;
  color: #64748b;
  flex-shrink: 0;
}

.parking-category {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  white-space: nowrap;
  color: white;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Category color classes */
.category-street {
  background: linear-gradient(135deg, #10b981, #059669);
}

.category-garage {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
}

.category-lot {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.category-valet {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.category-residential {
  background: linear-gradient(135deg, #64748b, #475569);
}

.category-default {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
}

.parking-rates {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 400;
  margin-bottom: 0.25rem;
}

.rate-icon {
  width: 18px;
  height: 18px;
  color: #64748b;
  flex-shrink: 0;
}

.parking-description {
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0.25rem 0 0 0;
  padding-top: 0.375rem;
  border-top: 1px solid #e2e8f0;
}

.other-info {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
}

.info-icon {
  width: 18px;
  height: 18px;
  color: #6366f1;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.other-info-text {
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0;
}

.no-results,
.initial-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
}

.no-results p {
  color: #64748b;
  font-size: 0.875rem;
}

.load-button {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.875rem 1.75rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.load-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

.load-button:active {
  transform: translateY(-1px);
}

/* Tablet and mobile devices */
@media (max-width: 768px) {
  .parking-title {
    font-size: 1.25rem;
  }

  .parking-card {
    padding: 0.5rem;
  }

  .parking-title-row {
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .title-left {
    gap: 0.25rem;
  }

  .title-right {
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .parking-name {
    font-size: 1rem;
  }

  .location-icon {
    width: 16px;
    height: 16px;
  }

  .parking-hours {
    padding: 0.25rem 0;
    font-size: 0.8125rem;
    margin-bottom: 0.25rem;
  }

  .hours-icon {
    width: 16px;
    height: 16px;
  }

  .parking-category {
    font-size: 0.7rem;
    padding: 0.2rem 0.6rem;
  }

  .parking-rates {
    padding: 0.25rem 0;
    font-size: 0.8125rem;
    margin-bottom: 0.25rem;
  }

  .rate-icon {
    width: 16px;
    height: 16px;
  }
}

/* Small mobile devices */
@media (max-width: 480px) {
  .parking-header {
    margin-bottom: 1rem;
  }

  .parking-title {
    font-size: 1.125rem;
  }

  .parking-card {
    padding: 0.5rem;
  }

  .parking-title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .title-left {
    width: 100%;
  }

  .title-right {
    width: 100%;
    justify-content: flex-start;
  }

  .parking-name {
    font-size: 0.9375rem;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
  }

  .parking-hours {
    font-size: 0.75rem;
    padding: 0.1875rem 0;
    margin-bottom: 0.25rem;
  }

  .parking-category {
    font-size: 0.6875rem;
    padding: 0.1875rem 0.5rem;
  }

  .parking-rates {
    font-size: 0.75rem;
    padding: 0.1875rem 0;
    margin-bottom: 0.25rem;
  }

  .parking-description {
    font-size: 0.8125rem;
    margin-top: 0.25rem;
    padding-top: 0.25rem;
  }

  .other-info-text {
    font-size: 0.8125rem;
  }

  .loading-state,
  .error-state,
  .no-results,
  .initial-state {
    padding: 2rem 1rem;
  }

  .load-button,
  .retry-button {
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
  }
}

/* Extra small mobile devices */
@media (max-width: 360px) {
  .parking-title {
    font-size: 1rem;
  }

  .parking-card {
    padding: 0.4375rem;
  }

  .parking-name {
    font-size: 0.875rem;
  }

  .parking-hours {
    font-size: 0.6875rem;
    padding: 0.1875rem 0;
    margin-bottom: 0.1875rem;
  }

  .parking-category {
    font-size: 0.625rem;
    padding: 0.125rem 0.375rem;
  }

  .parking-rates,
  .parking-description,
  .other-info-text {
    font-size: 0.75rem;
  }
}

.copy-html-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.875rem 1.75rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  margin-top: 1.5rem;
}

.copy-html-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

.copy-html-button:active {
  transform: translateY(-1px);
}

.copy-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
</style>

