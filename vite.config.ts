import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,        // Frontend always on 5173
    strictPort: false, // Fall back to next free port if 5173 is taken
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Backend always on 3001
        changeOrigin: true,
      },
    },
  },
})
