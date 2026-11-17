import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface GiamSatChatLuongFilters {
  /** YYYY-MM-DD, rỗng = không giới hạn (chip thời gian chuẩn). */
  dateFrom: string;
  dateTo: string;
  trang_thai: string[];
  ket_luan: string[];
  co_loi: string[];
  id_chi_nhanh: string[];
  id_hang_hoa: string[];
}

const col = (id: string, key: string, minWidth: number, maxWidth: number, order: number): ColumnConfig => ({
  id,
  label: i18n.t(`giamSatChatLuong.col.${key}`),
  visible: true,
  minWidth,
  maxWidth,
  order,
});

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  col('so_phieu', 'soPhieu', 96, 120, 0),
  col('ngay', 'ngay', 96, 120, 1),
  col('trang_thai', 'trangThai', 110, 140, 2),
  col('ket_luan', 'ketLuan', 110, 140, 3),
  col('tien_do', 'tienDo', 90, 120, 4),
  col('loi', 'loi', 100, 150, 5),
  col('ten_hang_hoa', 'thanhPham', 140, 240, 6),
  col('ma_cay_hang', 'cayHang', 90, 140, 7),
  col('so_thung_cay', 'soThungCay', 90, 120, 8),
  col('ten_chi_nhanh', 'farm', 110, 170, 9),
  col('ghi_chu', 'ghiChu', 120, 260, 10),
  col('ten_nguoi_tao', 'nguoiTao', 120, 190, 11),
];

const initialFilters: GiamSatChatLuongFilters = {
  dateFrom: '',
  dateTo: '',
  trang_thai: [],
  ket_luan: [],
  co_loi: [],
  id_chi_nhanh: [],
  id_hang_hoa: [],
};

export const useGiamSatChatLuongStore = createGenericStore<GiamSatChatLuongFilters>(
  initialFilters,
  DEFAULT_COLUMNS,
  'table-giam-sat-chat-luong'
);
