import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DangKyNhanHangFilters {
  nam: string[];
  thang: string[];
  trang_thai: string[];
  id_chi_nhanh: string[];
}

const col = (id: string, key: string, minWidth: number, maxWidth: number, order: number): ColumnConfig => ({
  id,
  label: i18n.t(`dangKyNhanHang.col.${key}`),
  visible: true,
  minWidth,
  maxWidth,
  order,
});

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  col('ngay_dang_ky', 'ngay', 96, 120, 0),
  col('trang_thai', 'trangThai', 120, 150, 1),
  col('so_xe', 'soXe', 100, 150, 2),
  col('so_cont', 'soCont', 110, 160, 3),
  col('khach_hang', 'khachHang', 100, 180, 4),
  col('loai_hang_hoa', 'loaiHang', 100, 160, 5),
  col('ten_tai_xe', 'taiXe', 130, 200, 6),
  col('sdt_tai_xe', 'sdtTaiXe', 110, 140, 7),
  col('gio_dang_ky', 'gioDangKy', 110, 130, 8),
  col('tg_vao_thuc_te', 'gioVao', 100, 130, 9),
  col('tg_ra_thuc_te', 'gioRa', 100, 130, 10),
  col('thoi_luong', 'thoiLuong', 110, 150, 11),
  col('tong_so_luong', 'soLuong', 80, 110, 12),
  col('ten_chi_nhanh', 'chiNhanh', 110, 170, 13),
  col('ghi_chu', 'ghiChu', 120, 260, 14),
  col('ten_nguoi_tao', 'nguoiTao', 120, 190, 15),
];

const initialFilters: DangKyNhanHangFilters = { nam: [], thang: [], trang_thai: [], id_chi_nhanh: [] };

export const useDangKyNhanHangStore = createGenericStore<DangKyNhanHangFilters>(
  initialFilters,
  DEFAULT_COLUMNS,
  'table-dang-ky-nhan-hang'
);
