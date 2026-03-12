import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-v5.js`,
        chunkFileNames: `assets/[name]-[hash]-v5.js`,
        assetFileNames: `assets/[name]-[hash]-v5.[ext]`,
        manualChunks: {
          'react-vendor':       ['react', 'react-dom'],
          'firebase-core':      ['firebase/app', 'firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
          'firebase-analytics': ['firebase/analytics'],
          'xlsx':               ['xlsx'],
          'recharts':           ['recharts'],
        }
      }
    }
  }
})
