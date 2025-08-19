import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175, // Đổi sang port khác để tránh trùng
    host: true
  },
  define: {
    global: 'globalThis',
  }
})
