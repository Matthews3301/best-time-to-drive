<template>
  <div class="map-container">
    <div class="map-section">
      <div class="map-controls">
        <div class="route-inputs">
          <div class="input-group">
            <label>From:</label>
            <input 
              ref="startInput"
              v-model="startLocation" 
              type="text" 
              placeholder="Enter starting location"
              @input="onStartLocationChange"
              @keydown.enter="handleEnterKey"
            />
          </div>
          <div class="swap-button-container">
            <button 
              class="swap-button"
              @click="swapLocations"
              type="button"
              title="Swap locations"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 16L3 12L7 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M17 8L21 12L17 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="input-group">
            <label>To:</label>
            <input 
              ref="endInput"
              v-model="endLocation" 
              type="text" 
              placeholder="Enter destination"
              @input="onEndLocationChange"
              @keydown.enter="handleEnterKey"
            />
          </div>
        </div>
        
        <div style="text-align: center;">
          <div class="filter-controls">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="excludeNightHours"
                  @change="onExcludeNightHoursChange"
                  class="checkbox-input"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">Exclude 11pm-6am</span>
              </label>
            </div>
          </div>
        </div>

        <div class="calculating-message-container">
          <p v-if="isCalculating">Calculating...</p>
        </div>
      </div>
      
      <div class="map-container-inner">
        <div 
          ref="mapElement" 
          class="google-map"
          v-show="mapLoaded"
        ></div>
        <div v-if="!mapLoaded" class="map-loading">
          <div v-if="loadingError" class="error-message">
            <div class="error-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p>{{ loadingError }}</p>
            <div class="api-key-setup">
              <h4>Setup Instructions:</h4>
              <ol>
                <li>Get a Google Maps API key from <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
                <li>Enable Maps JavaScript API, Places API, Directions API, and Geocoding API</li>
                <li>Add your API key to the <code>.env</code> file:</li>
                <pre>VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here</pre>
                <li>Restart the development server</li>
              </ol>
            </div>
          </div>
          <div v-else class="loading-content">
            <div class="loading-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 13L12 17L8 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 17V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p>Loading Google Maps...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'

/* ------------------------------------------------------------------
 * Props & Emits
 * ----------------------------------------------------------------*/
const { selectedRoute } = defineProps({
  selectedRoute: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'route-selected',
  'route-selected-error',
  'exclude-night-hours-changed'
])

/* ------------------------------------------------------------------
 * Template element refs
 * ----------------------------------------------------------------*/
const startInput = ref(null)
const endInput = ref(null)
const mapElement = ref(null)

/* ------------------------------------------------------------------
 * Reactive state
 * ----------------------------------------------------------------*/
const startLocation = ref('')
const endLocation   = ref('')
const map                 = ref(null)
const directionsService   = ref(null)
const directionsRenderer  = ref(null)
const startAutocomplete   = ref(null)
const endAutocomplete     = ref(null)
const mapLoaded           = ref(false)
const loadingError        = ref(null)
const isCalculating       = ref(false)
const currentRoute        = ref(null)
const googleMapsLoaded    = ref(false)
const excludeNightHours   = ref(true)

/* ------------------------------------------------------------------
 * Computed helpers
 * ----------------------------------------------------------------*/
const canCalculateRoute = computed(() =>
  startLocation.value.trim() && endLocation.value.trim() && mapLoaded.value
)

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

/* ------------------------------------------------------------------
 * Google Maps initialisation
 * ----------------------------------------------------------------*/
function initializeGoogleMaps () {
  if (!apiKey || apiKey === 'PASTE_YOUR_GOOGLE_MAPS_API_KEY_HERE' || apiKey === 'your_google_maps_api_key_here') {
    loadingError.value = 'Google Maps API key not configured. Please check your .env file.'
    return
  }

  if (window.google && window.google.maps) {
    setupMap()
    return
  }

  loadGoogleMapsScript()
}

