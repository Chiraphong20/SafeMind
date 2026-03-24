import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true, // ✅ อนุญาตทุก Host ทันที
    proxy: {
      '/api/fastapi': {
        target: 'http://210.246.215.95:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fastapi/, '')
      }
    }
  }
})