import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface KhoFilters {
  status: string[];
  id_chi_nhanh: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'thu_tu', label: i18n.t('kho.store.orderCol'), visible: true, minWidth: 80, maxWidth: 100, order: 0 },
  { id: 'ten_chi_nhanh', label: i18n.t('kho.store.branchCol'), visible: true, minWidth: 140, maxWidth: 220, order: 1 },
  { id: 'ma_kho', label: i18n.t('kho.store.codeCol'), visible: true, minWidth: 120, maxWidth: 180, order: 2 },
  { id: 'ten_kho', label: i18n.t('kho.store.nameCol'), visible: true, minWidth: 180, maxWidth: 320, order: 3 },
  { id: 'dia_chi', label: i18n.t('kho.store.addressCol'), visible: true, minWidth: 160, maxWidth: 280, order: 4 },
  { id: 'mo_ta', label: i18n.t('kho.store.descCol'), visible: true, minWidth: 140, maxWidth: 260, order: 5 },
  { id: 'trang_thai', label: i18n.t('kho.store.statusCol'), visible: true, minWidth: 100, maxWidth: 140, order: 6 },
  { id: 'tg_cap_nhat', label: i18n.t('kho.store.updatedCol'), visible: true, minWidth: 100, maxWidth: 140, order: 7 },
];

const initialFilters: KhoFilters = {
  status: [],
  id_chi_nhanh: [],
};

export const useKhoStore = createGenericStore<KhoFilters>(initialFilters, DEFAULT_COLUMNS);
