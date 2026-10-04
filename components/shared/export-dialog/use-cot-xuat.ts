import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ExportColumn } from '../../../lib/export/dinh-dang-o';

interface TrangThaiCot {
  /** Thứ tự mọi cột (key). */
  order: string[];
  selected: string[];
}

function docDaLuu(storageKey: string): TrangThaiCot | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const v = JSON.parse(raw) as TrangThaiCot;
    return Array.isArray(v.order) && Array.isArray(v.selected) ? v : null;
  } catch {
    return null;
  }
}

function macDinh(columns: ExportColumn[], visibleColumnKeys?: string[]): TrangThaiCot {
  const all = columns.map((c) => c.key);
  let selected = all;
  if (visibleColumnKeys && visibleColumnKeys.length > 0) {
    const allowed = new Set(all);
    const picked = visibleColumnKeys.filter((k) => allowed.has(k));
    if (picked.length > 0) selected = picked;
  }
  return { order: all, selected };
}

/**
 * Lựa chọn đã lưu khớp lại với danh sách cột hiện tại: cột đã bỏ khỏi module thì
 * rơi ra, cột mới thêm nối cuối và được chọn sẵn (người dùng chưa từng bỏ nó).
 */
function hopNhat(columns: ExportColumn[], saved: TrangThaiCot): TrangThaiCot {
  const all = columns.map((c) => c.key);
  const allowed = new Set(all);
  const order = saved.order.filter((k) => allowed.has(k));
  const daBiet = new Set(order);
  const moi = all.filter((k) => !daBiet.has(k));
  const selected = [...saved.selected.filter((k) => allowed.has(k)), ...moi];
  return { order: [...order, ...moi], selected: selected.length > 0 ? selected : all };
}

/** Chọn + sắp cột xuất, nhớ theo `export:<fileName>` trong localStorage. */
export function useCotXuat(columns: ExportColumn[], fileName: string, visibleColumnKeys?: string[]) {
  const storageKey = `export:${fileName}`;
  const [state, setState] = useState<TrangThaiCot>(() => {
    const saved = docDaLuu(storageKey);
    return saved ? hopNhat(columns, saved) : macDinh(columns, visibleColumnKeys);
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* private mode — bỏ qua */
    }
  }, [storageKey, state]);

  const byKey = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);
  const ordered = useMemo(
    () => state.order.map((k) => byKey.get(k)).filter((c): c is ExportColumn => !!c),
    [state.order, byKey],
  );
  const selectedSet = useMemo(() => new Set(state.selected), [state.selected]);
  /** Cột sẽ xuất — theo thứ tự đã sắp. */
  const exportCols = useMemo(() => ordered.filter((c) => selectedSet.has(c.key)), [ordered, selectedSet]);

  const toggle = useCallback((key: string) => {
    setState((s) => {
      if (s.selected.includes(key)) {
        if (s.selected.length <= 1) return s; // giữ ít nhất 1 cột
        return { ...s, selected: s.selected.filter((k) => k !== key) };
      }
      return { ...s, selected: [...s.selected, key] };
    });
  }, []);

  const toggleAll = useCallback(() => {
    setState((s) =>
      s.selected.length === s.order.length
        ? { ...s, selected: s.order.slice(0, 1) }
        : { ...s, selected: [...s.order] },
    );
  }, []);

  const move = useCallback((from: number, to: number) => {
    setState((s) => {
      const order = [...s.order];
      const [k] = order.splice(from, 1);
      order.splice(to, 0, k);
      return { ...s, order };
    });
  }, []);

  const reset = useCallback(() => setState(macDinh(columns, visibleColumnKeys)), [columns, visibleColumnKeys]);

  return { ordered, selectedSet, exportCols, toggle, toggleAll, move, reset };
}
