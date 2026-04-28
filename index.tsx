import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App';
import { QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { queryClient } from './lib/query-client';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn && typeof sentryDsn === 'string' && sentryDsn.trim() !== '') {
  void import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE || 'production',
      enabled: true,
    });
  });
}

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
