import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        // v3 fuerza cache bust del service worker — cambia il suffisso ad ogni deploy importante
        entryFileNames: `assets/[name]-[hash]-v3.js`,
        chunkFileNames: `assets/[name]-[hash]-v3.js`,
        assetFileNames: `assets/[name]-[hash]-v3.[ext]`,
        // manualChunks per bundle size ottimizzato (task 5.8)
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx'))                    return 'vendor-xlsx';
            if (id.includes('firebase'))                return 'vendor-firebase';
            if (id.includes('recharts') || id.includes('d3')) return 'vendor-charts';
            if (id.includes('@sentry'))                 return 'vendor-sentry';
            if (id.includes('react-dom') || id.includes('react/')) return 'vendor-react';
            return 'vendor-misc';
          }
        },
      }
    }
  }
})
