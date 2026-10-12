/**
 * Trường `trao_doi` của dòng chi tiết là log nhiều mục, mục mới append xuống cuối
 * (định dạng ở `lib/trao-doi-log.ts`). Hàm dưới lấy mục cuối để hiện ra listview.
 */
import { tachTraoDoi } from '../../../../lib/trao-doi-log';

export interface TraoDoiGanNhat {
  /** Thời điểm trong ngoặc vuông đầu mục (ISO hoặc dd/mm/yyyy HH:mm); null khi mục không có thời điểm. */
  timestamp: string | null;
  /** Nội dung mục (có thể nhiều dòng). */
  noiDung: string;
}

/** Lấy mục trao đổi gần nhất (mục cuối, kể cả tin nhiều dòng). Trả null nếu log rỗng. */
export function parseTraoDoiGanNhat(traoDoi: string | null | undefined): TraoDoiGanNhat | null {
  const muc = tachTraoDoi(traoDoi);
  const cuoi = muc[muc.length - 1];
  return cuoi ? { timestamp: cuoi.thoiDiem, noiDung: cuoi.noiDung } : null;
}
