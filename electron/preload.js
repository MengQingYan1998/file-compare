// electron/preload.exportExcelWithExcelJS
import { contextBridge } from 'electron';

// 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electron', {
  // 可以在这里暴露一些方法，如打开文件、调用系统 API
  doThing: () => console.log('执行 Electron 功能')
})