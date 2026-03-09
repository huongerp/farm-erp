import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
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
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.svg'],
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
                src: 'https://scontent.fhan4-5.fna.fbcdn.net/v/t39.30808-6/646547940_873439215698096_8760186466343055269_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=13d280&_nc_ohc=RAsKtIGtd-8Q7kNvwHyjEYV&_nc_oc=AdmPaglRA6w8umYrs4ELlGNy4mcwgbEmXig4eHfJHVpmlEkxBZBTaSnD3vaVn20o-Y4&_nc_zt=23&_nc_ht=scontent.fhan4-5.fna&_nc_gid=ZR7t3ad-E7IH_sTcGZ8tPQ&_nc_ss=8&oh=00_Afx9TruOr9KWk3qZWGBgUKCEX3O7--0UU6h9sjb98wlIqA&oe=69B09F87',
                sizes: '192x192',
                type: 'image/jpeg',
                purpose: 'any',
              },
              {
                src: 'https://scontent.fhan4-5.fna.fbcdn.net/v/t39.30808-6/646547940_873439215698096_8760186466343055269_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=13d280&_nc_ohc=RAsKtIGtd-8Q7kNvwHyjEYV&_nc_oc=AdmPaglRA6w8umYrs4ELlGNy4mcwgbEmXig4eHfJHVpmlEkxBZBTaSnD3vaVn20o-Y4&_nc_zt=23&_nc_ht=scontent.fhan4-5.fna&_nc_gid=ZR7t3ad-E7IH_sTcGZ8tPQ&_nc_ss=8&oh=00_Afx9TruOr9KWk3qZWGBgUKCEX3O7--0UU6h9sjb98wlIqA&oe=69B09F87',
                sizes: '512x512',
                type: 'image/jpeg',
                purpose: 'any maskable',
              },
            ],
          },
          minify: false, // tránh lỗi "Unable to write service worker" / terser renderChunk early exit
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8 MiB (chunk chính ~5.8 MB)
            runtimeCaching: [
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
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          buffer: 'buffer',
        }
      }
    };
});
