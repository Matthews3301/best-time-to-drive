<template>
  <div class="map-container">
    <!-- Snackbar for error messages -->
    <SnackbarComponent
      :show="showSnackbar"
      :type="snackbarType"
      :title="snackbarTitle"
      :message="snackbarMessage"
      :duration="10000"
      @dismiss="hideSnackbar"
    />
    
    <div class="map-section">
      <div class="map-controls">
        <div class="route-inputs">
          <div class="input-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label for="start-location-input">From:</label>
              <button 
                class="current-location-btn"
                :class="{ 'hidden': currentLocationUsed || startLocation }"
                @click="useCurrentLocation('start')"
                type="button"
              >
                Current Location
              </button>
            </div>
            <div class="autocomplete-wrapper">
              <input 
                id="start-location-input"
                ref="startInput"
                v-model="startLocation" 
                type="text" 
                placeholder="Enter starting location"
                @input="onStartLocationChange"
                @keydown.enter="handleEnterKey"
                @blur="handleStartInputBlur"
                @focus="handleStartInputFocus"
              />
              <button
                v-if="startLocation"
                type="button"
                class="clear-input-btn"
                @click="clearStartLocation"
                title="Clear input"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div v-if="showStartPredictions && startPredictions.length > 0" class="autocomplete-dropdown">
                <div 
                  v-for="prediction in startPredictions" 
                  :key="prediction.place_id"
                  class="autocomplete-item"
                  @click="selectStartPrediction(prediction)"
                >
                  <div class="prediction-main">{{ prediction.structured_formatting.main_text }}</div>
                  <div class="prediction-secondary">{{ prediction.structured_formatting.secondary_text }}</div>
                </div>
              </div>
            </div>
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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label for="end-location-input">To:</label>
              <button 
                class="current-location-btn"
                :class="{ 'hidden': true }"
                @click="useCurrentLocation('end')"
                type="button"
              >
                Current Location
              </button>
            </div>
            <div class="autocomplete-wrapper">
              <input 
                id="end-location-input"
                ref="endInput"
                v-model="endLocation" 
                type="text" 
                placeholder="Enter destination"
                @input="onEndLocationChange"
                @keydown.enter="handleEnterKey"
                @blur="handleEndInputBlur"
                @focus="handleEndInputFocus"
              />
              <button
                v-if="endLocation"
                type="button"
                class="clear-input-btn"
                @click="clearEndLocation"
                title="Clear input"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div v-if="showEndPredictions && endPredictions.length > 0" class="autocomplete-dropdown">
                <div 
                  v-for="prediction in endPredictions" 
                  :key="prediction.place_id"
                  class="autocomplete-item"
                  @click="selectEndPrediction(prediction)"
                >
                  <div class="prediction-main">{{ prediction.structured_formatting.main_text }}</div>
                  <div class="prediction-secondary">{{ prediction.structured_formatting.secondary_text }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div style="text-align: center;">
          <div class="filter-controls">
            <div class="departure-select-group">
              <label for="departure-time-select" class="departure-label">Depart on:</label>
              <select 
                id="departure-time-select"
                v-model="selectedDepartureTime"
                class="departure-select"
              >
                <option 
                  v-for="option in departureTimeOptions" 
                  :key="option" 
                  :value="option"
                >
                  {{ option }}
                </option>
              </select>
            </div>

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
          <button 
            v-else-if="currentRoute"
            class="show-results-btn"
            type="button"
            @click="scrollToResults"
          >
            Show Results
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"
              style="display: inline-block; vertical-align: middle; margin-left: 4px;"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
          </button>
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
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import SnackbarComponent from './SnackbarComponent.vue'
import tzlookup from 'tz-lookup';

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
  'exclude-night-hours-changed',
  'departure-date-changed'
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
const startAutocompleteActive = ref(false)
const endAutocompleteActive = ref(false)
const trafficLayer        = ref(null)
const mapLoaded           = ref(false)
const loadingError        = ref(null)
const isCalculating       = ref(false)
const currentRoute        = ref(null)
const googleMapsLoaded    = ref(false)
const excludeNightHours   = ref(true)
const selectedDepartureTime = ref('Now')
const currentLocationUsed = ref(false)

// API optimization state
const routeCache = ref(new Map())
const autocompleteService = ref(null)
const placesService = ref(null)
let calculateRouteTimeout = null
let currentCalculationKey = null

// Autocomplete debouncing state
let startAutocompleteTimeout = null
let endAutocompleteTimeout = null
const startPredictions = ref([])
const endPredictions = ref([])
const showStartPredictions = ref(false)
const showEndPredictions = ref(false)
const AUTOCOMPLETE_DEBOUNCE_MS = 400

// Snackbar state
const showSnackbar = ref(false)
const snackbarType = ref('error')
const snackbarTitle = ref('')
const snackbarMessage = ref('')

// Derive actual Date from selectedDepartureTime label
const selectedDepartureDate = computed(() => {
  return getDateForOption(selectedDepartureTime.value)
})

/* ------------------------------------------------------------------
 * Computed helpers
 * ----------------------------------------------------------------*/
const canCalculateRoute = computed(() =>
  startLocation.value.trim() && endLocation.value.trim() && mapLoaded.value
)

const departureTimeOptions = computed(() => {
  const options = ['Now']
  const today = new Date()
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  
  // Add 7 more options starting from tomorrow
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dayName = dayNames[date.getDay()]
    
    if (i === 1) {
      options.push('Tomorrow')
    } else {
      // Check if this day is in the next week
      const currentWeek = getWeekNumber(today)
      const targetWeek = getWeekNumber(date)
      
      if (targetWeek > currentWeek) {
        options.push(`Next ${dayName}`)
      } else {
        options.push(dayName)
      }
    }
  }
  
  return options
})

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

