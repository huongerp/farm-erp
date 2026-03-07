import type { LoaiPhieu } from './types';
import type { TFunction } from 'i18next';

export function getLoaiPhieuLabel(loai: LoaiPhieu, t: TFunction): string {
  return t(`capPhatThuHoi.loaiPhieu.${loai}`);
}

export const LOAI_PHIEU_OPTIONS: { value: LoaiPhieu; labelKey: string }[] = [
  { value: 'cap_phat', labelKey: 'capPhatThuHoi.loaiPhieu.cap_phat' },
  { value: 'thu_hoi', labelKey: 'capPhatThuHoi.loaiPhieu.thu_hoi' },
  { value: 'luan_chuyen_vi_tri', labelKey: 'capPhatThuHoi.loaiPhieu.luan_chuyen_vi_tri' },
  { value: 'luan_chuyen_nguoi', labelKey: 'capPhatThuHoi.loaiPhieu.luan_chuyen_nguoi' },
  { value: 'luan_chuyen_ca_hai', labelKey: 'capPhatThuHoi.loaiPhieu.luan_chuyen_ca_hai' },
];
