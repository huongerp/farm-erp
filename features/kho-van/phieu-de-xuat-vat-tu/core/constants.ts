/** Giá trị trạng thái phiếu đề xuất vật tư – lưu thẳng text trong DB */

export const TRANG_THAI_CHO_DUYET = 'Chờ duyệt';
export const TRANG_THAI_DA_DUYET = 'Đã duyệt';
export const TRANG_THAI_KHONG_DUYET = 'Không duyệt';

export const TRANG_THAI_PHIEU_DE_XUAT_VAT_TU = [
  TRANG_THAI_CHO_DUYET,
  TRANG_THAI_DA_DUYET,
  TRANG_THAI_KHONG_DUYET,
] as const;

export type TrangThaiPhieuDeXuatVatTu = (typeof TRANG_THAI_PHIEU_DE_XUAT_VAT_TU)[number];

/** Key dùng cho bộ lọc (toolbar, thống kê) */
export type TrangThaiFilterKey = 'Pending' | 'Approved' | 'Rejected';

export function trangThaiToFilterKey(trangThai: string): TrangThaiFilterKey {
  if (trangThai === TRANG_THAI_CHO_DUYET) return 'Pending';
  if (trangThai === TRANG_THAI_DA_DUYET) return 'Approved';
  if (trangThai === TRANG_THAI_KHONG_DUYET) return 'Rejected';
  return 'Pending';
}

export function filterKeyToTrangThai(key: TrangThaiFilterKey): TrangThaiPhieuDeXuatVatTu {
  if (key === 'Pending') return TRANG_THAI_CHO_DUYET;
  if (key === 'Approved') return TRANG_THAI_DA_DUYET;
  return TRANG_THAI_KHONG_DUYET;
}

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