// Map a dropdown option label to an actual Date (local) or null for "Now"
function getDateForOption(option) {
  if (!option || option === 'Now') return null
  const today = new Date()
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  if (option === 'Tomorrow') {
    const d = new Date(base)
    d.setDate(d.getDate() + 1)
    return d
  }

  let targetLabel = option
  let isNext = false
  if (option.startsWith('Next ')) {
    targetLabel = option.replace('Next ', '')
    isNext = true
  }

  const targetIndex = dayNames.indexOf(targetLabel)
  if (targetIndex === -1) return null

  const todayIndex = base.getDay()
  let daysUntil = (targetIndex - todayIndex + 7) % 7
  if (daysUntil === 0) daysUntil = 7
  let daysToAdd = daysUntil
  if (isNext) {
    daysToAdd += 7
  }

  const d = new Date(base)
  d.setDate(d.getDate() + daysToAdd)
  return d
}

function formatDateParam(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getLabelForDate(date) {
  const today = new Date()
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const diffDays = Math.round((target - base) / 86400000)
  if (diffDays <= 0) return 'Now'
  if (diffDays === 1) return 'Tomorrow'

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const currentWeek = getWeekNumber(base)
  const targetWeek = getWeekNumber(target)
  const dayName = dayNames[target.getDay()]
  if (targetWeek > currentWeek) {
    return `Next ${dayName}`
  }
  return dayName
}

// Convert dropdown label to canonical URL token
function labelToParam(option) {
  if (!option || option === 'Now') return null
  const lower = option.toLowerCase()
  if (lower === 'tomorrow') return 'tomorrow'
  if (lower.startsWith('next ')) return `next-${lower.replace('next ', '')}`
  return lower // monday, tuesday, ...
}

// Convert URL token back to dropdown label
function paramToLabel(token) {
  if (!token) return 'Now'
  const date = getDateForParam(token)
  if (!date) return 'Now'
  return getLabelForDate(date)
}

// Convert URL token to an actual Date (local)
function getDateForParam(token) {
  if (!token) return null
  const lower = token.toLowerCase()
  const today = new Date()
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

  if (lower === 'tomorrow') {
    const d = new Date(base)
    d.setDate(d.getDate() + 1)
    return d
  }

  let isNext = false
  let dayToken = lower
  if (lower.startsWith('next-')) {
    isNext = true
    dayToken = lower.replace('next-', '')
  }

  const targetIndex = dayNames.indexOf(dayToken)
  if (targetIndex === -1) return null

  const todayIndex = base.getDay()
  let daysUntil = (targetIndex - todayIndex + 7) % 7
  if (daysUntil === 0) daysUntil = 7
  let daysToAdd = daysUntil
  if (isNext) daysToAdd += 7

  const d = new Date(base)
  d.setDate(d.getDate() + daysToAdd)
  return d
}

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

    // Initialize traffic layer
    trafficLayer.value = new google.maps.TrafficLayer()
    
    // Initialize shared API service instances
    autocompleteService.value = new google.maps.places.AutocompleteService()
    placesService.value = new google.maps.places.PlacesService(map.value)
    
    setupAutocomplete()

    directionsRenderer.value.addListener('directions_changed', () => {
      const directions = directionsRenderer.value.getDirections()
      updateRouteFromDirections(directions)
    })

    mapLoaded.value  = true
    loadingError.value = null

    nextTick(() => startInput.value?.focus())
    
    // Set initial traffic layer state
    toggleTrafficLayer()
  } catch (error) {
    console.error('Error setting up Google Maps:', error)
    loadingError.value = `Error setting up Google Maps: ${error.message}`
  }
}

