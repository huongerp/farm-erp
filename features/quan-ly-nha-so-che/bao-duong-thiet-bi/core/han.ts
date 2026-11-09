/**
 * Hạn bảo dưỡng — khớp trigger fn_farm_bd_tinh_han (migration 073):
 * - chu kỳ null → không có hạn;
 * - đã làm ít nhất một lần → hạn = lần gần nhất + chu kỳ;
 * - chưa làm lần nào → giữ ngày người dùng nhập (ngày bắt đầu), có thể null.
 */
import type { StatusBadgeSemantic } from '../../../../lib/status-badge';
import { congNgay } from '../../danh-gia-dau-vao/core/tuan';

/** Số ngày trước hạn coi là "sắp tới hạn". */
export const NGUONG_SAP_TOI_HAN = 7;

export function hanKeTiep(lanGanNhat: string | null, chuKyNgay: number | null, hanNhap: string | null): string | null {
  if (chuKyNgay == null) return null;
  if (lanGanNhat) return congNgay(lanGanNhat, chuKyNgay);
  return hanNhap;
}

const MOT_NGAY = 86_400_000;

function msTuYmd(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Số ngày từ hôm nay tới hạn (âm = đã quá hạn). */
export function soNgayConLai(han: string, homNay: string): number {
  return Math.round((msTuYmd(han) - msTuYmd(homNay)) / MOT_NGAY);
}

export const TINH_TRANG_HAN = ['qua_han', 'sap_toi', 'con_han', 'chua_len_lich'] as const;
export type TinhTrangHan = (typeof TINH_TRANG_HAN)[number];

export const TINH_TRANG_HAN_SEMANTIC: Record<TinhTrangHan, StatusBadgeSemantic> = {
  qua_han: 'rejected',
  sap_toi: 'pending',
  con_han: 'success',
  chua_len_lich: 'neutral',
};

/** Đúng ngày hạn tính là "sắp tới" (vẫn còn làm kịp trong ngày), qua ngày hạn mới là quá hạn. */
export function tinhTrangHan(han: string | null, homNay: string, nguong = NGUONG_SAP_TOI_HAN): TinhTrangHan {
  if (!han) return 'chua_len_lich';
  const con = soNgayConLai(han, homNay);
  if (con < 0) return 'qua_han';
  if (con <= nguong) return 'sap_toi';
  return 'con_han';
}

/** Thứ tự ưu tiên hiển thị: quá hạn → sắp tới → còn hạn → chưa lên lịch. */
export function soSanhTheoHan(
  a: { han_ke_tiep: string | null },
  b: { han_ke_tiep: string | null }
): number {
  if (a.han_ke_tiep === b.han_ke_tiep) return 0;
  if (!a.han_ke_tiep) return 1;
  if (!b.han_ke_tiep) return -1;
  return a.han_ke_tiep < b.han_ke_tiep ? -1 : 1;
}
