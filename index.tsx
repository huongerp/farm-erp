import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App';
import { QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { queryClient } from './lib/query-client';

import { ensureSentryInitialized } from './lib/sentry-client';
import './lib/i18n';
import { isAppBusy } from './lib/app-busy';
import { isTypingNow } from './lib/typing-busy';
import { PRELOAD_ERROR_RELOAD_KEY, requestReloadWhenIdle } from './lib/app-update';

/**
 * Báo cho lưới an toàn trong index.html biết bundle đã chạy được: từ đây trở đi,
 * file nào tải hụt cũng là chunk lazy — `vite:preloadError` bên dưới lo — chứ không
 * phải vỏ HTML hỏng, nên không được gỡ service worker và xoá cache.
 */
window.__APP_DA_KHOI_DONG = true;

void ensureSentryInitialized();

/**
 * Sau khi deploy bản mới, tab đang mở từ trước vẫn giữ tên file chunk cũ (hash cũ) trong bộ nhớ.
 * Khi code-splitting (lazy/import động) cần tải một chunk đó, file đã bị xoá trên server → 404 →
 * hosting rewrite về index.html (SPA fallback) → trình duyệt nhận text/html cho request module
 * script → lỗi "Expected a JavaScript-or-Wasm module script...". Vite bắn event này đúng lúc đó;
 * tải lại trang là cách khắc phục chính thức (index.html mới sẽ trỏ đúng hash chunk mới).
 * Giới hạn 1 lần/phiên để tránh lặp vô hạn nếu lỗi không phải do stale chunk.
 *
 * Đây chỉ là lưới phụ: server giữ chunk của các bản cũ (deploy/luu-asset-cu.sh) nên tab cũ
 * thường vẫn tải được, không tới đây. Còn hụt (kho mới tạo, tab treo quá lâu) mà người dùng
 * đang nhập dở thì KHÔNG reload và cũng không toast bắt bấm — chỉ ghi nhận; PwaRegister tự
 * reload ngay khi app hết bận (xem lib/app-busy.ts, lib/app-update.ts).
 */
window.addEventListener('vite:preloadError', () => {
  if (window.sessionStorage.getItem(PRELOAD_ERROR_RELOAD_KEY)) return;
  if (isAppBusy() || isTypingNow()) {
    requestReloadWhenIdle();
    return;
  }
  window.sessionStorage.setItem(PRELOAD_ERROR_RELOAD_KEY, '1');
  window.location.reload();
});

// PWA: đăng ký SW + toast cập nhật/offline trong App (PwaRegister)

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Router>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ErrorBoundary>
    </Router>
  </React.StrictMode>
);
