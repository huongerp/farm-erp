import { useEffect, useState } from 'react';

/**
 * Mount/unmount with enter/exit delay for CSS transitions (replaces AnimatePresence for simple fades).
 * - open=true: mount immediately, then set visible after rAF (triggers enter transition)
 * - open=false: set visible=false, unmount after durationMs (exit transition)
 */
export function usePresenceTransition(open: boolean, durationMs = 200) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  // Phần đồng bộ (mount ngay khi mở / ẩn ngay khi đóng) điều chỉnh lúc render khi `open`
  // đổi; effect chỉ còn hẹn giờ (rAF / timeout) — setState trong callback.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setMounted(true);
    else setVisible(false);
  }

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    const timer = window.setTimeout(() => setMounted(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [open, durationMs]);

  return { mounted, visible };
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
