/**
 * Tỉ lệ lỗi (%) của một thùng mẫu = số lỗi ÷ tổng số nhánh/nải trong thùng × 100.
 * Chỉ để hiển thị cạnh số lỗi — kết luận ĐẠT / KHÔNG ĐẠT vẫn xét theo ngưỡng tổng (ket-luan.ts).
 */
import type { GiaTriKetQua, TieuChi } from './types';

/** null khi tiêu chí không phải đếm lỗi hoặc thùng chưa có tổng nhánh hợp lệ. Ô trống = 0 lỗi. */
export function tiLeLoi(tc: TieuChi, soLoi: GiaTriKetQua | undefined, tongNhanh: number | null): number | null {
  if (tc.loai !== 'dem_loi') return null;
  if (tongNhanh == null || !Number.isFinite(tongNhanh) || tongNhanh <= 0) return null;
  const loi = typeof soLoi === 'number' && Number.isFinite(soLoi) ? soLoi : 0;
  return Math.round((loi / tongNhanh) * 1000) / 10;
}

/** Đọc ô "tổng số nhánh": số nguyên > 0, trả null nếu không hợp lệ. */
export function docTongNhanh(s: string): number | null {
  const t = s.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n > 0 ? n : null;
}
