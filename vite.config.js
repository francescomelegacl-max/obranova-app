import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

function generateFcmSw(env) {
  return {
    name: 'generate-fcm-sw',
    closeBundle() {
      const swTemplate = fs.readFileSync(
        path.resolve(__dirname, 'public/firebase-messaging-sw.js'), 'utf-8'
      );
      const swContent = swTemplate
        .replace('"AIzaSyC-PLACEHOLDER"',         JSON.stringify(env.VITE_FIREBASE_API_KEY       || ''))
        .replace('"PLACEHOLDER_SENDER_ID"',        JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''))
        .replace('"PLACEHOLDER_APP_ID"',           JSON.stringify(env.VITE_FIREBASE_APP_ID        || ''));
      fs.writeFileSync(path.resolve(__dirname, 'dist/firebase-messaging-sw.js'), swContent);
      console.log('[generateFcmSw] ✅ firebase-messaging-sw.js generato con env vars reali');
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const buildTime = Date.now();
  return {
    define: {
      __BUILD_TIME__: JSON.stringify(buildTime),
    },
    plugins: [
      react(),
      generateFcmSw(env),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ['**/*.{html,css}'],
          globIgnores: ['assets/*.js', 'firebase-messaging-sw.js'],
          runtimeCaching: [
            {
              urlPattern: /\/assets\/.*\.js$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'js-chunks',
                networkTimeoutSeconds: 10,
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
          ],
        },
        manifest: {
          name: 'Obra Nova',
          short_name: 'Obra Nova',
          description: 'Software de presupuestos para constructoras y maestros en Chile',
          theme_color: '#1a365d',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
      }),
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    build: {
      chunkSizeWarningLimit: 1000,
      chunkSizeWarningLimit: 1500,
    },
  };
})
