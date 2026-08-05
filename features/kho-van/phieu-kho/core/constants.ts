/** Giá trị trạng thái phiếu kho – lưu thẳng text trong DB */

export const TRANG_THAI_CHO_DUYET = 'Chờ duyệt';
export const TRANG_THAI_DOI_DUYET = 'Đợi duyệt';
export const TRANG_THAI_DA_DUYET = 'Đã duyệt';
export const TRANG_THAI_KHONG_DUYET = 'Không duyệt';

export const TRANG_THAI_PHIEU_KHO_VALUES = [
  TRANG_THAI_CHO_DUYET,
  TRANG_THAI_DOI_DUYET,
  TRANG_THAI_DA_DUYET,
  TRANG_THAI_KHONG_DUYET,
] as const;

export type TrangThaiPhieuKhoValue = (typeof TRANG_THAI_PHIEU_KHO_VALUES)[number];

/** Key dùng cho bộ lọc (toolbar) */
export type TrangThaiFilterKey = 'Pending' | 'Waiting' | 'Approved' | 'Rejected';

export function trangThaiToFilterKey(trangThai: string): TrangThaiFilterKey {
  if (trangThai === TRANG_THAI_CHO_DUYET) return 'Pending';
  if (trangThai === TRANG_THAI_DOI_DUYET) return 'Waiting';
  if (trangThai === TRANG_THAI_DA_DUYET) return 'Approved';
  if (trangThai === TRANG_THAI_KHONG_DUYET) return 'Rejected';
  return 'Pending';
}

export function filterKeyToTrangThai(key: TrangThaiFilterKey): TrangThaiPhieuKhoValue {
  if (key === 'Pending') return TRANG_THAI_CHO_DUYET;
  if (key === 'Waiting') return TRANG_THAI_DOI_DUYET;
  if (key === 'Approved') return TRANG_THAI_DA_DUYET;
  return TRANG_THAI_KHONG_DUYET;
}

/** Phiếu còn trong luồng phê duyệt ban đầu (Chờ / Đợi duyệt). */
export function isTrangThaiChoPheDuyet(trangThai: string): boolean {
  return trangThai === TRANG_THAI_CHO_DUYET || trangThai === TRANG_THAI_DOI_DUYET;
}

/** Đã có quyết định duyệt/từ chối — đổi lại cần ghi chú + xác nhận. */
export function isTrangThaiDaQuyetDinh(trangThai: string): boolean {
  return trangThai === TRANG_THAI_DA_DUYET || trangThai === TRANG_THAI_KHONG_DUYET;
}

export function isTrangThaiDaDuyet(trangThai: string): boolean {
  return trangThai === TRANG_THAI_DA_DUYET;
}

/** Sửa/xoá: chưa duyệt → đủ CRUD; đã duyệt → cần thêm quyền duyệt/quan_tri. */
export function canMutatePhieuKhoByTrangThai(
  trangThai: string,
  moduleAllowed: boolean,
  canBypassApproved: boolean
): boolean {
  if (!moduleAllowed) return false;
  if (isTrangThaiDaDuyet(trangThai)) return canBypassApproved;
  return true;
}

/** i18n key suffix cho trạng thái phiếu (phieuKho.status.*). */
export function trangThaiToI18nKey(trangThai: string): string {
  if (trangThai === TRANG_THAI_CHO_DUYET) return 'pending';
  if (trangThai === TRANG_THAI_DOI_DUYET) return 'waiting';
  if (trangThai === TRANG_THAI_DA_DUYET) return 'approved';
  if (trangThai === TRANG_THAI_KHONG_DUYET) return 'rejected';
  return 'pending';
}

/** Class badge trạng thái phiếu (list + detail). */
export function getTrangThaiPhieuBadgeClass(trangThai: string | null | undefined): string {
  if (trangThai === TRANG_THAI_DA_DUYET) {
    return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
  }
  if (trangThai === TRANG_THAI_CHO_DUYET) {
    return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
  }
  if (trangThai === TRANG_THAI_DOI_DUYET) {
    return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20';
  }
  if (trangThai === TRANG_THAI_KHONG_DUYET) {
    return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
  }
  return 'bg-muted text-muted-foreground border-border';
}
