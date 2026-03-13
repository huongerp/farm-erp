import type { HangMuc, TrangThaiPhieu } from './types';
import type { TFunction } from 'i18next';

export function getHangMucLabel(hangMuc: HangMuc, t: TFunction): string {
  return t(`baoTriSuaChua.hangMuc.${hangMuc}`);
}

export function getTrangThaiLabel(trangThai: TrangThaiPhieu, t: TFunction): string {
  return t(`baoTriSuaChua.trangThai.${trangThai}`);
}

export const HANG_MUC_OPTIONS: { value: HangMuc; labelKey: string }[] = [
  { value: 'bao_tri', labelKey: 'baoTriSuaChua.hangMuc.bao_tri' },
  { value: 'sua_chua', labelKey: 'baoTriSuaChua.hangMuc.sua_chua' },
];

export const TRANG_THAI_OPTIONS: { value: TrangThaiPhieu; labelKey: string }[] = [
  { value: 'cho_duyet', labelKey: 'baoTriSuaChua.trangThai.cho_duyet' },
  { value: 'da_duyet', labelKey: 'baoTriSuaChua.trangThai.da_duyet' },
  { value: 'khong_duyet', labelKey: 'baoTriSuaChua.trangThai.khong_duyet' },
];