function loadGoogleMapsScript () {
  const script = document.createElement('script')
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initGoogleMaps`
  script.async = true
  script.defer = true

  window.initGoogleMaps = () => {
    googleMapsLoaded.value = true
    setupMap()
  }

  script.onerror = () => {
    loadingError.value = 'Failed to load Google Maps. Please check your API key and internet connection.'
  }

  document.head.appendChild(script)
}

function setupMap () {
  try {
    map.value = new google.maps.Map(mapElement.value, {
      zoom: 10,
      center: { lat: 37.7749, lng: -122.4194 }, // San Francisco default
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true
    })

    directionsService.value  = new google.maps.DirectionsService()
    directionsRenderer.value = new google.maps.DirectionsRenderer({ draggable: true })
    directionsRenderer.value.setMap(map.value)

    setupAutocomplete()

    directionsRenderer.value.addListener('directions_changed', () => {
      const directions = directionsRenderer.value.getDirections()
      updateRouteFromDirections(directions)
    })

    mapLoaded.value  = true
    loadingError.value = null

    nextTick(() => startInput.value?.focus())
    getCurrentLocation()
  } catch (error) {
    console.error('Error setting up Google Maps:', error)
    loadingError.value = `Error setting up Google Maps: ${error.message}`
  }
}

function setupAutocomplete () {
  if (!window.google || !window.google.maps) return

  try {
    // Start location autocomplete
    startAutocomplete.value = new google.maps.places.Autocomplete(startInput.value, { componentRestrictions: { country: ['us', 'gb'] } })
    startAutocomplete.value.addListener('place_changed', () => {
      const place = startAutocomplete.value.getPlace()
      if (place.formatted_address) {
        startLocation.value = place.formatted_address
        updateURLWithLocations()
        if (canCalculateRoute.value) calculateRoute()
      }
    })

    // End location autocomplete
    endAutocomplete.value = new google.maps.places.Autocomplete(endInput.value, { componentRestrictions: { country: ['us', 'gb'] } })
    endAutocomplete.value.addListener('place_changed', () => {
      const place = endAutocomplete.value.getPlace()
      if (place.formatted_address) {
        endLocation.value = place.formatted_address
        updateURLWithLocations()
        if (canCalculateRoute.value) calculateRoute()
      }
    })
  } catch (error) {
    console.error('Error setting up autocomplete:', error)
  }
}

function getCurrentLocation () {
  if (!navigator.geolocation) return

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const pos = { lat: position.coords.latitude, lng: position.coords.longitude }
      map.value.setCenter(pos)
      map.value.setZoom(13)

      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ location: pos }, (results, status) => {
        if (status === 'OK' && results[0] && !startLocation.value.trim()) {
          startLocation.value = results[0].formatted_address
          updateURLWithLocations()
        }
      })
    },
    () => console.log('Geolocation permission denied or unavailable')
  )
}

/* ------------------------------------------------------------------
 * Routing logic
 * ----------------------------------------------------------------*/
function calculateRoute () {
  if (!canCalculateRoute.value || isCalculating.value) return
  isCalculating.value = true

  const request = {
    origin: startLocation.value,
    destination: endLocation.value,
    travelMode: google.maps.TravelMode.DRIVING,
    avoidHighways: false,
    avoidTolls: false,
    provideRouteAlternatives: true,
    drivingOptions: {
      departureTime: new Date(),
      trafficModel: google.maps.TrafficModel.BEST_GUESS
    }
  }

  directionsService.value.route(request, (result, status) => {
    isCalculating.value = false
    if (status === 'OK') {
      directionsRenderer.value.setDirections(result)
    } else {
      console.error('Directions request failed due to ' + status)
      alert('Could not calculate route. Please check your locations.')
      emit('route-selected-error', status)
    }
  })
}

function updateRouteFromDirections (directions) {
  const route = directions.routes[0]
  const leg   = route.legs[0]

  const routeData = {
    start: leg.start_address,
    end:   leg.end_address,
    distance:    leg.distance.text,
    baseTime:    leg.duration.text,
    trafficTime: leg.duration_in_traffic ? leg.duration_in_traffic.text : null,
    coordinates: {
      start: { lat: leg.start_location.lat(), lng: leg.start_location.lng() },
      end:   { lat: leg.end_location.lat(),   lng: leg.end_location.lng()   }
    },
    polyline: route.overview_polyline,
    steps: leg.steps
  }

  currentRoute.value = routeData
  emit('route-selected', routeData)
}

/* ------------------------------------------------------------------
 * URL helpers
 * ----------------------------------------------------------------*/
function updateURLWithLocations () {
  const params = new URLSearchParams(window.location.search)

  if (startLocation.value.trim()) {
    params.set('from', startLocation.value)
  } else {
    params.delete('from')
  }

  if (endLocation.value.trim()) {
    params.set('to', endLocation.value)
  } else {
    params.delete('to')
  }

  if (excludeNightHours.value) {
    params.set('exclude', 'true')
  } else {
    params.delete('exclude')
  }

  const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`
  window.history.replaceState({}, '', newURL)
}

function loadLocationsFromURL () {
  const params       = new URLSearchParams(window.location.search)
  const fromParam    = params.get('from')
  const toParam      = params.get('to')
  const excludeParam = params.get('exclude')

  if (fromParam) startLocation.value = decodeURIComponent(fromParam)
  if (toParam)   endLocation.value   = decodeURIComponent(toParam)

  if (excludeParam !== null) {
    excludeNightHours.value = excludeParam === 'true'
    emit('exclude-night-hours-changed', excludeNightHours.value)
  }

  if (startLocation.value.trim() && endLocation.value.trim()) {
    nextTick(() => {
      const checkMapReady = () => {
        if (mapLoaded.value) {
          calculateRoute()
        } else {
          setTimeout(checkMapReady, 100)
        }
      }
      checkMapReady()
    })
  }
}

