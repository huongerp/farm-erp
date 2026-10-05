import { useEffect, useState } from 'react';

/**
 * Mount/unmount with enter/exit delay for CSS transitions (replaces AnimatePresence for simple fades).
 * - open=true: mount immediately, then set visible after rAF (triggers enter transition)
 * - open=false: set visible=false, unmount after durationMs (exit transition)
 *
 * `mounted` SUY RA từ `open || exiting`, không lưu thành state riêng. Bản trước giữ `mounted`
 * trong state, vừa set lúc render (`setMounted(true)` khi mở) vừa set trong timer
 * (`setMounted(false)` — chạy cả lúc mount dù đang false). React vẫn xếp lệnh set không đổi
 * giá trị đó vào hàng đợi rồi áp đè lên lệnh set lúc render → lần mở đầu tiên bị gỡ DOM ngay,
 * ConfirmDialog không bao giờ hiện (mọi nút cần xác nhận "bấm không ăn").
 * Giờ timer chỉ tắt `exiting`; lỡ bị áp muộn lúc đang mở thì `open` vẫn giữ DOM.
 */
export function usePresenceTransition(open: boolean, durationMs = 200) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Phần đồng bộ (bắt đầu/huỷ hiệu ứng đóng, ẩn ngay khi đóng) điều chỉnh lúc render khi
  // `open` đổi; effect chỉ còn hẹn giờ (rAF / timeout) — setState trong callback.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    setExiting(!open);
    if (!open) setVisible(false);
  }

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!exiting) return;
    const timer = window.setTimeout(() => setExiting(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [exiting, durationMs]);

  return { mounted: open || exiting, visible };
}

/** Enter-only transition for components that mount when shown and unmount immediately on close. */
export function useEnterTransition() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return visible;
}
