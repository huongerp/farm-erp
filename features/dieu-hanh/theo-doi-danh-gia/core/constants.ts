import type { TrangThaiBaoCaoKpi } from './types';

export const TRANG_THAI_BAO_CAO_VALUES: TrangThaiBaoCaoKpi[] = [
  'nhap',
  'da_gui',
  'da_danh_gia',
];

export const TRANG_THAI_BAO_CAO_LABEL_KEYS: Record<TrangThaiBaoCaoKpi, string> = {
  nhap: 'theoDoiDanhGia.trangThai.nhap',
  da_gui: 'theoDoiDanhGia.trangThai.daGui',
  da_danh_gia: 'theoDoiDanhGia.trangThai.daDanhGia',
};
