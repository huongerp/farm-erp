import type { MauChecklist } from './types';

/** Dòng danh sách mẫu — kèm số mục / hạng mục (embed đếm ở DB). */
export interface MauChecklistListItem extends MauChecklist {
  so_muc: number;
  so_hang_muc: number;
}

/** Thiết bị bảo dưỡng — chỉ đọc, chọn cho id_thiet_bi của hạng mục. */
export interface ThietBiBaoDuong {
  id: string;
  ten: string;
  ma_ts: string | null;
  so_luong: string | null;
  khu_vuc: string | null;
  dang_dung: boolean;
  thu_tu: number;
}
