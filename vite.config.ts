import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    logLevel: 'error',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
        manifest: {
          id: '/',
          name: 'Fitness Future',
          short_name: 'FitFuture',
          description: 'Fitness Future — Complete Gym Operations, Workouts, Nutrition & Member App for Android & iOS.',
          theme_color: '#09090b',
          background_color: '#09090b',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          categories: ['fitness', 'health', 'lifestyle', 'business'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/assets\//,
            /^\/utils\//,
            /^\/src\//,
            /^\/lib\//,
            /\/[^/?]+\.[^/]+$/,
          ],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 15, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'fitness-future-api-cache',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
          type: 'module',
        },
      }),
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        // Explicitly map @ to the utils directory
        '@': path.resolve(__dirname, 'utils'),
        // Map lib to the lib directory at root
        'lib': path.resolve(__dirname, 'lib'),
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        'three': path.resolve(__dirname, 'utils/mock.ts'),
        '@tensorflow/tfjs-core': path.resolve(__dirname, 'utils/mock.ts'),
        '@tensorflow/tfjs-backend-webgl': path.resolve(__dirname, 'utils/mock.ts'),
        '@tensorflow-models/pose-detection': path.resolve(__dirname, 'utils/mock.ts'),
        '@mediapipe/pose': path.resolve(__dirname, 'utils/mock.ts'),
        '@mediapipe/camera_utils': path.resolve(__dirname, 'utils/mock.ts'),
        '@mediapipe/drawing_utils': path.resolve(__dirname, 'utils/mock.ts'),
        '@mediapipe/face_mesh': path.resolve(__dirname, 'utils/mock.ts'),
        '@xenova/transformers': path.resolve(__dirname, 'utils/mock.ts'),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'zustand',
        'zustand/vanilla',
        'motion/react',
        'framer-motion',
        'lucide-react',
        'date-fns',
        'recharts',
        'jspdf',
        'jspdf-autotable',
        'jsqr',
        'qrcode',
        'qrcode.react',
        'axios',
        'crypto-js',
        'd3',
        '@google-pay/button-react',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'firebase/storage',
        'html2canvas',
        'react-webcam',
        'clsx',
        'tailwind-merge'
      ],
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      hmr: process.env.DISABLE_HMR === 'true' ? false : true,
      proxy: {
        '/whatsapp-api': {
          target: 'https://graph.facebook.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/whatsapp-api/, '')
        }
      }
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      allowedHosts: ['.run.app', 'localhost'],
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'esnext',
      sourcemap: false,
      minify: 'esbuild',
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        maxParallelFileOps: 2
      }
    }
  };
});
