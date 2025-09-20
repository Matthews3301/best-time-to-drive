<template>
  <div v-if="show" class="snackbar" :class="snackbarClass">
    <div class="snackbar-content">
      <div class="snackbar-message">
        <p class="snackbar-title">{{ title }}</p>
        <p v-if="message" class="snackbar-text">{{ message }}</p>
      </div>
      <button v-if="dismissible" @click="dismiss" class="snackbar-close">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'success', 'error', 'warning'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 5000
  },
  dismissible: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['dismiss'])

const snackbarClass = computed(() => ({
  'snackbar--error': props.type === 'error',
  'snackbar--success': props.type === 'success',
  'snackbar--warning': props.type === 'warning',
  'snackbar--info': props.type === 'info'
}))

let timeoutId = null

watch(() => props.show, (newValue) => {
  if (newValue) {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    // Set auto-dismiss timeout
    if (props.duration > 0) {
      timeoutId = setTimeout(() => {
        dismiss()
      }, props.duration)
    }
  } else {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }
})

function dismiss() {
  emit('dismiss')
}
</script>

<style scoped>
.snackbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  max-width: 400px;
  min-width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  animation: slideInUp 0.3s ease-out;
  overflow: hidden;
}

.snackbar--error {
  border-left: 4px solid #dc2626;
}

.snackbar--success {
  border-left: 4px solid #16a34a;
}

.snackbar--warning {
  border-left: 4px solid #d97706;
}

.snackbar--info {
  border-left: 4px solid #2563eb;
}

.snackbar-content {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  gap: 12px;
}

.snackbar-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 2px;
}

.snackbar--error .snackbar-icon {
  color: #dc2626;
}

.snackbar--success .snackbar-icon {
  color: #16a34a;
}

.snackbar--warning .snackbar-icon {
  color: #d97706;
}

.snackbar--info .snackbar-icon {
  color: #2563eb;
}

.snackbar-icon svg {
  width: 100%;
  height: 100%;
}

.snackbar-message {
  flex: 1;
  min-width: 0;
}

.snackbar-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}

.snackbar-text {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.4;
}

.snackbar-close {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #9ca3af;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.snackbar-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
}

.snackbar-close svg {
  width: 16px;
  height: 16px;
}

@keyframes slideInUp {
  from {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .snackbar {
    bottom: 10px;
    left: 10px;
    right: 10px;
    transform: none;
    max-width: none;
    min-width: auto;
  }
  
  .snackbar-content {
    padding: 12px;
    gap: 10px;
  }
  
  .snackbar-icon {
    width: 18px;
    height: 18px;
  }
  
  .snackbar-title {
    font-size: 13px;
  }
  
  .snackbar-text {
    font-size: 12px;
  }
}
</style>
