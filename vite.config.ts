import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true // ✅ อนุญาตทุก Host ทันที ไม่ต้องมานั่งกรอก URL เองครับ
  }
})