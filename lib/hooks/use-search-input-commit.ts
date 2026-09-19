import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_DEBOUNCE_MS = 300;

/**
 * Ô search: state local khi gõ; commit vào store (kèm reset trang) sau debounce.
 * Tránh cập nhật Zustand mỗi phím — giảm re-render toàn layout.
 *
 * Hook tự giữ timer (không dùng useDebouncedValue) vì phải HUỶ được commit đang
 * chờ. Hai bẫy đã xử lý:
 * - Store đổi từ BÊN NGOÀI (bấm "Xoá lọc", reset filter): timer cũ còn treo sẽ
 *   commit đè lại từ khoá vừa xoá → phải huỷ timer và đồng bộ ô nhập.
 * - Người dùng gõ tiếp đúng lúc commit: không đồng bộ ngược committedTerm vào ô
 *   nhập cho chính giá trị hook vừa commit, nếu không sẽ nuốt ký tự vừa gõ.
 */
export function useSearchInputCommit(options: {
  committedTerm: string;
  commit: (term: string) => void;
  debounceMs?: number;
}) {
  const { committedTerm, commit, debounceMs = DEFAULT_DEBOUNCE_MS } = options;
  const [inputValue, setInputValue] = useState(committedTerm);

  const commitRef = useRef(commit);
  commitRef.current = commit;
  // Giá trị store hiện tại, đọc được trong timer mà không cần re-tạo callback.
  const committedRef = useRef(committedTerm);
  // Giá trị cuối cùng do CHÍNH hook này commit — để phân biệt thay đổi từ bên ngoài.
  const lastCommittedRef = useRef(committedTerm);
  const timerRef = useRef<number | undefined>(undefined);

  const clearTimer = () => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  };

  useEffect(() => {
    committedRef.current = committedTerm;
    if (committedTerm === lastCommittedRef.current) return;
    // Thay đổi đến từ bên ngoài → thắng, huỷ commit đang chờ.
    lastCommittedRef.current = committedTerm;
    clearTimer();
    setInputValue(committedTerm);
  }, [committedTerm]);

  useEffect(() => clearTimer, []);

  const setValue = useCallback((next: string) => {
    setInputValue(next);
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = undefined;
      if (next === committedRef.current) return;
      lastCommittedRef.current = next;
      commitRef.current(next);
    }, debounceMs);
  }, [debounceMs]);

  const flush = useCallback(() => {
    clearTimer();
    if (inputValue === committedRef.current) return;
    lastCommittedRef.current = inputValue;
    commitRef.current(inputValue);
  }, [inputValue]);

  return { inputValue, setInputValue: setValue, flush };
}
