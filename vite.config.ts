import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // `npm run dev:api` runs the Worker on 8787. Without it the app simply
    // stays in local demo mode.
    proxy: { '/api': 'http://localhost:8787' },
  },
})
