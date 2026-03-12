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
