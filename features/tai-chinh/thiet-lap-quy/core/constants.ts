import type { LoaiHangMuc } from './types';

/** Mã hạng mục dành riêng cho phiếu mở sổ / chuyển số dư từ sổ Excel cũ. */
export const MA_HANG_MUC_SO_DU_DAU_KY = 'SO_DU_DAU_KY';

export const LOAI_HANG_MUC: readonly LoaiHangMuc[] = ['thu', 'chi', 'ca_hai'] as const;

/** Key i18n cho nhãn loại hạng mục (thietLapQuy.hangMuc.loai.*). */
export function loaiHangMucToI18nKey(loai: LoaiHangMuc): string {
  return `thietLapQuy.hangMuc.loai.${loai}`;
}

/** Hạng mục có dùng được cho phiếu loại `loaiPhieu` hay không. */
export function hangMucDungChoLoaiPhieu(loaiHangMuc: LoaiHangMuc, loaiPhieu: 'thu' | 'chi'): boolean {
  return loaiHangMuc === 'ca_hai' || loaiHangMuc === loaiPhieu;
}
