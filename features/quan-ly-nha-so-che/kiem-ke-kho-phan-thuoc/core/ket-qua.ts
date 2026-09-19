/**
 * Logic thuần của kiểm kê: so sánh sổ vs thực tế, tính lệch, điều kiện điều chỉnh.
 *
 * Tách khỏi service để test được mà không chạm PostgREST. Module
 * `features/kho-van/kiem-ke-kho` có bản tương đương nhưng gắn kiểu dữ liệu riêng;
 * gộp hai bên về một `lib/kiem-ke-core.ts` chỉ nên làm khi có module kiểm kê thứ ba.
 */
import type { KetQuaKiemKePT, TrangThaiDotKiemKePT } from './types';

/** Dòng tối thiểu cần để tính — nhận được cả bản đầy đủ lẫn bản rút gọn. */
export interface DongKiemKeLike {
  so_luong_so: number;
  so_luong_thuc_te?: number | null;
  id_phieu_kho_dieu_chinh?: string | null;
  ket_qua?: KetQuaKiemKePT;
}

/** Chưa nhập thực tế = `chua_kiem`; sổ 0 và thực tế 0 vẫn là `khop`. */
export function computeKetQuaKiemKePT(
  soLuongSo: number,
  soLuongThucTe: number | null | undefined
): KetQuaKiemKePT {
  if (soLuongThucTe == null) return 'chua_kiem';
  if (soLuongSo === soLuongThucTe) return 'khop';
  return soLuongThucTe < soLuongSo ? 'thieu' : 'thua';
}

/** Lệch = thực tế − sổ; `null` khi chưa nhập thực tế. */
export function getLechKiemKePT(dong: DongKiemKeLike): number | null {
  return dong.so_luong_thuc_te == null ? null : dong.so_luong_thuc_te - dong.so_luong_so;
}

/** Dòng còn điều chỉnh được: đợt đang kiểm kê, đã nhập thực tế, có lệch, chưa sinh phiếu. */
export function rowCanDieuChinhPT(dong: DongKiemKeLike, trangThaiDot: TrangThaiDotKiemKePT): boolean {
  if (trangThaiDot !== 'dang_kiem_ke') return false;
  if (dong.id_phieu_kho_dieu_chinh) return false;
  const lech = getLechKiemKePT(dong);
  return lech != null && lech !== 0;
}

/** Số dòng đang chờ điều chỉnh tồn — dùng cho nút "Điều chỉnh toàn đợt". */
export function countPendingDieuChinhPT(
  dongs: DongKiemKeLike[],
  trangThaiDot: TrangThaiDotKiemKePT
): number {
  return dongs.filter((d) => rowCanDieuChinhPT(d, trangThaiDot)).length;
}

export interface ChiTietKiemKePTStats {
  total: number;
  khop: number;
  thieu: number;
  thua: number;
  chuaKiem: number;
}

/** Đếm theo kết quả — một lượt duyệt thay vì bốn lần filter. */
export function getChiTietKiemKePTStats(dongs: { ket_qua: KetQuaKiemKePT }[]): ChiTietKiemKePTStats {
  const stats: ChiTietKiemKePTStats = { total: dongs.length, khop: 0, thieu: 0, thua: 0, chuaKiem: 0 };
  for (const d of dongs) {
    if (d.ket_qua === 'khop') stats.khop += 1;
    else if (d.ket_qua === 'thieu') stats.thieu += 1;
    else if (d.ket_qua === 'thua') stats.thua += 1;
    else stats.chuaKiem += 1;
  }
  return stats;
}
