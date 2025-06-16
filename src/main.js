import { createApp } from 'vue'
import { Analytics } from '@vercel/analytics/vue'
import App from './App.vue'

const app = createApp(App)
app.use(Analytics)
app.mount('#app') 