/** Loại hợp đồng */
export type LoaiHopDong = 'thu-viec' | 'chinh-thuc';

/** Trạng thái hợp đồng (rút gọn) */
export type TrangThaiHopDong = 'hieu_luc' | 'het_han' | 'thanh_ly';

export function getLoaiHopDongLabel(loai: LoaiHopDong, t: (key: string) => string): string {
  return loai === 'thu-viec' ? t('hopDong.loaiThuViec') : t('hopDong.loaiChinhThuc');
}

/** CSS class badge loại HĐ: thử việc (amber), chính thức (emerald) */
export function getLoaiHopDongBadgeClass(loai: LoaiHopDong): string {
  return loai === 'thu-viec'
    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
}

const TRANG_THAI_LABEL_KEYS: Record<TrangThaiHopDong, string> = {
  hieu_luc: 'hopDong.trangThai.hieuLuc',
  het_han: 'hopDong.trangThai.hetHan',
  thanh_ly: 'hopDong.trangThai.thanhLy',
};

export function getTrangThaiHopDongLabel(trangThai: TrangThaiHopDong, t: (key: string) => string): string {
  return t(TRANG_THAI_LABEL_KEYS[trangThai] ?? 'hopDong.trangThai.hieuLuc');
}

const TRANG_THAI_BADGE_CLASS: Record<TrangThaiHopDong, string> = {
  hieu_luc: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  het_han: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
  thanh_ly: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
};

export function getTrangThaiHopDongBadgeClass(trangThai: TrangThaiHopDong): string {
  return TRANG_THAI_BADGE_CLASS[trangThai] ?? TRANG_THAI_BADGE_CLASS.hieu_luc;
}

/** Số ngày còn lại tới ngày kết thúc (có thể âm nếu đã qua). */
export function getDaysUntilEnd(ngayKetThuc: string | null | undefined): number | null {
  if (!ngayKetThuc) return null;
  const end = new Date(ngayKetThuc);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Prefix số HĐ / phiếu theo loại */
export const SO_HOP_DONG_PREFIX = {
  'thu-viec': 'HDTV',
  'chinh-thuc': 'HDCT',
} as const;
export const SO_PHIEU_THANH_LY_PREFIX = 'PTL';
