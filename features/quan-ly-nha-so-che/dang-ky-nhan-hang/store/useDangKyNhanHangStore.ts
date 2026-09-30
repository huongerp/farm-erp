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
  col('ngay_dang_ky', 'ngay', 100, 130, 0),
  col('trang_thai', 'trangThai', 110, 140, 1),
  col('xe_cont', 'xeCont', 150, 240, 2),
  col('khach_hang', 'khachHang', 110, 200, 3),
  col('loai_hang_hoa', 'loaiHang', 100, 180, 4),
  col('ten_tai_xe', 'taiXe', 130, 220, 5),
  col('gio_dang_ky', 'gioDangKy', 110, 140, 6),
  col('tg_vao_thuc_te', 'gioVao', 100, 140, 7),
  col('tg_ra_thuc_te', 'gioRa', 100, 140, 8),
  col('thoi_luong', 'thoiLuong', 110, 150, 9),
  col('tong_so_luong', 'soLuong', 90, 120, 10),
  col('ten_chi_nhanh', 'chiNhanh', 110, 180, 11),
  col('ghi_chu', 'ghiChu', 120, 260, 12),
  col('ten_nguoi_tao', 'nguoiTao', 120, 200, 13),
];

const initialFilters: DangKyNhanHangFilters = { nam: [], thang: [], trang_thai: [], id_chi_nhanh: [] };

export const useDangKyNhanHangStore = createGenericStore<DangKyNhanHangFilters>(
  initialFilters,
  DEFAULT_COLUMNS,
  'table-dang-ky-nhan-hang'
);
