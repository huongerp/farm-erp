import type { LoaiPhieuKho } from '../../phieu-kho/core/types';

export const LOAI_PHIEU_OPTIONS: { value: LoaiPhieuKho; labelKey: string }[] = [
  { value: 'nhap', labelKey: 'baoCaonhapXuatTon.loaiNhap' },
  { value: 'xuat', labelKey: 'baoCaonhapXuatTon.loaiXuat' },
  { value: 'chuyen', labelKey: 'baoCaonhapXuatTon.loaiChuyen' },
];

/** 0 = Chờ duyệt, 1 = Đã duyệt, 2 = Không duyệt */
export const TRANG_THAI_PHIEU_OPTIONS: { value: 0 | 1 | 2; labelKey: string }[] = [
  { value: 0, labelKey: 'baoCaonhapXuatTon.trangThaiChoDuyet' },
  { value: 1, labelKey: 'baoCaonhapXuatTon.trangThaiDaDuyet' },
  { value: 2, labelKey: 'baoCaonhapXuatTon.trangThaiKhongDuyet' },
];
