/** Giá trị trạng thái phiếu kho phân thuốc – lưu thẳng text trong DB. */
import type { TrangThaiPhieuKhoPT } from './types';

export const TRANG_THAI_PT_CHO_DUYET = 'Chờ duyệt';
export const TRANG_THAI_PT_DA_DUYET = 'Đã duyệt';
export const TRANG_THAI_PT_KHONG_DUYET = 'Không duyệt';

/** Trạng thái đích của thao tác duyệt (không quay lại được "Chờ duyệt"). */
export const TRANG_THAI_PT_DICH_DUYET: TrangThaiPhieuKhoPT[] = [
  TRANG_THAI_PT_DA_DUYET,
  TRANG_THAI_PT_KHONG_DUYET,
];

/** Phiếu còn chờ quyết định duyệt. */
export function isTrangThaiPTChoPheDuyet(trangThai: string): boolean {
  return trangThai === TRANG_THAI_PT_CHO_DUYET;
}

/** Đã có quyết định duyệt/từ chối — đổi lại phải làm lẻ ở drawer chi tiết. */
export function isTrangThaiPTDaQuyetDinh(trangThai: string): boolean {
  return trangThai === TRANG_THAI_PT_DA_DUYET || trangThai === TRANG_THAI_PT_KHONG_DUYET;
}

/**
 * Duyệt hàng loạt: chỉ áp cho phiếu còn chờ duyệt.
 * Phiếu đã có quyết định bị loại khỏi lô để tránh đổi nhầm cả loạt.
 */
export function canBulkApprovePhieuKhoPT(trangThai: string, canApprove: boolean): boolean {
  if (!canApprove) return false;
  return isTrangThaiPTChoPheDuyet(trangThai);
}

/** i18n key suffix cho trạng thái (phieuKhoPhanThuoc.status.*). */
export function trangThaiPTToI18nKey(trangThai: string): string {
  if (trangThai === TRANG_THAI_PT_DA_DUYET) return 'approved';
  if (trangThai === TRANG_THAI_PT_KHONG_DUYET) return 'rejected';
  return 'pending';
}
