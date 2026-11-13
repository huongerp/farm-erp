import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface NhatKyPhaPhenFilters {
  nam: string[];
  thang: string[];
  id_chi_nhanh: string[];
}

const col = (id: string, key: string, minWidth: number, maxWidth: number, order: number): ColumnConfig => ({
  id,
  label: i18n.t(`nkpp.col.${key}`),
  visible: true,
  minWidth,
  maxWidth,
  order,
});

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  col('ngay', 'ngay', 110, 140, 0),
  col('ten_chi_nhanh', 'chiNhanh', 110, 170, 1),
  col('so_buong_du_thu', 'soBuongDuThu', 100, 130, 2),
  col('lan_1', 'lan1', 90, 120, 3),
  col('lan_2', 'lan2', 90, 120, 4),
  col('lan_3', 'lan3', 90, 120, 5),
  col('lan_4', 'lan4', 90, 120, 6),
  col('lan_5', 'lan5', 90, 120, 7),
  col('tong_thuc_te', 'tongPhen', 100, 130, 8),
  col('tong_dinh_muc', 'dinhMuc', 90, 120, 9),
  col('chenh_lech', 'chenhLech', 90, 120, 10),
  col('so_be_so_che', 'soBeSoChe', 100, 130, 11),
  col('ten_nhan_vien_phu_trach', 'nhanSu', 130, 200, 12),
  col('ghi_chu', 'ghiChu', 120, 260, 13),
];

const initialFilters: NhatKyPhaPhenFilters = { nam: [], thang: [], id_chi_nhanh: [] };

export const useNhatKyPhaPhenStore = createGenericStore<NhatKyPhaPhenFilters>(
  initialFilters,
  DEFAULT_COLUMNS,
  'table-nhat-ky-pha-phen'
);
