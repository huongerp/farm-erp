import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DgdvFilters {
  id_chi_nhanh: string[];
  /** tuần farm dạng khoá '2026-44' (core/tuan `khoaTuanFarm`) */
  tuan_farm: string[];
  trang_thai: string[];
  /** số chuyến dạng chuỗi ('1', '2'…) */
  chuyen: string[];
  /** id nhân viên người tạo */
  nguoi_tao: string[];
  /** 'co' = có KSC, 'khong' = không lỗi */
  ksc: string[];
  /** khoảng ngày 'YYYY-MM-DD' — '' = không giới hạn */
  tu_ngay: string;
  den_ngay: string;
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ngay', label: i18n.t('danhGiaDauVao.store.colNgay'), visible: true, minWidth: 104, maxWidth: 130, order: 0 },
  { id: 'chuyen', label: i18n.t('danhGiaDauVao.store.colChuyen'), visible: true, minWidth: 76, maxWidth: 96, order: 1 },
  { id: 'tuan', label: i18n.t('danhGiaDauVao.store.colNamTuan'), visible: true, minWidth: 170, maxWidth: 210, order: 2 },
  { id: 'id_chi_nhanh', label: i18n.t('danhGiaDauVao.store.colBranch'), visible: true, minWidth: 140, maxWidth: 220, order: 3 },
  { id: 'tong_thu', label: i18n.t('danhGiaDauVao.store.colTongThu'), visible: true, minWidth: 100, maxWidth: 130, order: 4 },
  { id: 'ksc', label: i18n.t('danhGiaDauVao.store.colKsc'), visible: true, minWidth: 80, maxWidth: 110, order: 5 },
  { id: 'ti_le_ksc', label: i18n.t('danhGiaDauVao.store.colTiLeKsc'), visible: true, minWidth: 80, maxWidth: 110, order: 6 },
  { id: 'trang_thai', label: i18n.t('danhGiaDauVao.store.colTrangThai'), visible: true, minWidth: 110, maxWidth: 160, order: 7 },
  { id: 'ten_nguoi_tao', label: i18n.t('danhGiaDauVao.store.colNguoiTao'), visible: true, minWidth: 128, maxWidth: 200, order: 8 },
  { id: 'tg_cap_nhat', label: i18n.t('danhGiaDauVao.store.colUpdated'), visible: true, minWidth: 132, maxWidth: 168, order: 9 },
  { id: 'ghi_chu', label: i18n.t('danhGiaDauVao.store.colGhiChu'), visible: false, minWidth: 180, maxWidth: 360, order: 10 },
  { id: 'tg_tao', label: i18n.t('danhGiaDauVao.store.colTgTao'), visible: false, minWidth: 132, maxWidth: 168, order: 11 },
];

const initialFilters: DgdvFilters = {
  id_chi_nhanh: [],
  tuan_farm: [],
  trang_thai: [],
  chuyen: [],
  nguoi_tao: [],
  ksc: [],
  tu_ngay: '',
  den_ngay: '',
};

export const useDanhGiaDauVaoStore = createGenericStore<DgdvFilters>(initialFilters, DEFAULT_COLUMNS, 'table-danh-gia-dau-vao');
