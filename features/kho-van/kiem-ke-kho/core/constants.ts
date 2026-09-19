import type { TrangThaiDotKiemKeKho, KetQuaKiemKeKho } from './types';
import type { TFunction } from 'i18next';
import type { StatusBadgeSemantic } from '../../../../lib/status-badge';

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

/**
 * Màu badge lấy từ `lib/status-badge.ts` (bảng màu chung theo semantic), không
 * pha màu Tailwind trực tiếp trong component — xem docs/UI-CONVENTIONS.md §4.
 */
export const TRANG_THAI_DOT_SEMANTIC: Record<TrangThaiDotKiemKeKho, StatusBadgeSemantic> = {
  draft: 'neutral',
  dang_kiem_ke: 'pending',
  hoan_thanh: 'success',
};

export const KET_QUA_SEMANTIC: Record<KetQuaKiemKeKho, StatusBadgeSemantic> = {
  chua_kiem: 'neutral',
  khop: 'success',
  thieu: 'rejected',
  thua: 'warning',
};
