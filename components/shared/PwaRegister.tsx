import React, { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';

/**
 * Bump chuỗi này khi nghi ngờ Service Worker cũ đang cache và gây "ma API"
 * (vd: request Supabase cũ vẫn bị SW bắt → đốt egress). Thay đổi giá trị sẽ
 * kích hoạt logic unregister SW cũ **một lần duy nhất** trên mỗi trình duyệt
 * (kiểm tra qua localStorage). Lần sau bạn deploy bản vá thực sự, bump tiếp
 * giá trị này hoặc giữ nguyên.
 */
const SW_UNREGISTER_BUSTER = 'v1-egress-fix-2026-04';
const SW_UNREGISTER_LS_KEY = 'pwa-sw-unregistered-once';

async function unregisterLegacyServiceWorkersOnce(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const applied = window.localStorage.getItem(SW_UNREGISTER_LS_KEY);
    if (applied === SW_UNREGISTER_BUSTER) return;
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
    // Xoá caches cũ do SW trước đó tạo — tránh cache response Supabase cũ.
    if (typeof caches !== 'undefined') {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
    window.localStorage.setItem(SW_UNREGISTER_LS_KEY, SW_UNREGISTER_BUSTER);
  } catch {
    /* im lặng — nếu fail cũng không block app */
  }
}

/**
 * Đăng ký Service Worker (PWA) sau khi React mount để có thể dùng toast.
 * - onNeedRefresh: thông báo có bản cập nhật + nút "Tải lại".
 * - onOfflineReady: thông báo ứng dụng sẵn sàng dùng offline.
 */
const PwaRegister: React.FC = () => {
  useEffect(() => {
    // Chạy trước khi register SW mới — đảm bảo bản build cũ không còn trong cache.
    unregisterLegacyServiceWorkersOnce().finally(() => {
      const updateSW = registerSW({
        onNeedRefresh() {
          toast.info('Đã có bản cập nhật mới.', {
            description: 'Nhấn "Tải lại" để cập nhật ứng dụng.',
            action: {
              label: 'Tải lại',
              onClick: () => updateSW(true),
            },
            duration: Infinity,
          });
        },
        onOfflineReady() {
          toast.success('Ứng dụng sẵn sàng dùng offline.');
        },
      });
    });
  }, []);
  return null;
};

export default PwaRegister;