function setupAutocomplete () {
  if (!window.google || !window.google.maps) return

  try {
    // Note: Using custom debounced autocomplete instead of built-in Autocomplete widget
    // The input handlers will trigger the debounced autocomplete
  } catch (error) {
    console.error('Error setting up autocomplete:', error)
  }
}

/* ------------------------------------------------------------------
| * Debounced Autocomplete helpers
| * ----------------------------------------------------------------*/
function debouncedStartAutocomplete() {
  if (startAutocompleteTimeout) {
    clearTimeout(startAutocompleteTimeout)
  }
  
  const inputValue = startLocation.value.trim()
  
  if (!inputValue) {
    startPredictions.value = []
    showStartPredictions.value = false
    return
  }
  
  startAutocompleteTimeout = setTimeout(() => {
    fetchStartPredictions(inputValue)
  }, AUTOCOMPLETE_DEBOUNCE_MS)
}

function fetchStartPredictions(input) {
  if (!autocompleteService.value) return
  
  const request = {
    input,
    componentRestrictions: { country: ['us', 'gb', 'ca'] }
  }
  
  autocompleteService.value.getPlacePredictions(request, (predictions, status) => {
    if (status === 'OK' && predictions) {
      startPredictions.value = predictions
      showStartPredictions.value = true
      startAutocompleteActive.value = true
    } else {
      startPredictions.value = []
      showStartPredictions.value = false
    }
  })
}

function debouncedEndAutocomplete() {
  if (endAutocompleteTimeout) {
    clearTimeout(endAutocompleteTimeout)
  }
  
  const inputValue = endLocation.value.trim()
  
  if (!inputValue) {
    endPredictions.value = []
    showEndPredictions.value = false
    return
  }
  
  endAutocompleteTimeout = setTimeout(() => {
    fetchEndPredictions(inputValue)
  }, AUTOCOMPLETE_DEBOUNCE_MS)
}

function fetchEndPredictions(input) {
  if (!autocompleteService.value) return
  
  const request = {
    input,
    componentRestrictions: { country: ['us', 'gb', 'ca'] }
  }
  
  autocompleteService.value.getPlacePredictions(request, (predictions, status) => {
    if (status === 'OK' && predictions) {
      endPredictions.value = predictions
      showEndPredictions.value = true
      endAutocompleteActive.value = true
    } else {
      endPredictions.value = []
      showEndPredictions.value = false
    }
  })
}

function selectStartPrediction(prediction) {
  if (!placesService.value) return
  
  placesService.value.getDetails({ placeId: prediction.place_id }, (place, status) => {
    if (status === 'OK' && place.formatted_address) {
      startLocation.value = place.formatted_address
      startPredictions.value = []
      showStartPredictions.value = false
      startAutocompleteActive.value = false
      updateURLWithLocations()
      if (canCalculateRoute.value) calculateRoute()
      if (!endLocation.value) {
        nextTick(() => endInput.value?.focus())
      }
    }
  })
}

