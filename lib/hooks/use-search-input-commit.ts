import { useCallback, useEffect, useState } from 'react';
import { useDebouncedValue } from './use-debounced-value';

const DEFAULT_DEBOUNCE_MS = 300;

/**
 * Ô search: state local khi gõ; commit vào store (kèm reset trang) sau debounce.
 * Tránh cập nhật Zustand mỗi phím — giảm re-render toàn layout.
 */
export function useSearchInputCommit(options: {
  committedTerm: string;
  commit: (term: string) => void;
  debounceMs?: number;
}) {
  const { committedTerm, commit, debounceMs = DEFAULT_DEBOUNCE_MS } = options;
  const [inputValue, setInputValue] = useState(committedTerm);
  const debounced = useDebouncedValue(inputValue, debounceMs);

  useEffect(() => {
    setInputValue(committedTerm);
  }, [committedTerm]);

  useEffect(() => {
    if (debounced !== committedTerm) {
      commit(debounced);
    }
  }, [debounced, committedTerm, commit]);

  const flush = useCallback(() => {
    if (inputValue !== committedTerm) {
      commit(inputValue);
    }
  }, [inputValue, committedTerm, commit]);

  return { inputValue, setInputValue, flush };
}
