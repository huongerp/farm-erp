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

/**
 * Class badge theo trạng thái — dùng chung cho DonDatHangList, ChiTietDonDatHangTab,
 * DonDatHangDetail (trước đây copy 3 bản giống nhau ở từng file).
 * 'Đã nhận đủ' và 'Đã đóng' tách màu riêng (trước đây cùng emerald, không phân biệt được).
 */
export const STATUS_VARIANTS: Record<string, string> = {
  [TRANG_THAI_NHAP]: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  [TRANG_THAI_CHO_DUYET]: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  [TRANG_THAI_DA_GUI]: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  [TRANG_THAI_DA_XAC_NHAN]: 'bg-primary/10 text-primary border-primary/20',
  [TRANG_THAI_DANG_GIAO]: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  [TRANG_THAI_DA_NHAN_DU]: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  [TRANG_THAI_DA_DONG]: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  [TRANG_THAI_HUY]: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};