function selectEndPrediction(prediction) {
  if (!placesService.value) return
  
  placesService.value.getDetails({ placeId: prediction.place_id }, (place, status) => {
    if (status === 'OK' && place.formatted_address) {
      endLocation.value = place.formatted_address
      endPredictions.value = []
      showEndPredictions.value = false
      endAutocompleteActive.value = false
      updateURLWithLocations()
      if (canCalculateRoute.value) calculateRoute()
    }
  })
}

function useCurrentLocation(target) {
  if (!navigator.geolocation) {
    showErrorSnackbar('Geolocation not supported', 'Your browser does not support geolocation.')
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const pos = { lat: position.coords.latitude, lng: position.coords.longitude }
      map.value.setCenter(pos)
      map.value.setZoom(13)

      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ location: pos }, (results, status) => {
        if (status === 'OK' && results[0]) {
          if (target === 'start') {
            startLocation.value = results[0].formatted_address
          } else {
            endLocation.value = results[0].formatted_address
          }
          currentLocationUsed.value = true
          updateURLWithLocations()
          if (canCalculateRoute.value) calculateRoute()
        }
      })
    },
    (error) => {
      console.log('Geolocation permission denied or unavailable', error)
      showErrorSnackbar('Location access denied', 'Please allow location access to use this feature.')
    }
  )
}

/* ------------------------------------------------------------------
 * Snackbar helpers
 * ----------------------------------------------------------------*/
function showErrorSnackbar(title, message = '') {
  snackbarType.value = 'error'
  snackbarTitle.value = title
  snackbarMessage.value = message
  showSnackbar.value = true
}

function showWarningSnackbar(title, message = '') {
  snackbarType.value = 'warning'
  snackbarTitle.value = title
  snackbarMessage.value = message
  showSnackbar.value = true
}

function hideSnackbar() {
  showSnackbar.value = false
}

/* ------------------------------------------------------------------
 * Rate limiting helpers
 * ----------------------------------------------------------------*/
const ROUTE_LIMIT_KEY = 'route_calculation_limit'
const MAX_ROUTES_PER_DAY = 20

function getTodayDate() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

function getRateLimitData() {
  try {
    const data = localStorage.getItem(ROUTE_LIMIT_KEY)
    if (!data) return { count: 0, date: getTodayDate() }
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading rate limit data:', error)
    return { count: 0, date: getTodayDate() }
  }
}

function setRateLimitData(count, date) {
  try {
    localStorage.setItem(ROUTE_LIMIT_KEY, JSON.stringify({ count, date }))
  } catch (error) {
    console.error('Error saving rate limit data:', error)
  }
}

function checkAndIncrementRouteLimit() {
  const today = getTodayDate()
  const data = getRateLimitData()
  
  // Reset count if it's a new day
  if (data.date !== today) {
    data.count = 0
    data.date = today
  }
  
  // Check if limit exceeded
  if (data.count >= MAX_ROUTES_PER_DAY) {
    return false
  }
  
  // Increment count
  data.count++
  setRateLimitData(data.count, data.date)
  
  return true
}

/* ------------------------------------------------------------------
 * API Optimization helpers
 * ----------------------------------------------------------------*/
function getCacheKey(start, end) {
  return `${start.trim().toLowerCase()}|${end.trim().toLowerCase()}`
}

function getCachedRoute(start, end) {
  const key = getCacheKey(start, end)
  return routeCache.value.get(key)
}

function setCachedRoute(start, end, data) {
  const key = getCacheKey(start, end)
  routeCache.value.set(key, {
    data,
    timestamp: Date.now()
  })
  
  // Limit cache size to 50 entries
  if (routeCache.value.size > 50) {
    const firstKey = routeCache.value.keys().next().value
    routeCache.value.delete(firstKey)
  }
}

function isCacheValid(cacheEntry) {
  if (!cacheEntry) return false
  // Cache valid for 1 hour
  const MAX_CACHE_AGE = 60 * 60 * 1000
  return (Date.now() - cacheEntry.timestamp) < MAX_CACHE_AGE
}

/* ------------------------------------------------------------------
 * Routing logic
 * ----------------------------------------------------------------*/
