/// <reference lib="webworker" />

/**
 * Service worker tự viết (chế độ injectManifest của vite-plugin-pwa).
 *
 * Trước đây dự án dùng chế độ generateSW — workbox tự sinh toàn bộ file nên
 * KHÔNG chèn được listener `push`. Đổi sang injectManifest là điều kiện bắt buộc
 * để có Web Push; đổi lại ta phải tự khai phần precache và runtime caching, và
 * phần đó giữ nguyên đúng ba quy tắc cũ trong vite.config.ts.
 */

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

// --- Precache -----------------------------------------------------------------

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA: mọi điều hướng đều trả về vỏ index.html. Trừ /api, /auth, /notify — đó là
// request dữ liệu, không bao giờ được trả về HTML.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api\//, /^\/auth\//, /^\/notify\//],
  })
);

// --- Runtime caching (giữ nguyên ba quy tắc của cấu hình cũ) -------------------

registerRoute(
  ({ url }) => url.origin === self.location.origin && /^\/assets\/.*\.(js|css)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'app-assets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// --- Cập nhật ------------------------------------------------------------------

/**
 * registerType vẫn là 'prompt': app tự chọn thời điểm an toàn để áp bản mới
 * (components/shared/PwaRegister.tsx) rồi gửi SKIP_WAITING xuống đây.
 */
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as { type?: string } | undefined;
  if (data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

// --- Web Push -------------------------------------------------------------------

interface NoiDungPush {
  tieuDe?: string;
  noiDung?: string | null;
  link?: string | null;
  tag?: string;
  muc?: 'cao' | 'thuong';
  /** Tổng số chưa đọc, do notify-service tính sẵn — dùng đặt badge trên icon app. */
  soChuaDoc?: number;
}

/**
 * Badging API chưa có trong lib.webworker của TypeScript nên phải tự khai.
 * Safari iOS 16.4+ và Chrome/Edge trên máy tính có; nơi nào không có thì bỏ qua.
 */
type NavigatorCoBadge = WorkerNavigator & {
  setAppBadge?: (so?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

/**
 * Đặt con số đỏ trên icon app ngoài màn hình chính.
 *
 * iOS chỉ cho đặt badge khi PWA đã được thêm vào màn hình chính và người dùng đã
 * cấp quyền thông báo — chưa đủ điều kiện thì lời gọi ném lỗi, nuốt luôn để
 * không làm hỏng việc hiện thông báo.
 */
async function datBadge(so: number | undefined): Promise<void> {
  if (typeof so !== 'number' || !Number.isFinite(so)) return;
  const nav = self.navigator as NavigatorCoBadge;
  try {
    if (so > 0) await nav.setAppBadge?.(so);
    else await nav.clearAppBadge?.();
  } catch {
    // Trình duyệt không hỗ trợ hoặc chưa đủ quyền — badge chỉ là phần thêm.
  }
}

function docPayload(event: PushEvent): NoiDungPush {
  if (!event.data) return {};
  try {
    return event.data.json() as NoiDungPush;
  } catch {
    // Push service có thể gửi thông báo rỗng để "đánh thức" — vẫn phải hiện một
    // thông báo nào đó, nếu không trình duyệt phạt và có thể thu hồi quyền push.
    return { tieuDe: event.data.text() };
  }
}

self.addEventListener('push', (event: PushEvent) => {
  const nd = docPayload(event);
  const tieuDe = nd.tieuDe ?? 'Thông báo mới';

  event.waitUntil(
    Promise.all([
      datBadge(nd.soChuaDoc),
      self.registration.showNotification(tieuDe, {
        body: nd.noiDung ?? undefined,
        // PNG chứ không SVG: Android không vẽ được icon SVG trong thông báo.
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-96.png',
        // Gom theo bản ghi: sửa một phiếu nhiều lần không xếp chồng nhiều thẻ.
        tag: nd.tag ?? 'farm-erp',
        renotify: true,
        requireInteraction: nd.muc === 'cao',
        data: { link: nd.link ?? '/thong-bao' },
      } as NotificationOptions),
    ])
  );
});

/**
 * Bấm vào thông báo: đưa tab đang mở lên trước và điều hướng, thay vì mở thêm
 * một cửa sổ mới mỗi lần.
 */
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const duLieu = event.notification.data as { link?: string } | undefined;
  const link = duLieu?.link ?? '/thong-bao';
  const dich = new URL(link, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const dsClient = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of dsClient) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) await client.navigate(dich).catch(() => undefined);
          return;
        }
      }
      await self.clients.openWindow(dich);
    })()
  );
});
