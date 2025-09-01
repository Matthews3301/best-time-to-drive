<template>
  <div class="share-card">
    <div class="share-card-header">
      <h3>Route Guesser</h3>
    </div>

    <div class="share-card-body">
      <pre class="share-preview">{{ shareText }}</pre>

      <div class="actions">
        <button class="btn btn-x" @click="shareOnX">Share on X</button>
        <button class="btn" @click="copyShare">Copy</button>
      </div>

      <p v-if="copied" class="copied">Copied!</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  routeData: { type: Object, required: true },
  forecastData: { type: Array, required: true }
})

const copied = ref(false)

const available = computed(() => props.forecastData.filter(d => !d.isExcluded))
const minDuration = computed(() => available.value.length ? Math.min(...available.value.map(d => d.duration)) : Math.min(...props.forecastData.map(d => d.duration)))
const thresholds = computed(() => ({
  medium: minDuration.value * 1.2,
  heavy:  minDuration.value * 1.4
}))

const startState = computed(() => extractState(props.routeData.start))
const endState   = computed(() => extractState(props.routeData.end))
const stateLine  = computed(() => startState.value && endState.value ? (startState.value === endState.value ? startState.value : `${startState.value}→${endState.value}`) : '')
const distanceLine = computed(() => String(props.routeData.distance || '').trim())

function rangeSummary (startHour, endHour) {
  const points = props.forecastData.filter(p => {
    const hour = extractHour(p)
    return hour >= startHour && hour < endHour && !p.isExcluded
  })
  if (!points.length) return { emoji: '⬛', time: '—' }
  const worst = points.reduce((max, cur) => cur.duration > max.duration ? cur : max)
  const dur = worst.duration
  let emoji = '🔵'
  if (dur > thresholds.value.heavy) emoji = '🔴'
  else if (dur > thresholds.value.medium) emoji = '⚫'
  return { emoji, time: formatDurationShort(dur) }
}

const morning6to8     = computed(() => rangeSummary(6, 8))
const morning8to10    = computed(() => rangeSummary(8, 10))
const morning10to12   = computed(() => rangeSummary(10, 12))
const afternoon12to14 = computed(() => rangeSummary(12, 14))
const afternoon14to16 = computed(() => rangeSummary(14, 16))
const evening16to18   = computed(() => rangeSummary(16, 18))
const evening18to20   = computed(() => rangeSummary(18, 20))
const evening20to22   = computed(() => rangeSummary(20, 22))

const allIntervals = computed(() => [
  morning6to8.value,
  morning8to10.value,
  morning10to12.value,
  afternoon12to14.value,
  afternoon14to16.value,
  evening16to18.value,
  evening18to20.value,
  evening20to22.value
])

const minTime = computed(() => {
  const validIntervals = allIntervals.value.filter(interval => interval.time !== '—')
  if (!validIntervals.length) return null
  return Math.min(...validIntervals.map(interval => {
    const timeStr = interval.time
    if (timeStr.includes('h')) {
      const [h, m] = timeStr.split('h')
      return parseInt(h) * 60 + (m ? parseInt(m.replace('m', '')) : 0)
    }
    return parseInt(timeStr.replace('m', ''))
  }))
})

const shareText = computed(() => {
  const state = stateLine.value ? `${stateLine.value}` : ''
  const distance = distanceLine.value ? `${distanceLine.value}` : ''
  
  const formatInterval = (interval) => {
    if (interval.time === '—') return interval.emoji
    const timeStr = interval.time
    let timeInMinutes
    if (timeStr.includes('h')) {
      const [h, m] = timeStr.split('h')
      timeInMinutes = parseInt(h) * 60 + (m ? parseInt(m.replace('m', '')) : 0)
    } else {
      timeInMinutes = parseInt(timeStr.replace('m', ''))
    }
    
    if (minTime.value && timeInMinutes === minTime.value) {
      return '🔵'
    }
    return interval.emoji
  }
  
  const lines = [
    'Guess the Route from Distance and Traffic',
    '\n',
    state,
    distance,
    '\n',
    `6–8AM: ${formatInterval(morning6to8.value)} ${morning6to8.value.time}`,
    `8–10AM: ${formatInterval(morning8to10.value)} ${morning8to10.value.time}`,
    `10AM–12PM: ${formatInterval(morning10to12.value)} ${morning10to12.value.time}`,
    `12–2PM: ${formatInterval(afternoon12to14.value)} ${afternoon12to14.value.time}`,
    `2–4PM: ${formatInterval(afternoon14to16.value)} ${afternoon14to16.value.time}`,
    `4–6PM: ${formatInterval(evening16to18.value)} ${evening16to18.value.time}`,
    `6–8PM: ${formatInterval(evening18to20.value)} ${evening18to20.value.time}`,
    `8–10PM: ${formatInterval(evening20to22.value)} ${evening20to22.value.time}`,
    '\n',
    '#RushHourPlanner'
  ].filter(Boolean)
  return lines.join('\n')
})

function extractHour (dataPoint) {
  if (dataPoint.time) return new Date(dataPoint.time).getHours()
  const label = dataPoint.label || ''
  const [h] = label.split(':')
  return parseInt(h, 10)
}

function formatDurationShort (minutes) {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }
  return `${minutes}m`
}

function extractState (str) {
  if (!str) return ''
  const parts = String(str).split(',').map(s => s.trim())
  const code = parts.find(p => /^[A-Z]{2}$/.test(p))
  if (code) return code
  return parts.length >= 2 ? parts[parts.length - 2] : ''
}

function copyShare () {
  navigator.clipboard?.writeText(shareText.value)
    .then(() => { copied.value = true; setTimeout(() => copied.value = false, 1500) })
}

function shareOnX () {
  const base = 'https://twitter.com/intent/tweet'
  const text = encodeURIComponent(shareText.value)
  const url  = `${base}?text=${text}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.share-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  padding: 1rem;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.share-card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  width: 100%;
}

.share-card-header h4 {
  margin: 0;
  font-size: 1rem;
  color: #1f2937;
  font-weight: 600;
}

.share-preview {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 0.75rem;
  white-space: pre-wrap;
  margin: 0 0 0.5rem 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.9rem;
  color: #0f172a;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  justify-content: center;
}

.btn {
  background: #ffffff;
  color: #1f2937;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn:hover { border-color: #cbd5e1; }

.btn-x {
  background: #000000;
  color: #ffffff;
  border-color: #000000;
}

.copied {
  font-size: 0.8rem;
  color: #16a34a;
  margin: 0;
}

@media (max-width: 480px) {
  .share-preview { font-size: 0.85rem; }
}
</style>