/* ------------------------------------------------------------------
 * Template event handlers
 * ----------------------------------------------------------------*/
function onStartLocationChange () { updateURLWithLocations() }
function onEndLocationChange   () { updateURLWithLocations() }
function onExcludeNightHoursChange () {
  emit('exclude-night-hours-changed', excludeNightHours.value)
  updateURLWithLocations()
}
function handleEnterKey () {
  nextTick(() => calculateRoute())
}

function swapLocations () {
  const temp = startLocation.value
  startLocation.value = endLocation.value
  endLocation.value = temp
  
  // Update URL with swapped locations
  updateURLWithLocations()
  
  // Recalculate route if both locations are filled
  if (canCalculateRoute.value) {
    nextTick(() => calculateRoute())
  }
}

/* ------------------------------------------------------------------
 * Public methods for external use
 * ----------------------------------------------------------------*/
function setRouteLocations(from, to) {
  console.log('setRouteLocations called with:', from, to);
  startLocation.value = from
  endLocation.value = to
  updateURLWithLocations()
  
  if (canCalculateRoute.value) {
    console.log('canCalculateRoute is true, calling calculateRoute');
    nextTick(() => calculateRoute())
  } else {
    console.log('canCalculateRoute is false:', {
      startLocation: startLocation.value,
      endLocation: endLocation.value,
      mapLoaded: mapLoaded.value
    });
  }
}

// Expose the method to parent components
defineExpose({
  setRouteLocations
})

/* ------------------------------------------------------------------
 * Lifecycle hooks
 * ----------------------------------------------------------------*/
onMounted(() => {
  initializeGoogleMaps()
  loadLocationsFromURL()
  emit('exclude-night-hours-changed', excludeNightHours.value)
})

onBeforeUnmount(() => {
  if (startAutocomplete.value) {
    google.maps.event.clearInstanceListeners(startAutocomplete.value)
  }
  if (endAutocomplete.value) {
    google.maps.event.clearInstanceListeners(endAutocomplete.value)
  }
  if (directionsRenderer.value) {
    google.maps.event.clearInstanceListeners(directionsRenderer.value)
  }
})
</script>

<style scoped>
.map-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 100vw;
  overflow: hidden;
}

.map-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.map-header h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.5rem;
  font-weight: 600;
}

.map-header p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.map-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 500px;
  width: 100%;
}

.map-controls {
  padding: 2rem;
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: grid;
  width: 100%;
  box-sizing: border-box;
}

.route-inputs {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: end;
  margin: 0 2rem;
  width: calc(100% - 4rem);
  box-sizing: border-box;
}

.input-group {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.input-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  letter-spacing: -0.01em;
}

.input-group input {
  padding: 1.25rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  font-size: 1rem; /* 16px */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fafbfc;
  color: #1a1d29;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.input-group input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 
    0 0 0 3px rgba(99, 102, 241, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.1);
  background: #ffffff;
}

.input-group input::placeholder {
  color: #9ca3af;
}

.swap-button-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 0.5rem; /* Align with input bottom */
}

.swap-button {
  background: transparent;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #6b7280;
  position: relative;
  overflow: hidden;
}

.swap-button:hover {
  background: rgba(99, 102, 241, 0.05);
  border-color: rgba(99, 102, 241, 0.3);
  color: #6366f1;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.swap-button:active {
  transform: scale(0.95);
  background: rgba(99, 102, 241, 0.1);
}

.swap-button svg {
  width: 1.25rem;
  height: 1.25rem;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.swap-button:hover svg {
  transform: rotate(180deg);
}

.calculate-btn {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 4px 12px rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  text-transform: none;
  letter-spacing: -0.01em;
  min-width: 12rem;
  justify-self: center;
}

.calculate-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.calculate-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5b21b6 0%, #6366f1 100%);
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.15),
    0 8px 24px rgba(99, 102, 241, 0.25),
    0 12px 40px rgba(99, 102, 241, 0.15);
}

.calculate-btn:hover:not(:disabled)::before {
  left: 100%;
}

.calculate-btn:active:not(:disabled) {
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 4px 12px rgba(99, 102, 241, 0.2);
}

.calculate-btn:disabled {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  color: #9ca3af;
  cursor: not-allowed;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05);
  transform: none;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.calculate-btn:disabled::before {
  display: none;
}

