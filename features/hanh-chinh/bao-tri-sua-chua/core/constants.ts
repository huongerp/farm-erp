import type { TrangThaiPhieu } from './types';
import type { TFunction } from 'i18next';

/** Nhãn cho id legacy bao_tri / sua_chua; id số (fp_ts_loai_chi_phi) cần map từ danh mục */
export function getHangMucLabel(id: string, t: TFunction): string {
  if (id === 'bao_tri' || id === 'sua_chua') return t(`baoTriSuaChua.hangMuc.${id}`);
  return id;
}

export function getTrangThaiLabel(trangThai: TrangThaiPhieu, t: TFunction): string {
  return t(`baoTriSuaChua.trangThai.${trangThai}`);
}

export const TRANG_THAI_OPTIONS: { value: TrangThaiPhieu; labelKey: string }[] = [
  { value: 'cho_duyet', labelKey: 'baoTriSuaChua.trangThai.cho_duyet' },
  { value: 'da_duyet', labelKey: 'baoTriSuaChua.trangThai.da_duyet' },
  { value: 'khong_duyet', labelKey: 'baoTriSuaChua.trangThai.khong_duyet' },
];
