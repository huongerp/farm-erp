import type { TFunction } from 'i18next';
import type { StatusBadgeSemantic } from '../../../../lib/status-badge';
import type { TrangThaiDotKiemKePT, KetQuaKiemKePT } from './types';

export function getTrangThaiDotLabelPT(status: TrangThaiDotKiemKePT, t: TFunction): string {
  return t(`kiemKeKhoPT.trangThaiDot.${status}`);
}

export function getKetQuaLabelPT(ketQua: KetQuaKiemKePT, t: TFunction): string {
  return t(`kiemKeKhoPT.ketQua.${ketQua}`);
}

export const TRANG_THAI_DOT_OPTIONS_PT: { value: TrangThaiDotKiemKePT; labelKey: string }[] = [
  { value: 'draft', labelKey: 'kiemKeKhoPT.trangThaiDot.draft' },
  { value: 'dang_kiem_ke', labelKey: 'kiemKeKhoPT.trangThaiDot.dang_kiem_ke' },
  { value: 'hoan_thanh', labelKey: 'kiemKeKhoPT.trangThaiDot.hoan_thanh' },
];

export const KET_QUA_OPTIONS_PT: { value: KetQuaKiemKePT; labelKey: string }[] = [
  { value: 'chua_kiem', labelKey: 'kiemKeKhoPT.ketQua.chua_kiem' },
  { value: 'khop', labelKey: 'kiemKeKhoPT.ketQua.khop' },
  { value: 'thieu', labelKey: 'kiemKeKhoPT.ketQua.thieu' },
  { value: 'thua', labelKey: 'kiemKeKhoPT.ketQua.thua' },
];

/** Màu badge lấy từ `lib/status-badge.ts` — xem docs/UI-CONVENTIONS.md §4. */
export const TRANG_THAI_DOT_SEMANTIC_PT: Record<TrangThaiDotKiemKePT, StatusBadgeSemantic> = {
  draft: 'neutral',
  dang_kiem_ke: 'pending',
  hoan_thanh: 'success',
};

export const KET_QUA_SEMANTIC_PT: Record<KetQuaKiemKePT, StatusBadgeSemantic> = {
  chua_kiem: 'neutral',
  khop: 'success',
  thieu: 'rejected',
  thua: 'warning',
};
