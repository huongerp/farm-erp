/** Store bảng tab Chi tiết (từng lần pha) — tách khỏi tab Nhật ký để giữ cột / bộ lọc riêng. */
import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';
import type { NhatKyPhunCuiFilters } from './useNhatKyPhunCuiStore';

const col = (id: string, i18nKey: string, minWidth: number, maxWidth: number, order: number, visible = true): ColumnConfig => ({
  id,
  label: i18n.t(i18nKey),
  visible,
  minWidth,
  maxWidth,
  order,
});

export const DEFAULT_COLUMNS_CHI_TIET: ColumnConfig[] = [
  col('ngay', 'nkpc.col.ngay', 100, 140, 0),
  col('ten_chi_nhanh', 'nkpc.col.chiNhanh', 120, 200, 1),
  col('thu_tu', 'nkpc.chiTiet.col.lan', 60, 90, 2),
  col('gio', 'nkpc.chiTiet.col.gio', 70, 100, 3),
  col('ten_hang_hoa', 'nkpc.chiTiet.col.thuoc', 160, 320, 4),
  col('nong_do', 'nkpc.chiTiet.col.nongDo', 110, 160, 5),
  col('luong_nuoc_lit', 'nkpc.chiTiet.col.luongNuoc', 110, 150, 6),
  col('luong_thuoc', 'nkpc.chiTiet.col.luongThuoc', 110, 160, 7),
  col('ghi_chu', 'nkpc.col.ghiChu', 120, 260, 8),
  col('ten_nhan_vien_phu_trach', 'nkpc.col.nhanSu', 130, 200, 9),
];

const initialFilters: NhatKyPhunCuiFilters = { thang: [], id_chi_nhanh: [] };

export const useNhatKyPhunCuiChiTietStore = createGenericStore<NhatKyPhunCuiFilters>(
  initialFilters,
  DEFAULT_COLUMNS_CHI_TIET,
  'table-nhat-ky-phun-cui-chi-tiet'
);
