import type { LoaiThuChi, ThuChiNguon } from './types';

/** Số bản ghi mỗi trang (đọc server-side qua view summary). */
export const PAGE_SIZE = 50;

export const LOAI_THU_CHI: readonly LoaiThuChi[] = ['thu', 'chi'] as const;

export const NGUON_CHUNG_TU: readonly ThuChiNguon[] = [
  'don_dat_hang',
  'de_xuat_mua_hang',
  'chi_phi_tai_san',
] as const;

/** Tiền tố số phiếu — server chỉ trả số thứ tự, app tự pad. */
export const SO_PHIEU_TIEN_TO: Record<LoaiThuChi, string> = {
  thu: 'PT-',
  chi: 'PC-',
};
export const SO_PHIEU_DO_DAI = 4;

/** Ghép số phiếu từ số thứ tự server trả về: (1, 'thu') → "PT-0001". */
export function buildSoPhieu(next: number, loai: LoaiThuChi): string {
  return `${SO_PHIEU_TIEN_TO[loai]}${String(next).padStart(SO_PHIEU_DO_DAI, '0')}`;
}

export function loaiThuChiToI18nKey(loai: LoaiThuChi): string {
  return `thuChiQuy.loai.${loai}`;
}

export function nguonChungTuToI18nKey(nguon: ThuChiNguon): string {
  return `thuChiQuy.nguon.${nguon}`;
}

/**
 * Nhãn đầy đủ kèm tên submenu ("Mua hàng / Đơn đặt hàng") — dùng ở combobox chọn
 * module trong form, nơi cần phân biệt rõ phiếu thuộc nhóm nghiệp vụ nào.
 * Bảng danh sách vẫn dùng nhãn ngắn để khỏi tràn cột.
 */
export function nguonChungTuFullI18nKey(nguon: ThuChiNguon): string {
  return `thuChiQuy.nguonDayDu.${nguon}`;
}

/** Đường dẫn module nguồn để mở phiếu gốc từ phiếu quỹ. */
export const NGUON_CHUNG_TU_PATH: Record<ThuChiNguon, string> = {
  don_dat_hang: '/mua-hang/don-dat-hang',
  de_xuat_mua_hang: '/quan-ly-farm/de-xuat-mua-hang',
  chi_phi_tai_san: '/hanh-chinh/chi-phi-tai-san',
};

/** Badge màu theo loại phiếu (thu = xanh, chi = đỏ). */
export function getLoaiBadgeClass(loai: LoaiThuChi): string {
  return loai === 'thu'
    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
    : 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400';
}
