import type { TrangThaiDotKiemKeKho, KetQuaKiemKeKho } from './types';
import type { TFunction } from 'i18next';

export function getTrangThaiDotLabel(status: TrangThaiDotKiemKeKho, t: TFunction): string {
  return t(`kiemKeKho.trangThaiDot.${status}`);
}

export function getKetQuaLabel(ketQua: KetQuaKiemKeKho, t: TFunction): string {
  return t(`kiemKeKho.ketQua.${ketQua}`);
}

export const TRANG_THAI_DOT_OPTIONS: { value: TrangThaiDotKiemKeKho; labelKey: string }[] = [
  { value: 'draft', labelKey: 'kiemKeKho.trangThaiDot.draft' },
  { value: 'dang_kiem_ke', labelKey: 'kiemKeKho.trangThaiDot.dang_kiem_ke' },
  { value: 'hoan_thanh', labelKey: 'kiemKeKho.trangThaiDot.hoan_thanh' },
];

export const KET_QUA_OPTIONS: { value: KetQuaKiemKeKho; labelKey: string }[] = [
  { value: 'chua_kiem', labelKey: 'kiemKeKho.ketQua.chua_kiem' },
  { value: 'khop', labelKey: 'kiemKeKho.ketQua.khop' },
  { value: 'thieu', labelKey: 'kiemKeKho.ketQua.thieu' },
  { value: 'thua', labelKey: 'kiemKeKho.ketQua.thua' },
];
