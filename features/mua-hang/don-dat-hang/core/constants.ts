import {
  TRANG_THAI_NHAP,
  TRANG_THAI_CHO_DUYET,
  TRANG_THAI_DA_GUI,
  TRANG_THAI_DA_XAC_NHAN,
  TRANG_THAI_DANG_GIAO,
  TRANG_THAI_DA_NHAN_DU,
  TRANG_THAI_DA_DONG,
  TRANG_THAI_HUY,
  type DonDatHangTrangThai,
} from './types';

/** Danh sách trạng thái (text) – dùng cho filter, form, hiển thị. */
export const TRANG_THAI_DON_DAT_HANG = [
  TRANG_THAI_NHAP,
  TRANG_THAI_CHO_DUYET,
  TRANG_THAI_DA_GUI,
  TRANG_THAI_DA_XAC_NHAN,
  TRANG_THAI_DANG_GIAO,
  TRANG_THAI_DA_NHAN_DU,
  TRANG_THAI_DA_DONG,
  TRANG_THAI_HUY,
] as const;

/** Map trạng thái (text) -> key locale (donDatHang.status.*) */
export const TRANG_THAI_KEY: Record<DonDatHangTrangThai, string> = {
  [TRANG_THAI_NHAP]: 'draft',
  [TRANG_THAI_CHO_DUYET]: 'pending',
  [TRANG_THAI_DA_GUI]: 'sent',
  [TRANG_THAI_DA_XAC_NHAN]: 'confirmed',
  [TRANG_THAI_DANG_GIAO]: 'delivering',
  [TRANG_THAI_DA_NHAN_DU]: 'received',
  [TRANG_THAI_DA_DONG]: 'closed',
  [TRANG_THAI_HUY]: 'cancelled',
};
