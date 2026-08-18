import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Fixed and distinct from cms/'s port — cms/.env's VITE_FRONTEND_URL
    // points here to build invitation links, so it can't be left to drift
    // to whatever port happens to be free on a given restart.
    port: 5176,
    strictPort: true,
  },
})
