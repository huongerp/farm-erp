import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const analyze = process.env.ANALYZE === '1';
  // `lib/api-config.ts` dùng đường dẫn tương đối (`/api`, `/auth`) giống hệt
  // production sau Traefik. Ở dev, proxy này đóng vai Traefik: forward sang
  // PostgREST và auth-service chạy local. Đổi target qua .env nếu chạy port khác
  // (xem README mục "Chạy full-stack ở local").
  const env = loadEnv(mode, process.cwd(), '');
  const authProxyTarget = env.DEV_AUTH_PROXY_TARGET || 'http://127.0.0.1:3001';
  const apiProxyTarget = env.DEV_API_PROXY_TARGET || 'http://127.0.0.1:3010';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // Auth-service và PostgREST đều không biết tiền tố công khai — Traefik
        // strip `/auth` / `/api` trước khi forward; proxy dev làm y hệt.
        '/auth': {
          target: authProxyTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/auth/, ''),
        },
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('@supabase')) return 'postgrest';
            if (
              id.includes('@tanstack/react-query') ||
              id.includes('@tanstack/query-async-storage-persister') ||
              id.includes('@tanstack/react-query-persist-client') ||
              id.includes('@tanstack/react-virtual') ||
              id.includes('@tanstack/query-persist-client-core')
            ) {
              return 'tanstack-query';
            }
            if (id.includes('framer-motion')) return 'framer-motion';
            if (id.includes('@dnd-kit')) return 'dnd-kit';
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('jspdf')) return 'vendor-jspdf';
            if (id.includes('html2canvas')) return 'vendor-html2canvas';
            if (id.includes('react-router')) return 'react-router';
            if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor';
            if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n';
            if (id.includes('@sentry')) return 'sentry';
            return undefined;
          },
        },
      },
    },
    plugins: [
      {
        name: 'favicon-ico-redirect',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/favicon.ico') {
              res.statusCode = 302;
              res.setHeader('Location', '/favicon.svg');
              res.end();
              return;
            }
            next();
          });
        },
      },
      react(),
      ...(analyze
        ? [
            visualizer({
              filename: 'dist/stats.html',
              open: false,
              gzipSize: true,
              brotliSize: true,
            }),
          ]
        : []),
      VitePWA({
        registerType: 'prompt',
        manifest: {
          name: 'Forpeasantz',
          short_name: 'Forpeasantz',
          description: 'Hợp Tác Xã Nông Nghiệp Công Nghệ Cao FP - Forpeasantz',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'https://ui-avatars.com/api/?name=FP&background=16a34a&color=fff&size=192',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'https://ui-avatars.com/api/?name=FP&background=16a34a&color=fff&size=512',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.html', 'favicon.svg', 'manifest.webmanifest', 'fonts/**/*'],
          globIgnores: ['**/stats.html'],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({ url }) =>
                url.origin === self.location.origin && /^\/assets\/.*\.(js|css)$/.test(url.pathname),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'app-assets',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        buffer: 'buffer',
      },
    },
  };
});
