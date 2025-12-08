// electron/main.js
import { app, BrowserWindow } from 'electron';
import path from 'path'
import { fileURLToPath } from 'node:url'

// 创建主窗口
function createWindow () {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // 禁用 nodeIntegration 出于安全考虑
      nodeIntegration: true,
      // 启用上下文隔离（推荐）
      contextIsolation: false,
      
      enableRemoteModule: true,
      // 预加载脚本（可选）
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // 判断是开发环境还是生产环境
  if (process.env.NODE_ENV === 'development') {
    // 开发模式：加载本地 Vue 服务
    win.loadURL('http://localhost:5173') // 注意：Vue CLI 默认端口是 8080，Vite 是 5173
  } else {
    // 生产模式：加载打包后的 index.html
    win.loadFile(path.resolve(__dirname, '../dist/index.html'))
  }
}

// Electron 初始化完成后创建窗口
app.whenReady().then(() => {
  createWindow()

  // macOS 规范
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 关闭所有窗口时退出应用（Windows 和 Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})