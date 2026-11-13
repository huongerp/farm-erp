import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface NhatKyPhunCuiFilters {
  thang: string[];
  id_chi_nhanh: string[];
}

const col = (id: string, key: string, minWidth: number, maxWidth: number, order: number, visible = true): ColumnConfig => ({
  id,
  label: i18n.t(`nkpc.col.${key}`),
  visible,
  minWidth,
  maxWidth,
  order,
});

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  col('ngay', 'ngay', 100, 140, 0),
  col('ten_chi_nhanh', 'chiNhanh', 120, 200, 1),
  col('so_lan', 'soLan', 80, 110, 2),
  col('cac_thuoc', 'cacThuoc', 160, 360, 3),
  col('tong_nuoc', 'tongNuoc', 110, 150, 4),
  col('ten_nhan_vien_phu_trach', 'nhanSu', 130, 200, 5),
  col('ghi_chu', 'ghiChu', 120, 260, 6, false),
  col('ten_nguoi_tao', 'nguoiTao', 120, 190, 7, false),
];

const initialFilters: NhatKyPhunCuiFilters = { thang: [], id_chi_nhanh: [] };

export const useNhatKyPhunCuiStore = createGenericStore<NhatKyPhunCuiFilters>(
  initialFilters,
  DEFAULT_COLUMNS,
  'table-nhat-ky-phun-cui'
);
