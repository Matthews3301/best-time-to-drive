import { createApp } from 'vue'
import { inject } from '@vercel/analytics'
import App from './App.vue'

inject() // Initialize Vercel Analytics
createApp(App).mount('#app') 