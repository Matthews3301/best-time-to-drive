<template>
  <div>
    <div class="share-card-header">
      <h3>Share your Route</h3>
    </div>

    <div class="share-card-body">
      <pre class="share-preview">{{ shareText }}</pre>

      <div class="actions">
        <button class="btn btn-x" @click="shareOnX">Share on X</button>
        <button class="btn" @click="copyShare">{{ copied ? 'Copied!' : 'Copy' }}</button>
      </div>
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
const maxDuration = computed(() => available.value.length ? Math.max(...available.value.map(d => d.duration)) : Math.max(...props.forecastData.map(d => d.duration)))

const startState = computed(() => extractState(props.routeData.start))
const endState   = computed(() => extractState(props.routeData.end))
const stateLine  = computed(() => startState.value && endState.value ? (startState.value === endState.value ? startState.value : `${startState.value}→${endState.value}`) : '')
const distanceLine = computed(() => String(props.routeData.distance || '').trim())

// Find best and worst times
const bestTimeSlot = computed(() => {
  const best = available.value.reduce((min, cur) => cur.duration < min.duration ? cur : min)
  return {
    time: formatTime(best.time || best.label),
    duration: formatDurationShort(best.duration)
  }
})

const worstTimeSlot = computed(() => {
  const worst = available.value.reduce((max, cur) => cur.duration > max.duration ? cur : max)
  return {
    time: formatTime(worst.time || worst.label),
    duration: formatDurationShort(worst.duration)
  }
})

const timeSaved = computed(() => {
  const worstDuration = available.value.reduce((max, cur) => cur.duration > max.duration ? cur : max).duration
  const bestDuration = available.value.reduce((min, cur) => cur.duration < min.duration ? cur : min).duration
  const saved = worstDuration - bestDuration
  return formatDurationShort(saved)
})

// Generate random challenge questions
const challengeQuestions = [
  "What's your worst traffic story?",
  "How early would you wake up to avoid traffic?",
  "What's your secret traffic-avoiding route?",
  "Would you rather leave 2 hours early or sit in traffic?",
  "What's your traffic playlist?",
  "How do you stay sane in traffic?",
  "What's your traffic survival snack?",
  "Would you pay $50 to skip traffic?",
  "What's your traffic pet peeve?",
  "How do you pass time in traffic?"
]

const challengeQuestion = computed(() => {
  const randomIndex = Math.floor(Math.random() * challengeQuestions.length)
  return challengeQuestions[randomIndex]
})

const shareText = computed(() => {
  const routeDisplay = `${props.routeData.start} → ${props.routeData.end} (${props.routeData.distance})`
  
  const lines = [
    '📍 Route: ' + routeDisplay,
    '',
    'What\'s the best time to avoid traffic on this route?',
    '',
    '✅ DO: Leave at ' + bestTimeSlot.value.time + ' (' + bestTimeSlot.value.duration + ')',
    '❌ DON\'T: Leave at ' + worstTimeSlot.value.time + ' (' + worstTimeSlot.value.duration + ')',
    '',
    'Time saved: ' + timeSaved.value + ' (Rush Hour Planner)',
    '',
    '🎯 Challenge: how else to optimize this journey?',
  ]
  return lines.join('\n')
})

function formatTime(timeStr) {
  if (!timeStr) return 'Unknown'
  if (timeStr.includes('T')) {
    const date = new Date(timeStr)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }
  return timeStr
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

.share-card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  width: 100%;
}

.share-card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1f2937;
  font-weight: 600;
}

.share-preview {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 0.75rem;
  white-space: pre-wrap;
  margin: 0 auto 0.5rem auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.9rem;
  color: #0f172a;
  width: fit-content;
  max-width: 100%;
  box-sizing: border-box;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
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
  transition: all 0.2s ease;
  min-width: 5.5rem;
}

.btn:hover { 
  border-color: #cbd5e1; 
  transform: translateY(-1px);
}

.btn-x {
  background: #000000;
  color: #ffffff;
  border-color: #000000;
}

.btn-x:hover {
  background: #1a1a1a;
}

.copied {
  font-size: 0.8rem;
  color: #16a34a;
  margin: 0;
}

.social-challenge {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  text-align: center;
  width: 100%;
}

.challenge-text {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.challenge-question {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.95;
  font-style: italic;
}

@media (max-width: 480px) {
  .share-card {
    padding: 0.75rem;
    margin: 0.75rem 0.5rem 0 0.5rem;
    width: calc(100% - 1rem);
    max-width: calc(100vw - 1rem);
  }
  .share-preview { 
    font-size: 0.85rem; 
    padding: 0.5rem;
  }
  .social-challenge { padding: 0.5rem; }
}
</style>