.filter-controls {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 1.125rem;
  height: 1.125rem;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  margin-right: 0.75rem;
  background: #ffffff;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.checkbox-custom::after {
  content: '';
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.checkbox-input:checked + .checkbox-custom {
  background-color: #6366f1;
  border-color: #6366f1;
}

.checkbox-input:checked + .checkbox-custom::after {
  opacity: 1;
}

.checkbox-label:hover .checkbox-custom {
  border-color: #9ca3af;
}

.checkbox-input:checked + .checkbox-custom:hover {
  background-color: #5b21b6;
  border-color: #5b21b6;
}

.checkbox-text {
  font-size: 1rem;
  color: #374151;
  font-weight: 500;
  user-select: none;
}



.map-container-inner {
  flex: 1;
  position: relative;
  min-height: 400px;
  width: 100%;
  overflow: hidden;
}

.google-map {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.map-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f3f4f6;
  color: #6b7280;
  padding: 2rem;
  width: 100%;
  box-sizing: border-box;
}

.error-message {
  text-align: center;
  color: #dc2626;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 100%;
  overflow-wrap: break-word;
}

.error-icon {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #fecaca, #fca5a5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc2626;
  flex-shrink: 0;
}

.error-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-icon {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  animation: pulse 2s infinite;
  flex-shrink: 0;
}

.loading-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.api-key-setup {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-top: 1rem;
  text-align: left;
  max-width: 500px;
  width: 100%;
  box-sizing: border-box;
}

.api-key-setup h4 {
  margin: 0 0 1rem 0;
  color: #333;
}

.api-key-setup ol {
  margin: 0;
  padding-left: 1.5rem;
}

.api-key-setup li {
  margin-bottom: 0.5rem;
  color: #374151;
}

.api-key-setup pre {
  background: #f3f4f6;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  margin: 0.5rem 0;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.api-key-setup code {
  background: #f3f4f6;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.8rem;
  word-break: break-all;
}

.api-key-setup a {
  color: #3b82f6;
  text-decoration: none;
  word-break: break-all;
}

.api-key-setup a:hover {
  text-decoration: underline;
}

.map-footer {
  padding: 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  width: 100%;
  box-sizing: border-box;
}

.route-summary h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
}

.summary-stats {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat .label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.stat .value {
  font-size: 1rem;
  color: #374151;
  font-weight: 600;
}

/* Mobile-specific styles */
@media (max-width: 768px) {
  .map-section {
    min-height: 300px;
  }
  
  .map-controls {
    padding: 1rem;
    gap: 1.5rem;
  }
  
  .route-inputs {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin: 0;
    width: 100%;
  }
  
  .swap-button-container {
    padding-bottom: 0;
    padding-top: 0.5rem;
    justify-self: center;
  }
  
  .swap-button {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .swap-button svg {
    width: 1rem;
    height: 1rem;
  }
  
  .input-group input {
    padding: 1rem 0.75rem;
    font-size: 0.9rem;
  }
  
  .calculate-btn {
    padding: 0.875rem 1.5rem;
    font-size: 0.9rem;
    min-width: 140px;
  }
  
  .map-container-inner {
    min-height: 250px;
  }
  
  .google-map {
    min-height: 250px;
  }
  
  .map-loading {
    padding: 1rem;
    min-height: 250px;
  }
  
  .api-key-setup {
    padding: 1rem;
    max-width: 100%;
  }
  
  .api-key-setup pre {
    font-size: 0.75rem;
  }
  
  .map-footer {
    padding: 1rem;
  }
  
  .summary-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .checkbox-text {
    font-size: 0.8rem;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .map-controls {
    padding: 0.75rem;
    gap: 1rem;
  }
  
  .map-section {
    min-height: 250px;
  }
  
  .map-container-inner {
    min-height: 200px;
  }
  
  .google-map {
    min-height: 200px;
  }
  
  .map-loading {
    min-height: 200px;
    padding: 0.75rem;
  }
  
  .input-group input {
    padding: 0.875rem 0.625rem;
    font-size: 0.85rem;
  }
  
  .calculate-btn {
    padding: 0.75rem 1.25rem;
    font-size: 0.85rem;
    min-width: 120px;
  }
  
  .error-icon,
  .loading-icon {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .error-icon svg,
  .loading-icon svg {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .api-key-setup {
    padding: 0.75rem;
  }
  
  .map-footer {
    padding: 0.75rem;
  }
  
  .route-summary h4 {
    font-size: 1rem;
  }
}

.calculating-message-container {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  min-height: 2rem;
  height: 2rem; /* Set fixed height */
}

/* Very small screens - portrait phones */
@media (max-width: 320px) {
  .input-group input {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }
  
  .calculate-btn {
    padding: 0.625rem 1rem;
    font-size: 0.8rem;
    min-width: 100px;
  }
  
  .checkbox-custom {
    width: 1rem;
    height: 1rem;
    margin-right: 0.5rem;
  }
  
  .checkbox-text {
    font-size: 0.75rem;
  }
}
</style> 