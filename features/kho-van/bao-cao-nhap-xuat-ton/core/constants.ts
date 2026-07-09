import type { LoaiPhieuKho } from '../../phieu-kho/core/types';

/** Giá trị loại phiếu phải khớp DB: 'nhập' | 'xuất' | 'chuyển'. */
export const LOAI_PHIEU_OPTIONS: { value: LoaiPhieuKho; labelKey: string }[] = [
  { value: 'nhập', labelKey: 'baoCaonhapXuatTon.loaiNhap' },
  { value: 'xuất', labelKey: 'baoCaonhapXuatTon.loaiXuat' },
  { value: 'chuyển', labelKey: 'baoCaonhapXuatTon.loaiChuyen' },
];

/** 0 = Chờ duyệt, 1 = Đã duyệt, 2 = Không duyệt, 3 = Đợi duyệt */
export const TRANG_THAI_PHIEU_OPTIONS: { value: 0 | 1 | 2 | 3; labelKey: string }[] = [
  { value: 0, labelKey: 'baoCaonhapXuatTon.trangThaiChoDuyet' },
  { value: 3, labelKey: 'baoCaonhapXuatTon.trangThaiDoiDuyet' },
  { value: 1, labelKey: 'baoCaonhapXuatTon.trangThaiDaDuyet' },
  { value: 2, labelKey: 'baoCaonhapXuatTon.trangThaiKhongDuyet' },
];
