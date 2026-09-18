/**
 * Đo bề rộng nội dung thật của một cột để "vừa nội dung".
 *
 * Hai đường dùng:
 * - Tự động: `useAutoFitColumns` đo MỘT LẦN khi dữ liệu đầu tiên hiển thị — cột
 *   chưa kéo tay dãn theo nội dung thật thay vì chỉ theo preset đoán trước.
 * - Thủ công: nhấp đúp vào vạch kéo cột (thói quen Excel).
 *
 * Ô trong bảng đều `truncate`/`overflow-hidden`, nên bề rộng nhìn thấy KHÔNG phải
 * bề rộng nội dung. `scrollWidth` của phần tử bị cắt mới là chiều dài text thật —
 * cộng với offset trái của nó so với ô (bảng cây có indent theo cấp) ra được mép
 * phải cần thiết.
 */
import {
  type ColumnConfig,
  getEffectiveColumnResizeBounds,
  resolveColumnWidth,
} from '../../store/createGenericStore';

/**
 * Bề rộng hiệu lực của cột khi có kết quả tự đo (px).
 *
 * Thứ tự ưu tiên: kéo tay (`width`, đã lưu) thắng tuyệt đối → bề rộng đo được kẹp
 * trong [min, max] của preset → chưa đo được thì như cũ (`resolveColumnWidth`).
 */
export function resolveAutoFitWidth(col: ColumnConfig, measured: number | undefined): number {
  if (col.width != null) return col.width;
  if (measured == null) return resolveColumnWidth(col);
  const { min, max } = getEffectiveColumnResizeBounds(col);
  return Math.min(Math.max(measured, min), max);
}

/** Khoảng thở thêm sau khi đo (px) — tránh chữ chạm sát viền ô. */
const AUTOFIT_BUFFER = 8;

/**
 * Phần tử absolute/fixed (vạch kéo, dải màu trang trí) nằm ngoài luồng nội dung:
 * tính vào sẽ khiến cột không bao giờ co lại được.
 */
function isOutOfFlow(el: HTMLElement): boolean {
  if (el.closest('[data-autofit-ignore]')) return true;
  const position = getComputedStyle(el).position;
  return position === 'absolute' || position === 'fixed';
}

function measureCellContent(cell: HTMLTableCellElement): number {
  // Ép một dòng TRONG LÚC ĐO: bảng đang `table-layout: fixed` nên nội dung đã bị
  // ngắt dòng theo bề rộng hiện tại; đo nguyên trạng sẽ ra đúng bề rộng đang hẹp
  // và cột không bao giờ dãn ra được (badge "Hoạt động" nằm hai dòng mãi).
  const prevWhiteSpace = cell.style.whiteSpace;
  cell.style.whiteSpace = 'nowrap';

  try {
    const cellLeft = cell.getBoundingClientRect().left;
    const style = getComputedStyle(cell);
    const paddingRight = parseFloat(style.paddingRight || '0');

    let contentRight = 0;
    for (const el of Array.from(cell.querySelectorAll<HTMLElement>('*'))) {
      if (isOutOfFlow(el)) continue;
      const left = el.getBoundingClientRect().left - cellLeft;
      contentRight = Math.max(contentRight, left + el.scrollWidth);
    }

    // Ô chỉ có text thuần (không bọc thẻ nào): scrollWidth của chính ô đã gồm padding.
    if (contentRight === 0) return cell.scrollWidth;
    return contentRight + paddingRight;
  } finally {
    cell.style.whiteSpace = prevWhiteSpace;
  }
}

/**
 * Bề rộng vừa đủ cho cột chứa `th` (px), tính trên đúng trang đang hiển thị.
 * Trả về `null` khi không đo được (chưa gắn DOM, không tìm thấy bảng).
 */
export function measureColumnContentWidth(th: HTMLTableCellElement): number | null {
  const table = th.closest('table');
  const headerRow = th.parentElement;
  if (!table || !headerRow) return null;

  const index = Array.prototype.indexOf.call(headerRow.children, th);
  if (index < 0) return null;
  const columnCount = headerRow.children.length;

  let max = measureCellContent(th);
  for (const body of Array.from(table.tBodies)) {
    for (const row of Array.from(body.rows)) {
      // Bỏ qua hàng full-span (spacer của virtual scroll, empty state): số ô khác
      // header nên không có ô nào thuộc cột này.
      if (row.cells.length !== columnCount) continue;
      const cell = row.cells[index];
      if (cell) max = Math.max(max, measureCellContent(cell));
    }
  }

  return max > 0 ? Math.ceil(max) + AUTOFIT_BUFFER : null;
}
