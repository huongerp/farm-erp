/// <reference types="vite/client" />

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisteredSW?: (
      swScriptUrl: string,
      registration: ServiceWorkerRegistration | undefined
    ) => void;
    onRegisterError?: (error: unknown) => void;
  }
  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}

interface Window {
  /**
   * Đặt = true ngay khi bundle chính chạy được (xem index.tsx). Lưới an toàn
   * chống màn trắng trong index.html đọc cờ này để phân biệt "vỏ HTML hỏng"
   * (app chưa hề khởi động) với "chunk lazy tải hụt" (app đang chạy bình thường).
   */
  __APP_DA_KHOI_DONG?: boolean;
}
