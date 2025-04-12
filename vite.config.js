import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['e3d4-2800-e2-c080-6f0-453d-47b5-e63b-6558.ngrok-free.app'],
  }
})
