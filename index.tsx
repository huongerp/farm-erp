import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App';
import { QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { queryClient } from './lib/query-client';

import { ensureSentryInitialized } from './lib/sentry-client';

void ensureSentryInitialized();

/**
 * Sau khi deploy bản mới, tab đang mở từ trước vẫn giữ tên file chunk cũ (hash cũ) trong bộ nhớ.
 * Khi code-splitting (lazy/import động) cần tải một chunk đó, file đã bị xoá trên server → 404 →
 * hosting rewrite về index.html (SPA fallback) → trình duyệt nhận text/html cho request module
 * script → lỗi "Expected a JavaScript-or-Wasm module script...". Vite bắn event này đúng lúc đó;
 * tải lại trang là cách khắc phục chính thức (index.html mới sẽ trỏ đúng hash chunk mới).
 * Giới hạn 1 lần/phiên để tránh lặp vô hạn nếu lỗi không phải do stale chunk.
 */
window.addEventListener('vite:preloadError', () => {
  const key = 'vite-preload-error-reloaded';
  if (window.sessionStorage.getItem(key)) return;
  window.sessionStorage.setItem(key, '1');
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
