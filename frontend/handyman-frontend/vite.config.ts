import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Local dev convenience: forward API + SignalR to backend.
      '/api': 'http://localhost:8080',
      '/hubs': {
        target: 'http://localhost:8080',
        ws: true,
      },
    },
  },
})
