import { useCallback, useEffect, useRef, useState } from 'react';

import { measureColumnContentWidth } from './column-autofit';

/**
 * Tự đo bề rộng nội dung của từng cột MỘT LẦN khi dữ liệu đầu tiên hiển thị, để
 * cột "dãn vừa nội dung thật" thay vì chỉ dựa preset đoán trước.
 *
 * - Đo một lần mỗi cột — chuyển trang/lọc KHÔNG đo lại (bảng không nhảy layout).
 *   Cột được bật hiện sau (qua Tuỳ chọn cột) sẽ được đo bổ sung khi mount.
 * - Kết quả đo KHÔNG lưu lại — mỗi phiên mở bảng đo lại theo dữ liệu lúc đó.
 * - Kéo tay thắng: hook chỉ trả số đo; `resolveAutoFitWidth` mới quyết định ưu
 *   tiên (`width` do user kéo > số đo > preset).
 */
export function useAutoFitColumns(dataReady: boolean, columnsKey: string) {
  const thRefs = useRef(new Map<string, HTMLTableCellElement>());
  /** Cột đã đo xong — không đo lại dù effect chạy tiếp (đổi trang, bật cột khác). */
  const measuredIds = useRef(new Set<string>());
  const [autoWidths, setAutoWidths] = useState<ReadonlyMap<string, number>>(() => new Map());

  const setHeaderCellRef = useCallback((id: string, el: HTMLTableCellElement | null) => {
    if (el) thRefs.current.set(id, el);
    else thRefs.current.delete(id);
  }, []);

  useEffect(() => {
    if (!dataReady) return;
    // rAF: đo sau khi trình duyệt layout xong hàng dữ liệu vừa commit.
    const raf = requestAnimationFrame(() => {
      const fresh = new Map<string, number>();
      for (const [id, th] of thRefs.current) {
        if (measuredIds.current.has(id)) continue;
        const width = measureColumnContentWidth(th);
        // null/0: bảng đang ẩn (mobile vẽ thẻ) hoặc chưa gắn DOM — để lần sau đo lại.
        if (width != null && width > 0) {
          measuredIds.current.add(id);
          fresh.set(id, width);
        }
      }
      if (fresh.size === 0) return;
      setAutoWidths((prev) => {
        const next = new Map(prev);
        for (const [id, width] of fresh) next.set(id, width);
        return next;
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [dataReady, columnsKey]);

  return { autoWidths, setHeaderCellRef };
}
