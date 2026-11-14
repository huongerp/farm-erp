/** Store bảng tab Chi tiết (từng lần pha) — tách khỏi tab Nhật ký để giữ cột / bộ lọc riêng. */
import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';
import type { NhatKyPhaPhenFilters } from './useNhatKyPhaPhenStore';

const col = (id: string, i18nKey: string, minWidth: number, maxWidth: number, order: number): ColumnConfig => ({
  id,
  label: i18n.t(i18nKey),
  visible: true,
  minWidth,
  maxWidth,
  order,
});

export const DEFAULT_COLUMNS_CHI_TIET: ColumnConfig[] = [
  col('ngay', 'nkpp.col.ngay', 110, 140, 0),
  col('ten_chi_nhanh', 'nkpp.col.chiNhanh', 120, 180, 1),
  col('lan', 'nkpp.chiTiet.col.lan', 70, 100, 2),
  col('gio', 'nkpp.chiTiet.col.gio', 70, 100, 3),
  col('so_kg', 'nkpp.chiTiet.col.soKg', 90, 130, 4),
  col('dinh_muc_kg', 'nkpp.col.dinhMuc', 90, 130, 5),
  col('chenh_lech', 'nkpp.col.chenhLech', 100, 130, 6),
  col('ten_nhan_vien_phu_trach', 'nkpp.col.nhanSu', 130, 200, 7),
];

const initialFilters: NhatKyPhaPhenFilters = { nam: [], thang: [], id_chi_nhanh: [] };

export const useNhatKyPhaPhenChiTietStore = createGenericStore<NhatKyPhaPhenFilters>(
  initialFilters,
  DEFAULT_COLUMNS_CHI_TIET,
  'table-nhat-ky-pha-phen-chi-tiet'
);
