import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DangKyNhanHangFilters {
  /** Khoảng ngày đăng ký (YYYY-MM-DD, rỗng = không giới hạn) — chip thời gian. */
  dateFrom: string;
  dateTo: string;
  trang_thai: string[];
  id_chi_nhanh: string[];
  /** Tình trạng phiếu xuất kho (tinh_trang_phieu_xuat). */
  phieu_xuat: string[];
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
  // 1.5: cột thêm sau (migration 042) — người đã lưu thứ tự cột cũ vẫn thấy nó ngay sau Trạng thái.
  col('tinh_trang_phieu_xuat', 'phieuXuat', 120, 150, 1.5),
  col('so_xe', 'soXe', 100, 150, 2),
  col('so_cont', 'soCont', 110, 160, 3),
  col('khach_hang', 'khachHang', 100, 180, 4),
  col('loai_hang_hoa', 'loaiHang', 100, 160, 5),
  col('so_luong_dang_ky', 'soLuongDangKy', 90, 120, 6),
  col('ten_tai_xe', 'taiXe', 130, 200, 7),
  col('sdt_tai_xe', 'sdtTaiXe', 110, 140, 8),
  col('gio_dang_ky', 'gioDangKy', 110, 130, 9),
  col('tg_vao_thuc_te', 'gioVao', 100, 130, 10),
  col('tg_ra_thuc_te', 'gioRa', 100, 130, 11),
  col('thoi_luong', 'thoiLuong', 110, 150, 12),
  col('tong_so_luong', 'soLuong', 80, 110, 13),
  col('ten_chi_nhanh', 'chiNhanh', 110, 170, 14),
  col('ghi_chu', 'ghiChu', 120, 260, 15),
  col('ten_nguoi_tao', 'nguoiTao', 120, 190, 16),
];

const initialFilters: DangKyNhanHangFilters = { dateFrom: '', dateTo: '', trang_thai: [], id_chi_nhanh: [], phieu_xuat: [] };

export const useDangKyNhanHangStore = createGenericStore<DangKyNhanHangFilters>(
  initialFilters,
  DEFAULT_COLUMNS,
  'table-dang-ky-nhan-hang'
);
