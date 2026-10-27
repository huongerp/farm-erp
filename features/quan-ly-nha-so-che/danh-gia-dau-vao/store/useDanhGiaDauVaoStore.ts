import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DgdvFilters {
  id_chi_nhanh: string[];
  nam: string[];
  tuan: string[];
  trang_thai: string[];
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'nam_tuan', label: i18n.t('danhGiaDauVao.store.colNamTuan'), visible: true, minWidth: 100, maxWidth: 130, order: 0 },
  { id: 'khoang_ngay', label: i18n.t('danhGiaDauVao.store.colKhoangNgay'), visible: true, minWidth: 150, maxWidth: 190, order: 1 },
  { id: 'id_chi_nhanh', label: i18n.t('danhGiaDauVao.store.colBranch'), visible: true, minWidth: 140, maxWidth: 220, order: 2 },
  { id: 'tong_thu_tuan', label: i18n.t('danhGiaDauVao.store.colTongThu'), visible: true, minWidth: 110, maxWidth: 140, order: 3 },
  { id: 'ksc_tuan', label: i18n.t('danhGiaDauVao.store.colKsc'), visible: true, minWidth: 90, maxWidth: 120, order: 4 },
  { id: 'trang_thai', label: i18n.t('danhGiaDauVao.store.colTrangThai'), visible: true, minWidth: 110, maxWidth: 160, order: 5 },
  { id: 'ten_nguoi_tao', label: i18n.t('danhGiaDauVao.store.colNguoiTao'), visible: true, minWidth: 128, maxWidth: 200, order: 6 },
  { id: 'tg_cap_nhat', label: i18n.t('danhGiaDauVao.store.colUpdated'), visible: true, minWidth: 132, maxWidth: 168, order: 7 },
  { id: 'ghi_chu', label: i18n.t('danhGiaDauVao.store.colGhiChu'), visible: false, minWidth: 180, maxWidth: 360, order: 8 },
  { id: 'tg_tao', label: i18n.t('danhGiaDauVao.store.colTgTao'), visible: false, minWidth: 132, maxWidth: 168, order: 9 },
];

const initialFilters: DgdvFilters = {
  id_chi_nhanh: [],
  nam: [],
  tuan: [],
  trang_thai: [],
};

export const useDanhGiaDauVaoStore = createGenericStore<DgdvFilters>(initialFilters, DEFAULT_COLUMNS, 'table-danh-gia-dau-vao');
