import { useEffect, useState } from 'react';

/** Mặc định 300ms — tránh gọi Supabase mỗi ký tự khi gõ search. */
const DEFAULT_DEBOUNCE_MS = 300;

/**
 * Trả về bản sao debounce của `value` sau `delayMs` ms kể từ lần thay đổi cuối.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = DEFAULT_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
