import path from 'path';
import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { ManifestOptions } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { devServices } from './vite/dev-services';

// Manifest PWA dùng chung cho cả build (VitePWA) và dev (plugin pwa-manifest-dev
// bên dưới) — khai một chỗ để hai môi trường không lệch icon nhau.
const pwaManifest: Partial<ManifestOptions> = {
  name: 'Forpeasantz',
  short_name: 'Forpeasantz',
  description: 'Hợp Tác Xã Nông Nghiệp Công Nghệ Cao FP - Forpeasantz',
  theme_color: '#ffffff',
  background_color: '#ffffff',
  display: 'standalone',
  start_url: '/',
  // Icon phải nằm cùng origin: icon trỏ ra dịch vụ ngoài thì máy không
  // tải được lúc cài (hoặc lúc offline) là PWA hiện ô trắng không logo.
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    // Bản maskable để riêng: Android cắt icon theo khuôn của máy, dùng
    // chung bản 'any' bo góc sẵn sẽ bị cắt cụt mất chữ.
    {
      src: '/icons/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};

export default defineConfig(({ mode }) => {
  const analyze = process.env.ANALYZE === '1';
  // `lib/api-config.ts` dùng đường dẫn tương đối (`/api`, `/auth`) giống hệt
  // production sau Traefik. Ở dev, proxy này đóng vai Traefik: forward sang
  // PostgREST và auth-service — hai service do plugin devServices bật kèm
  // `npm run dev`. Đổi target qua .env nếu chạy port khác hoặc muốn trỏ ra VPS
  // (xem README mục "Chạy full-stack ở local").
  const env = loadEnv(mode, process.cwd(), '');
  const authProxyTarget = env.DEV_AUTH_PROXY_TARGET || 'http://127.0.0.1:3001';
  const apiProxyTarget = env.DEV_API_PROXY_TARGET || 'http://127.0.0.1:3010';
  const notifyProxyTarget = env.DEV_NOTIFY_PROXY_TARGET || 'http://127.0.0.1:3002';
  const sheetsProxyTarget = env.DEV_SHEETS_PROXY_TARGET || 'http://127.0.0.1:3003';

  // Số phiên bản hiện ở trang Cài đặt — đổi ở package.json khi phát hành (kèm git tag vX.Y.Z).
  const appVersion = (JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')) as { version?: string })
    .version ?? '0.0.0';

  return {
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    server: {
      // PORT cho phép chạy song song nhiều dev server (mặc định vẫn 3000).
      port: Number(process.env.PORT) || Number(env.PORT) || 3000,
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
        // Service thông báo: đăng ký Web Push và khoá VAPID công khai.
        '/notify': {
          target: notifyProxyTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/notify/, ''),
        },
        // Service sheets: kết nối Google + xuất/đồng bộ Google Sheet. Header Origin
        // giữ nguyên (changeOrigin chỉ đổi Host) — service dựa vào nó để lập redirect_uri.
        '/sheets': {
          target: sheetsProxyTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/sheets/, ''),
        },
      },
    },
    build: {
      // Chunk lớn nhất là vendor-exceljs (~915 KB) — thư viện xuất Excel, chỉ nạp lười (import()) khi
      // bấm Xuất, không nằm trong lần tải đầu. Kích thước từng chunk do `npm run check:bundle` canh
      // (scripts/bundle-baseline.json), nên ngưỡng cảnh báo mặc định 500 KB của Vite chỉ gây nhiễu.
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Helper __vitePreload của mọi import() động: để rollup tự xếp thì nó bị gộp vào
            // vendor-jspdf → bundle chính import chunk đó → tải sẵn ~400 KB jspdf ngay khi mở app.
            if (id.includes('vite/preload-helper')) return 'vite-preload';
            if (!id.includes('node_modules')) return;
            // clsx (hàm cn) dùng khắp app; recharts cũng dùng → rollup gom vào chunk recharts,
            // kéo ~380 KB recharts vào lần tải đầu. Cho về chunk react-vendor (vốn tải ngay).
            if (id.includes('/node_modules/clsx/')) return 'react-vendor';
            // @supabase/postgrest-js: chỉ là client PostgREST (lib/db.ts), không phải dịch vụ Supabase.
            if (id.includes('@supabase')) return 'postgrest';
            // Phải xét TRƯỚC react-vendor: đường dẫn `@sentry/react/…` chứa "/react/" nên từng bị gom
            // vào react-vendor (tải lúc khởi động) → kéo cả chunk sentry ~400 KB vào lần mở đầu.
            if (id.includes('@sentry')) return 'sentry';
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
            if (id.includes('exceljs')) return 'vendor-exceljs';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('jspdf')) return 'vendor-jspdf';
            if (id.includes('html2canvas')) return 'vendor-html2canvas';
            if (id.includes('react-router')) return 'react-router';
            if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor';
            if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n';
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
              res.setHeader('Location', '/icons/favicon-32.png');
              res.end();
              return;
            }
            next();
          });
        },
      },
      {
        // VitePWA đang tắt ở dev (devOptions.enabled = false) nên nó KHÔNG sinh
        // manifest.webmanifest và cũng không chèn <link rel="manifest">. Hệ quả:
        // ở localhost, `/manifest.webmanifest` rơi vào fallback SPA trả về
        // index.html (text/html), Chrome không đọc được manifest nên khi cài app
        // chỉ còn favicon 32px để lấy icon — đúng cảnh "PWA không có logo".
        // Plugin này chỉ bù manifest cho dev, service worker vẫn tắt như cũ.
        name: 'pwa-manifest-dev',
        apply: 'serve',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (!req.url || req.url.split('?')[0] !== '/manifest.webmanifest') {
              next();
              return;
            }
            res.setHeader('Content-Type', 'application/manifest+json');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(JSON.stringify(pwaManifest));
          });
        },
        transformIndexHtml() {
          return [
            {
              tag: 'link',
              attrs: { rel: 'manifest', href: '/manifest.webmanifest' },
              injectTo: 'head' as const,
            },
          ];
        },
      },
      react(),
      devServices({
        env,
        root: __dirname,
        apiTarget: apiProxyTarget,
        authTarget: authProxyTarget,
        notifyTarget: notifyProxyTarget,
        sheetsTarget: sheetsProxyTarget,
      }),
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
        // injectManifest thay vì generateSW: chế độ generateSW dựng trọn file
        // service worker nên không có chỗ nào chèn listener `push`. Nội dung SW
        // nay nằm ở sw/sw.ts, giữ nguyên precache + 3 quy tắc runtime caching cũ.
        strategies: 'injectManifest',
        srcDir: 'sw',
        filename: 'sw.ts',
        manifest: pwaManifest,
        injectManifest: {
          // Giữ đúng danh sách precache của cấu hình generateSW trước đây.
          globPatterns: ['**/*.html', 'icons/*.png', 'manifest.webmanifest', 'fonts/**/*'],
          globIgnores: ['**/stats.html'],
        },
        devOptions: {
          // Bật SW ở dev để thử push mà không phải build production.
          enabled: false,
          type: 'module',
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
