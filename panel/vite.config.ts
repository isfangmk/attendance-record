import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BASE_PATH = '/attendance-record/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: BASE_PATH,
  server: {
    proxy: {
      [BASE_PATH + 'api']: {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
