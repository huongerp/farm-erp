import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface GiamSatChatLuongFilters {
  nam: string[];
  thang: string[];
  trang_thai: string[];
  ket_luan: string[];
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
  col('ten_hang_hoa', 'thanhPham', 140, 240, 5),
  col('ma_cay_hang', 'cayHang', 90, 140, 6),
  col('so_thung_cay', 'soThungCay', 90, 120, 7),
  col('ten_chi_nhanh', 'farm', 110, 170, 8),
  col('ghi_chu', 'ghiChu', 120, 260, 9),
  col('ten_nguoi_tao', 'nguoiTao', 120, 190, 10),
];

const initialFilters: GiamSatChatLuongFilters = {
  nam: [],
  thang: [],
  trang_thai: [],
  ket_luan: [],
  id_chi_nhanh: [],
  id_hang_hoa: [],
};

export const useGiamSatChatLuongStore = createGenericStore<GiamSatChatLuongFilters>(
  initialFilters,
  DEFAULT_COLUMNS,
  'table-giam-sat-chat-luong'
);
