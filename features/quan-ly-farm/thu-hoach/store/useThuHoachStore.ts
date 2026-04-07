import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface ThuHoachFilters {
  nam: string[];
  tuan: string[];
  id_chi_nhanh: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'nam', label: i18n.t('thuHoach.store.colNam'), visible: true, minWidth: 72, maxWidth: 100, order: 0 },
  { id: 'tuan', label: i18n.t('thuHoach.store.colTuan'), visible: true, minWidth: 64, maxWidth: 90, order: 1 },
  { id: 'ten_chi_nhanh', label: i18n.t('thuHoach.store.colBranch'), visible: true, minWidth: 140, maxWidth: 220, order: 2 },
  { id: 'tong_ke_hoach', label: i18n.t('thuHoach.store.colTongKeHoach'), visible: true, minWidth: 110, maxWidth: 140, order: 3 },
  { id: 'tong_thuc_te', label: i18n.t('thuHoach.store.colTongThucTe'), visible: true, minWidth: 110, maxWidth: 140, order: 4 },
  { id: 'ghi_chu', label: i18n.t('thuHoach.store.colGhiChu'), visible: true, minWidth: 120, maxWidth: 240, order: 5 },
  { id: 'tg_cap_nhat', label: i18n.t('thuHoach.store.colUpdated'), visible: true, minWidth: 100, maxWidth: 140, order: 6 },
];

const initialFilters: ThuHoachFilters = {
  nam: [],
  tuan: [],
  id_chi_nhanh: [],
};

export const useThuHoachStore = createGenericStore<ThuHoachFilters>(initialFilters, DEFAULT_COLUMNS);
