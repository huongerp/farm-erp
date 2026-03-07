import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface AdminFormFilters {
  status: string[];
  type: string[];
  shift: string[];
  month: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'loai_phieu', label: i18n.t('adminForm.store.typeCol'), visible: true, minWidth: 180, order: 0 },
  { id: 'ca', label: i18n.t('adminForm.store.shiftCol'), visible: true, minWidth: 120, order: 1 },
  { id: 'ngay', label: i18n.t('adminForm.store.dateCol'), visible: true, minWidth: 120, order: 2 },
  { id: 'trang_thai', label: i18n.t('adminForm.store.statusCol'), visible: true, minWidth: 140, order: 3 },
  { id: 'tg_cap_nhat', label: i18n.t('adminForm.store.updatedCol'), visible: false, minWidth: 140, order: 4 },
];

const initialFilters: AdminFormFilters = {
  status: [],
  type: [],
  shift: [],
  month: '',
};

export const useAdminFormMyStore = createGenericStore<AdminFormFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
