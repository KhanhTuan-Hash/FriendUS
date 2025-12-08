// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Catch any request starting with /api
      '/api': {
        target: 'http://127.0.0.1:5000', // Forward to Flask
        changeOrigin: true,
        secure: false,
      }
    }
  }
})