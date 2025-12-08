import { createRouter, createWebHashHistory } from 'vue-router'
 
const routes = []
 
const router = createRouter({
  history: createWebHashHistory(), // ✅ 关键：使用 Hash 模式
  // history: import.meta.env.VITE_USER_NODE_ENV === "production" ? createWebHashHistory() : createWebHistory(), //路由模式
  routes
})
 
export default router