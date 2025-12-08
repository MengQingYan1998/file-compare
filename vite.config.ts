import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'


// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    electron({
        entry: 'electron/main.js'
    })
    ],
  resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
})
