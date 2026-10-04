import { useCallback, useSyncExternalStore } from 'react';

/** `true` khi màn hình hẹp hơn `breakpoint` (mặc định 768px = mốc `md:` của Tailwind). */
export function useIsMobile(breakpoint = 768): boolean {
  const query = `(max-width: ${breakpoint - 1}px)`;
  // Đăng ký media query như một nguồn dữ liệu ngoài (useSyncExternalStore) thay vì
  // setState trong effect — giá trị đúng ngay lần render đầu, đổi khi kéo cửa sổ.
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    [query]
  );
  const getSnapshot = () =>
    typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : window.innerWidth < breakpoint;
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
