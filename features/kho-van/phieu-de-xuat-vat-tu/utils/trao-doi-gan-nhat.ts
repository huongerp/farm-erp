/**
 * Trường `trao_doi` của dòng chi tiết là log nhiều dòng, dòng mới append xuống cuối:
 * `[2026-09-17T07:30:00.000Z] Chuyển tiến độ sang: X. Ngày cần: Y. Ghi chú: Z`
 * Hàm dưới bóc dòng cuối cùng để hiện ra listview.
 */
export interface TraoDoiGanNhat {
  /** Timestamp trong ngoặc vuông đầu dòng; null khi dòng không có timestamp hợp lệ. */
  timestamp: string | null;
  /** Phần nội dung sau timestamp (hoặc cả dòng nếu không có timestamp). */
  noiDung: string;
}

const LINE_WITH_TIMESTAMP = /^\[([^\]]+)\]\s*([\s\S]*)$/;

/** Lấy dòng trao đổi gần nhất (dòng cuối có nội dung). Trả null nếu log rỗng. */
export function parseTraoDoiGanNhat(traoDoi: string | null | undefined): TraoDoiGanNhat | null {
  if (traoDoi == null) return null;
  const lines = traoDoi.split('\n');
  let lastLine = '';
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i].trim();
    if (line !== '') {
      lastLine = line;
      break;
    }
  }
  if (lastLine === '') return null;

  const matched = LINE_WITH_TIMESTAMP.exec(lastLine);
  if (matched) {
    const raw = matched[1].trim();
    const noiDung = matched[2].trim();
    if (!Number.isNaN(Date.parse(raw))) return { timestamp: raw, noiDung };
  }
  return { timestamp: null, noiDung: lastLine };
}
