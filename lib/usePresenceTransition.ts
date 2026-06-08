import { useEffect, useState } from 'react';

/**
 * Mount/unmount with enter/exit delay for CSS transitions (replaces AnimatePresence for simple fades).
 * - open=true: mount immediately, then set visible after rAF (triggers enter transition)
 * - open=false: set visible=false, unmount after durationMs (exit transition)
 */
export function usePresenceTransition(open: boolean, durationMs = 200) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
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
