import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';
import { THU_HOACH_DAY_SUFFIXES } from '../core/types';
import { thuHoachDayColumnLabel } from '../core/utils';

export interface ThuHoachFilters {
  nam: string[];
  tuan: string[];
  id_chi_nhanh: string[];
}

const DAY_LIST_COLUMNS: ColumnConfig[] = THU_HOACH_DAY_SUFFIXES.map((s, i) => ({
  id: `day_${s}`,
  label: thuHoachDayColumnLabel(s),
  visible: true,
  minWidth: 88,
  maxWidth: 112,
  order: 3 + i,
}));

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'nam', label: i18n.t('thuHoach.store.colNam'), visible: true, minWidth: 72, maxWidth: 100, order: 0 },
  { id: 'tuan', label: i18n.t('thuHoach.store.colTuan'), visible: true, minWidth: 64, maxWidth: 90, order: 1 },
  { id: 'ten_chi_nhanh', label: i18n.t('thuHoach.store.colBranch'), visible: true, minWidth: 140, maxWidth: 220, order: 2 },
  ...DAY_LIST_COLUMNS,
  { id: 'tong_ke_hoach', label: i18n.t('thuHoach.store.colTongKeHoach'), visible: true, minWidth: 110, maxWidth: 140, order: 10 },
  { id: 'tong_thuc_te', label: i18n.t('thuHoach.store.colTongThucTe'), visible: true, minWidth: 110, maxWidth: 140, order: 11 },
  { id: 'ghi_chu', label: i18n.t('thuHoach.store.colGhiChu'), visible: true, minWidth: 120, maxWidth: 240, order: 12 },
  { id: 'ten_nguoi_tao', label: i18n.t('thuHoach.store.colNguoiTao'), visible: true, minWidth: 128, maxWidth: 200, order: 13 },
  { id: 'tg_cap_nhat', label: i18n.t('thuHoach.store.colUpdated'), visible: true, minWidth: 100, maxWidth: 140, order: 14 },
];

const initialFilters: ThuHoachFilters = {
  nam: [],
  tuan: [],
  id_chi_nhanh: [],
};

export const useThuHoachStore = createGenericStore<ThuHoachFilters>(initialFilters, DEFAULT_COLUMNS);
