import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App';
import { QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { queryClient } from './lib/query-client';

import { toast } from 'sonner';
import { ensureSentryInitialized } from './lib/sentry-client';
import i18n from './lib/i18n';
import { isAppBusy } from './lib/app-busy';
import { isTypingNow } from './lib/typing-busy';
import { PRELOAD_ERROR_RELOAD_KEY, requestReloadWhenIdle } from './lib/app-update';

void ensureSentryInitialized();

/**
 * Sau khi deploy bản mới, tab đang mở từ trước vẫn giữ tên file chunk cũ (hash cũ) trong bộ nhớ.
 * Khi code-splitting (lazy/import động) cần tải một chunk đó, file đã bị xoá trên server → 404 →
 * hosting rewrite về index.html (SPA fallback) → trình duyệt nhận text/html cho request module
 * script → lỗi "Expected a JavaScript-or-Wasm module script...". Vite bắn event này đúng lúc đó;
 * tải lại trang là cách khắc phục chính thức (index.html mới sẽ trỏ đúng hash chunk mới).
 * Giới hạn 1 lần/phiên để tránh lặp vô hạn nếu lỗi không phải do stale chunk.
 *
 * Nhưng KHÔNG reload khi người dùng đang nhập dở — trước đây chỗ này reload vô điều kiện,
 * đang điền phiếu là mất trắng. Lúc đó chỉ báo và ghi nhận yêu cầu; PwaRegister sẽ reload
 * ngay khi app hết bận (xem lib/app-busy.ts, lib/app-update.ts).
 */
window.addEventListener('vite:preloadError', () => {
  if (window.sessionStorage.getItem(PRELOAD_ERROR_RELOAD_KEY)) return;
  if (isAppBusy() || isTypingNow()) {
    requestReloadWhenIdle();
    toast.error(i18n.t('app.chunkStaleBusy'), {
      action: {
        label: i18n.t('app.reloadNow'),
        onClick: () => {
          window.sessionStorage.setItem(PRELOAD_ERROR_RELOAD_KEY, '1');
          window.location.reload();
        },
      },
      duration: Infinity,
    });
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