function calculateRouteDebounced() {
  // Clear any pending calculation
  if (calculateRouteTimeout) {
    clearTimeout(calculateRouteTimeout)
  }
  
  // Debounce by 300ms
  calculateRouteTimeout = setTimeout(() => {
    calculateRoute()
  }, 300)
}

function calculateRoute () {
  if (!canCalculateRoute.value || isCalculating.value) return
  
  // Check cache first
  const cached = getCachedRoute(startLocation.value, endLocation.value)
  if (cached && isCacheValid(cached)) {
    console.log('Using cached route')
    directionsRenderer.value.setDirections(cached.data)
    return
  }
  
  // Create a unique key for this calculation
  const calculationKey = getCacheKey(startLocation.value, endLocation.value)
  
  // Prevent duplicate in-flight requests
  if (currentCalculationKey === calculationKey) {
    console.log('Route calculation already in progress')
    return
  }
  
  currentCalculationKey = calculationKey
  
  // Check rate limit before calculating
  if (!checkAndIncrementRouteLimit()) {
    currentCalculationKey = null
    const data = getRateLimitData()
    showWarningSnackbar(
      'Daily limit reached',
      `You've reached the maximum of ${MAX_ROUTES_PER_DAY} route calculations per day. Please try again tomorrow.`
    )
    return
  }
  
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
    currentCalculationKey = null
    
    if (status === 'OK') {
      // Cache the result
      setCachedRoute(startLocation.value, endLocation.value, result)
      directionsRenderer.value.setDirections(result)
    } else {
      console.error('Directions request failed due to ' + status)
      
      // Handle specific error cases
      if (status === 'MAX_ROUTE_LENGTH_EXCEEDED') {
        showErrorSnackbar(
          'Route too long',
          'The requested route is too long to calculate. Please try a shorter route or break it into segments.'
        )
      } else if (status === 'OVER_QUERY_LIMIT') {
        showErrorSnackbar(
          'Query limit exceeded',
          'The request exceeds the query limit. Please try again later.'
        )
      } else if (status === 'ZERO_RESULTS') {
        showErrorSnackbar(
          'No route found',
          'Could not find a route between these locations. Please check your addresses.'
        )
      } else if (status === 'NOT_FOUND') {
        showErrorSnackbar(
          'Location not found',
          'One or both locations could not be found. Please check your addresses.'
        )
      } else if (status === 'REQUEST_DENIED') {
        showErrorSnackbar(
          'Request denied',
          'The request was denied. Please check your API key and permissions.'
        )
      } else if (status === 'INVALID_REQUEST') {
        showErrorSnackbar(
          'Invalid request',
          'The request was invalid. Please check your input and try again.'
        )
      } else if (status === 'UNKNOWN_ERROR') {
        showErrorSnackbar(
          'Unknown error',
          'An unknown error occurred. Please try again later.'
        )
      } else {
        showErrorSnackbar(
          'Route calculation failed',
          'Could not calculate route. Please check your locations and try again.'
        )
      }
      
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
    steps: leg.steps,
    timezone: 'UTC' // default
  };

  // Fetch timezone
  routeData.timezone = tzlookup(routeData.coordinates.start.lat, routeData.coordinates.start.lng) || 'UTC';
  currentRoute.value = routeData;
  emit('route-selected', routeData);
}

