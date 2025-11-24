import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as router from './router/index.js'

import './style.css'
import App from './App.vue'
const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')
