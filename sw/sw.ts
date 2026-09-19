/// <reference lib="webworker" />

/**
 * Service worker tự viết (chế độ injectManifest của vite-plugin-pwa).
 *
 * Trước đây dự án dùng chế độ generateSW — workbox tự sinh toàn bộ file nên
 * KHÔNG chèn được listener `push`. Đổi sang injectManifest là điều kiện bắt buộc
 * để có Web Push; đổi lại ta phải tự khai phần precache và runtime caching, và
 * phần đó giữ nguyên đúng ba quy tắc cũ trong vite.config.ts.
 */

import {
  precache,
  addRoute as addPrecacheRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
} from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import type { RouteHandlerCallbackOptions } from 'workbox-core/types';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

// --- Precache -----------------------------------------------------------------

/**
 * Cố ý tách `precache()` và `addPrecacheRoute()` thay vì gọi `precacheAndRoute()`.
 *
 * Route của precache mặc định bật `directoryIndex: 'index.html'`, nghĩa là nó nhận
 * luôn request điều hướng `/` và trả bản HTML trong precache. Đăng ký nó trước thì
 * route điều hướng bên dưới không bao giờ được gọi cho trang gốc — đo trực tiếp thấy
 * đúng như vậy: `/mua-hang` đi đường mạng-trước, còn `/` vẫn ăn vỏ cũ trong precache.
 * Router của Workbox xét route theo thứ tự đăng ký, nên nạp precache trước (để
 * `createHandlerBoundToURL` có cái mà trỏ), rồi route điều hướng, rồi mới route precache.
 */
precache(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// --- Vỏ SPA: MẠNG TRƯỚC, cache chỉ để dùng khi mất mạng ------------------------

/**
 * Trước đây mọi điều hướng lấy thẳng `index.html` từ precache. Cách đó làm trắng
 * màn hình sau mỗi lần deploy: bản HTML cũ trong precache trỏ vào `/assets/index-<hash cũ>.js`
 * đã bị xoá khỏi server, script entry trả 404 nên KHÔNG dòng JS nào chạy được —
 * ErrorBoundary vô tác dụng (lỗi xảy ra trước React), `vite:preloadError` cũng không
 * bắt (nó chỉ lo chunk import động). Tệ hơn: service worker mới chờ app gửi
 * SKIP_WAITING mới được thay, mà app thì không khởi động nổi để gửi → kẹt vĩnh viễn,
 * người dùng phải tự xoá dữ liệu trang mới thoát.
 *
 * Nay vỏ HTML luôn hỏi mạng trước (nginx đã đặt `no-cache` cho index.html), nên
 * HTML và chunk luôn cùng một bản. Mất mạng hoặc mạng treo quá `networkTimeoutSeconds`
 * thì mới rơi về bản đã lưu — offline vẫn chạy như cũ.
 */
const SHELL_CACHE = 'app-shell';

const shellStrategy = new NetworkFirst({
  cacheName: SHELL_CACHE,
  // Mạng 3G chập chờn: chờ quá 3 giây thì dùng bản cũ cho người dùng vào được app,
  // hơn là bắt họ nhìn màn trắng tới lúc request timeout thật.
  networkTimeoutSeconds: 3,
  // KHÔNG gắn ExpirationPlugin ở đây: cache này chỉ chứa đúng một khoá `/index.html`
  // nên không bao giờ phình, mà `maxEntries: 1` lại xoá sạch chính bản vỏ vừa lưu —
  // đo trực tiếp thấy cache rỗng sau mỗi lần tải, tức là mất luôn bản dự phòng offline.
  plugins: [new CacheableResponsePlugin({ statuses: [200] })],
});

/** Bản precache — lưới cuối cùng cho lần mở đầu tiên khi đang offline. */
const shellTuPrecache = createHandlerBoundToURL('index.html');

/**
 * Luôn xin đúng `/index.html` chứ không xin theo URL đang điều hướng: SPA có hàng
 * chục route nhưng chỉ một vỏ, lưu theo URL sẽ nhân bản cùng một file nhiều lần.
 */
async function xuLyDieuHuong(options: RouteHandlerCallbackOptions): Promise<Response> {
  const shellRequest = new Request(new URL('/index.html', self.location.origin).href);
  try {
    const res = await shellStrategy.handle({ ...options, request: shellRequest });
    if (res) return res;
  } catch {
    // Offline và chưa từng lưu được vỏ nào — rơi xuống bản precache bên dưới.
  }
  return shellTuPrecache(options);
}

// Trừ /api, /auth, /notify — đó là request dữ liệu, không bao giờ được trả về HTML.
registerRoute(
  new NavigationRoute(xuLyDieuHuong, {
    denylist: [/^\/api\//, /^\/auth\//, /^\/notify\//],
  })
);

// Sau route điều hướng: icons, fonts, manifest vẫn phục vụ thẳng từ precache.
addPrecacheRoute();

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
