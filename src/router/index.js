import { createRouter, createWebHashHistory } from 'vue-router'
 
const routes = []
 
const router = createRouter({
  history: createWebHashHistory(), // ✅ 关键：使用 Hash 模式
  routes
})
 
export default router