import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // You can change the port if needed
    proxy: {
      // Proxy API requests to your backend server
      '/api': {
        target: 'http://localhost:3000', // Your backend Express server
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '') // Uncomment if your backend doesn't expect /api prefix
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})