function scrollToResults () {
  const forecast = document.getElementById('forecast-chart')
  const results = document.getElementById('results-card')
  const target = forecast || results
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function toggleTrafficLayer() {
  if (!trafficLayer.value || !map.value) return
  
  if (selectedDepartureTime.value === 'Now') {
    trafficLayer.value.setMap(map.value)
  } else {
    trafficLayer.value.setMap(null)
  }
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

  // Persist departure selection as weekday token if not Now
  const departToken = labelToParam(selectedDepartureTime.value)
  if (departToken) params.set('depart', departToken)
  else params.delete('depart')

  const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`
  window.history.replaceState({}, '', newURL)
}

function loadLocationsFromURL () {
  const params       = new URLSearchParams(window.location.search)
  const fromParam    = params.get('from')
  const toParam      = params.get('to')
  const excludeParam = params.get('exclude')
  const departParam  = params.get('depart')

  if (fromParam) startLocation.value = decodeURIComponent(fromParam)
  if (toParam)   endLocation.value   = decodeURIComponent(toParam)

  if (excludeParam !== null) {
    excludeNightHours.value = excludeParam === 'true'
    emit('exclude-night-hours-changed', excludeNightHours.value)
  }

  if (departParam) {
    selectedDepartureTime.value = paramToLabel(departParam)
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
function onStartLocationChange () { 
  updateURLWithLocations()
  debouncedStartAutocomplete()
}
function onEndLocationChange () { 
  updateURLWithLocations()
  debouncedEndAutocomplete()
}
function onExcludeNightHoursChange () {
  emit('exclude-night-hours-changed', excludeNightHours.value)
  updateURLWithLocations()
}

function handleStartInputBlur() {
  setTimeout(() => {
    showStartPredictions.value = false
  }, 200)
}

function handleStartInputFocus() {
  if (startLocation.value.trim()) {
    debouncedStartAutocomplete()
  }
}

function handleEndInputBlur() {
  setTimeout(() => {
    showEndPredictions.value = false
  }, 200)
}

function handleEndInputFocus() {
  if (endLocation.value.trim()) {
    debouncedEndAutocomplete()
  }
}

// React to departure selection changes
watch(selectedDepartureTime, () => {
  emit('departure-date-changed', selectedDepartureDate.value)
  updateURLWithLocations()
  toggleTrafficLayer()
})
function handleEnterKey (event) {
  const target = event.target
  
  // Check if we're in the start input and have predictions
  if (target === startInput.value && startPredictions.value.length > 0) {
    event.preventDefault()
    selectStartPrediction(startPredictions.value[0])
    return
  }
  
  // Check if we're in the end input and have predictions
  if (target === endInput.value && endPredictions.value.length > 0) {
    event.preventDefault()
    selectEndPrediction(endPredictions.value[0])
    return
  }
  
  // If no autocomplete suggestions are available, proceed with normal route calculation
  if (canCalculateRoute.value) {
    nextTick(() => calculateRoute())
  }
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

function clearStartLocation() {
  startLocation.value = ''
  startPredictions.value = []
  showStartPredictions.value = false
  currentLocationUsed.value = false
  updateURLWithLocations()
  nextTick(() => startInput.value?.focus())
}

function clearEndLocation() {
  endLocation.value = ''
  endPredictions.value = []
  showEndPredictions.value = false
  updateURLWithLocations()
  nextTick(() => endInput.value?.focus())
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
  emit('departure-date-changed', selectedDepartureDate.value)
})

onBeforeUnmount(() => {
  // Clear any pending route calculations
  if (calculateRouteTimeout) {
    clearTimeout(calculateRouteTimeout)
  }
  
  // Clear autocomplete debounce timeouts
  if (startAutocompleteTimeout) {
    clearTimeout(startAutocompleteTimeout)
  }
  if (endAutocompleteTimeout) {
    clearTimeout(endAutocompleteTimeout)
  }
  
  if (directionsRenderer.value) {
    google.maps.event.clearInstanceListeners(directionsRenderer.value)
  }
  
  // Clear cache to free memory
  routeCache.value.clear()
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
  color: #0f172a;
  font-size: 1.5rem;
  font-weight: 600;
}

.map-header p {
  margin: 0;
  color: #64748b;
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
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
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
  position: relative;
}

.input-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  letter-spacing: -0.01em;
}

.input-group input {
  padding: 1.25rem 3rem 1.25rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem; /* 16px */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  color: #0f172a;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.input-group input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 
    0 0 0 3px rgba(99, 102, 241, 0.12),
    0 1px 2px rgba(15, 23, 42, 0.08);
  background: #ffffff;
}

.input-group input::placeholder {
  color: #9ca3af;
}

.autocomplete-wrapper {
  position: relative;
  width: 100%;
}

.clear-input-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  z-index: 10;
}

.clear-input-btn svg {
  width: 1.125rem;
  height: 1.125rem;
}

.clear-input-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
}

.clear-input-btn:active {
  background: rgba(0, 0, 0, 0.1);
  color: #374151;
}

.current-location-btn {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 0.775rem;
  font-weight: 500;
  cursor: pointer;
  text-align: right;
  transition: color 0.2s ease, opacity 0.2s ease;
  opacity: 1;
  visibility: visible;
  display: block;
}

.current-location-btn:hover {
  color: #4f46e5;
}

.current-location-btn:active {
  color: #4338ca;
}

.current-location-btn.hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-top: 0;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 
    0 10px 24px rgba(15, 23, 42, 0.08),
    0 2px 6px rgba(15, 23, 42, 0.05);
  z-index: 1000;
}

.autocomplete-item {
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.autocomplete-item:hover {
  background-color: rgba(99, 102, 241, 0.06);
}

.prediction-main {
  font-size: 0.95rem;
  font-weight: 500;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.prediction-secondary {
  font-size: 0.8rem;
  color: #6b7280;
}

.swap-button-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 0.5rem; /* Align with input bottom */
}

.swap-button {
  background: transparent;
  border: 2px solid #e2e8f0;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #64748b;
  position: relative;
  overflow: hidden;
}

.swap-button:hover {
  background: #eef2ff;
  border-color: rgba(99, 102, 241, 0.35);
  color: #6366f1;
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.16);
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
  background: linear-gradient(135deg, #6366f1 0%, #5b21b6 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 6px 16px rgba(99, 102, 241, 0.22),
    0 2px 6px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
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
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  box-shadow: 
    0 10px 24px rgba(99, 102, 241, 0.28),
    0 4px 10px rgba(15, 23, 42, 0.12);
}

.calculate-btn:hover:not(:disabled)::before {
  left: 100%;
}

.calculate-btn:active:not(:disabled) {
  box-shadow: 
    0 6px 16px rgba(99, 102, 241, 0.2),
    0 2px 6px rgba(15, 23, 42, 0.1);
}

.calculate-btn:disabled {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  color: #9ca3af;
  cursor: not-allowed;
  box-shadow: 
    0 1px 2px rgba(15, 23, 42, 0.06);
  transform: none;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.calculate-btn:disabled::before {
  display: none;
}

.filter-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
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
  border: 2px solid #cbd5e1;
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

.departure-select-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

.departure-label {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  user-select: none;
}

.departure-select {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 0.9rem;
  background: #f3f4f6;
  color: #1a1d29;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  min-width: 140px;
}

.departure-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 
    0 0 0 3px rgba(99, 102, 241, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.1);
  background: #ffffff;
}

.departure-select:hover {
  border-color: rgba(99, 102, 241, 0.3);
  background: #ffffff;
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
  background: #e5e7eb;
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
  background: #f3f4f6;
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
    gap: 0;
    margin: 0;
    width: 100%;
  }
  
  .swap-button-container {
    padding-bottom: 0;
    padding-top: 1rem;
    margin-bottom: -0.5rem;
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
    padding: 1rem 2.75rem 1rem 0.75rem;
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
  
  .departure-label {
    font-size: 0.8rem;
  }
  
  .departure-select {
    padding: 0.625rem 0.75rem;
    font-size: 0.85rem;
    min-width: 120px;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .map-controls {
    padding: 1.4rem 0.75rem 0.75rem 0.75rem;
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
    padding: 0.875rem 2.5rem 0.875rem 0.625rem;
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
  min-height: 2.5rem;
  height: 2.5rem; /* Ensure room for button */
}

.show-results-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.18);
}

.show-results-btn:hover {
  background: linear-gradient(135deg, #5b21b6 0%, #6366f1 100%);
  transform: translateY(-1px);
}

.show-results-btn:active {
  transform: translateY(0);
}

/* Very small screens - portrait phones */
@media (max-width: 320px) {
  .input-group input {
    padding: 0.75rem 2.25rem 0.75rem 0.5rem;
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
  
  .departure-label {
    font-size: 0.75rem;
  }
  
  .departure-select {
    padding: 0.5rem 0.625rem;
    font-size: 0.8rem;
    min-width: 100px;
  }
}
</style> 