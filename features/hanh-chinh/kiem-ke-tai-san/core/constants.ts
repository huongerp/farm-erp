import type { TrangThaiDotKiemKe, KetQuaKiemKe } from './types';
import type { TFunction } from 'i18next';

export function getTrangThaiDotLabel(status: TrangThaiDotKiemKe, t: TFunction): string {
  return t(`kiemKeTaiSan.trangThaiDot.${status}`);
}

export function getKetQuaLabel(ketQua: KetQuaKiemKe, t: TFunction): string {
  return t(`kiemKeTaiSan.ketQua.${ketQua}`);
}

export const TRANG_THAI_DOT_OPTIONS: { value: TrangThaiDotKiemKe; labelKey: string }[] = [
  { value: 'draft', labelKey: 'kiemKeTaiSan.trangThaiDot.draft' },
  { value: 'dang_kiem_ke', labelKey: 'kiemKeTaiSan.trangThaiDot.dang_kiem_ke' },
  { value: 'hoan_thanh', labelKey: 'kiemKeTaiSan.trangThaiDot.hoan_thanh' },
];

export const KET_QUA_OPTIONS: { value: KetQuaKiemKe; labelKey: string }[] = [
  { value: 'chua_kiem', labelKey: 'kiemKeTaiSan.ketQua.chua_kiem' },
  { value: 'khop', labelKey: 'kiemKeTaiSan.ketQua.khop' },
  { value: 'chenh_noi_luu', labelKey: 'kiemKeTaiSan.ketQua.chenh_noi_luu' },
  { value: 'chenh_nguoi_giu', labelKey: 'kiemKeTaiSan.ketQua.chenh_nguoi_giu' },
  { value: 'chenh_trang_thai', labelKey: 'kiemKeTaiSan.ketQua.chenh_trang_thai' },
  { value: 'thieu', labelKey: 'kiemKeTaiSan.ketQua.thieu' },
];
