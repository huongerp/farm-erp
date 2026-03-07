import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface NoiLuuFilters {
  status: string[];
  id_chi_nhanh: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_chi_nhanh', label: i18n.t('thietLapTaiSan.noiLuu.store.branchCol'), visible: true, minWidth: 200, order: 0 },
  { id: 'ma_noi_luu', label: i18n.t('thietLapTaiSan.noiLuu.store.maCol'), visible: true, minWidth: 140, order: 1 },
  { id: 'ten_noi_luu', label: i18n.t('thietLapTaiSan.noiLuu.store.tenCol'), visible: true, minWidth: 200, order: 2 },
  { id: 'ghi_chu', label: i18n.t('thietLapTaiSan.noiLuu.store.noteCol'), visible: true, minWidth: 200, order: 3 },
  { id: 'trang_thai', label: i18n.t('thietLapTaiSan.noiLuu.store.statusCol'), visible: true, minWidth: 120, order: 4 },
  { id: 'tg_cap_nhat', label: i18n.t('thietLapTaiSan.noiLuu.store.updatedCol'), visible: false, minWidth: 140, order: 5 },
];

const initialFilters: NoiLuuFilters = {
  status: [],
  id_chi_nhanh: [],
};

export const useNoiLuuStore = createGenericStore<NoiLuuFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
