/** Giá trị trạng thái phiếu đề xuất vật tư – lưu thẳng text trong DB */

export const TRANG_THAI_CHO_DUYET = 'Chờ duyệt';
export const TRANG_THAI_DOI_DUYET = 'Đợi duyệt';
export const TRANG_THAI_DA_DUYET = 'Đã duyệt';
export const TRANG_THAI_KHONG_DUYET = 'Không duyệt';

export const TRANG_THAI_PHIEU_DE_XUAT_VAT_TU = [
  TRANG_THAI_CHO_DUYET,
  TRANG_THAI_DOI_DUYET,
  TRANG_THAI_DA_DUYET,
  TRANG_THAI_KHONG_DUYET,
] as const;

export type TrangThaiPhieuDeXuatVatTu = (typeof TRANG_THAI_PHIEU_DE_XUAT_VAT_TU)[number];

/** Key dùng cho bộ lọc (toolbar, thống kê) */
export type TrangThaiFilterKey = 'Pending' | 'Waiting' | 'Approved' | 'Rejected';

export function trangThaiToFilterKey(trangThai: string): TrangThaiFilterKey {
  if (trangThai === TRANG_THAI_CHO_DUYET) return 'Pending';
  if (trangThai === TRANG_THAI_DOI_DUYET) return 'Waiting';
  if (trangThai === TRANG_THAI_DA_DUYET) return 'Approved';
  if (trangThai === TRANG_THAI_KHONG_DUYET) return 'Rejected';
  return 'Pending';
}

export function filterKeyToTrangThai(key: TrangThaiFilterKey): TrangThaiPhieuDeXuatVatTu {
  if (key === 'Pending') return TRANG_THAI_CHO_DUYET;
  if (key === 'Waiting') return TRANG_THAI_DOI_DUYET;
  if (key === 'Approved') return TRANG_THAI_DA_DUYET;
  return TRANG_THAI_KHONG_DUYET;
}

/** Phiếu còn trong luồng phê duyệt (hiện nút / popup phê duyệt). */
export function isTrangThaiChoPheDuyet(trangThai: string): boolean {
  return trangThai === TRANG_THAI_CHO_DUYET || trangThai === TRANG_THAI_DOI_DUYET;
}

/** i18n key suffix cho trạng thái phiếu (phieuDeXuatVatTu.status.*). */
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

/** Các nhãn tiến độ MH dùng cho chip lọc khi không có đủ dòng trên một trang server. */
export const TIEN_DO_MH_KNOWN_LABELS = [
  'Chưa mua',
  'Đã mua',
  'Trích quỹ',
  'Điều chuyển',
  'Đang xử lý',
  'Trao đổi',
  'Từ chối',
  'VP điều về',
] as const;

/** Màu badge cho tiến độ mua hàng (list + detail tab Chi tiết) */
const TIEN_DO_MH_COLORS: Record<string, string> = {
  'Chưa mua': 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
  'Đã mua': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  'Trích quỹ': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  'Điều chuyển': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
  'Đang xử lý': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  'Trao đổi': 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
  'Từ chối': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  'VP điều về': 'bg-primary/10 text-primary border-primary/20',
};

export function getTienDoMhBadgeClass(tenTienDo: string | null | undefined): string {
  if (!tenTienDo?.trim()) return 'bg-muted text-muted-foreground border-border';
  return TIEN_DO_MH_COLORS[tenTienDo.trim()] ?? 'bg-muted text-muted-foreground border-border';
}

/**
 * Duyệt hàng loạt: chỉ áp cho phiếu còn trong luồng duyệt (Chờ / Đợi duyệt).
 * Phiếu đã có quyết định phải đổi lẻ ở drawer chi tiết.
 */
export function canBulkApprovePhieuDeXuat(trangThai: string, canApprove: boolean): boolean {
  if (!canApprove) return false;
  return isTrangThaiChoPheDuyet(trangThai);
}
