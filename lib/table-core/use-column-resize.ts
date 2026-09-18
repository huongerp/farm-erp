import { useCallback, useEffect, useRef, useState } from 'react';

import { clampColumnWidth, type ColumnConfig, resolveColumnWidth } from '../../store/createGenericStore';

import { measureColumnContentWidth } from './column-autofit';

/** Bước đổi bề rộng cột bằng phím mũi tên (px); giữ Shift để nhảy nhanh. */
export const RESIZE_KEY_STEP = 16;
export const RESIZE_KEY_STEP_LARGE = 64;

/** Bề rộng hiện tại của cột: ưu tiên DOM (đã tính cả co giãn) rồi mới tới config. */
function currentWidthOf(th: HTMLElement | null, col: ColumnConfig): number {
  return th?.offsetWidth ?? resolveColumnWidth(col);
}

/**
 * Logic kéo/thu cột dùng chung cho `GenericTable` và `HierarchyTable`.
 *
 * - Pointer event, không phải mouse ⇒ chạy cả trên tablet/bút cảm ứng.
 * - RAF-throttle để không re-render toàn bảng mỗi pixel.
 * - Kẹp bề rộng ngay khi kéo bằng `clampColumnWidth` ⇒ số px hiển thị đúng bằng
 *   bề rộng store áp dụng, không "kéo tiếp mà cột đứng yên".
 */
export function useColumnResize(col: ColumnConfig, onResizeColumn?: (id: string, width: number) => void) {
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [dragWidth, setDragWidth] = useState<number | null>(null);

  // Con trỏ nhả ngoài cửa sổ / component unmount giữa lúc kéo: vẫn phải gỡ listener
  // và trả lại con trỏ + selection cho body.
  useEffect(() => () => cleanupRef.current?.(), []);

  const start = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!onResizeColumn) return;
      e.preventDefault();
      e.stopPropagation();

      const startW = currentWidthOf(e.currentTarget.parentElement, col);
      dragRef.current = { startX: e.clientX, startW };
      setDragWidth(startW);

      const flush = (width: number) => {
        rafRef.current = null;
        if (!dragRef.current) return;
        onResizeColumn(col.id, width);
        setDragWidth(width);
      };
      const onMove = (ev: PointerEvent) => {
        if (!dragRef.current) return;
        const next = clampColumnWidth(col, dragRef.current.startW + (ev.clientX - dragRef.current.startX));
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => flush(next));
      };
      const stop = () => {
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        dragRef.current = null;
        cleanupRef.current = null;
        setDragWidth(null);
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', stop);
        document.removeEventListener('pointercancel', stop);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      cleanupRef.current = stop;
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', stop);
      document.addEventListener('pointercancel', stop);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [col, onResizeColumn]
  );

  /** Mũi tên trái/phải khi vạch kéo đang focus (a11y cho `role="separator"`). */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (!onResizeColumn) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const step = e.shiftKey ? RESIZE_KEY_STEP_LARGE : RESIZE_KEY_STEP;
      const delta = e.key === 'ArrowLeft' ? -step : step;
      onResizeColumn(col.id, clampColumnWidth(col, currentWidthOf(e.currentTarget.parentElement, col) + delta));
    },
    [col, onResizeColumn]
  );

  /** Nhấp đúp vạch kéo: co/giãn cột vừa đúng nội dung đang hiển thị (thói quen Excel). */
  const autoFit = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!onResizeColumn) return;
      e.preventDefault();
      e.stopPropagation();
      const th = e.currentTarget.parentElement as HTMLTableCellElement | null;
      if (!th) return;
      const measured = measureColumnContentWidth(th);
      if (measured == null) return;
      onResizeColumn(col.id, clampColumnWidth(col, measured));
    },
    [col, onResizeColumn]
  );

  return { isResizing: dragWidth != null, dragWidth, start, onKeyDown, autoFit };
}
