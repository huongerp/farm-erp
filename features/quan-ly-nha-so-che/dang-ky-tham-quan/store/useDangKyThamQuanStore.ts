import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DangKyThamQuanFilters {
  nam: string[];
  thang: string[];
  trang_thai: string[];
  id_chi_nhanh: string[];
  muc_dich: string[];
}

const col = (id: string, key: string, minWidth: number, maxWidth: number, order: number): ColumnConfig => ({
  id,
  label: i18n.t(`dangKyThamQuan.col.${key}`),
  visible: true,
  minWidth,
  maxWidth,
  order,
});

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  col('tg_bat_dau', 'thoiGian', 150, 200, 0),
  col('trang_thai', 'trangThai', 120, 150, 1),
  col('nguoi_dai_dien', 'nguoiDaiDien', 130, 200, 2),
  col('so_khach', 'soKhach', 70, 100, 3),
  col('don_vi', 'donVi', 120, 220, 4),
  col('quoc_tich', 'quocTich', 100, 160, 5),
  col('muc_dich', 'mucDich', 150, 260, 6),
  col('phuong_tien', 'phuongTien', 120, 170, 7),
  col('ten_nguoi_tiep_don', 'nguoiTiepDon', 130, 190, 8),
  col('tg_vao_thuc_te', 'gioVao', 100, 130, 9),
  col('tg_ra_thuc_te', 'gioRa', 100, 130, 10),
  col('ten_chi_nhanh', 'chiNhanh', 110, 170, 11),
  col('ghi_chu', 'ghiChu', 120, 260, 12),
  col('ten_nguoi_tao', 'nguoiTao', 120, 190, 13),
];

const initialFilters: DangKyThamQuanFilters = { nam: [], thang: [], trang_thai: [], id_chi_nhanh: [], muc_dich: [] };

export const useDangKyThamQuanStore = createGenericStore<DangKyThamQuanFilters>(
  initialFilters,
  DEFAULT_COLUMNS,
  'table-dang-ky-tham-quan'
);
