import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface AdminFormManagedFilters {
  status: string[];
  type: string[];
  shift: string[];
  month: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_nguoi_tao', label: i18n.t('adminForm.store.requesterCol'), visible: true, minWidth: 180, order: 0 },
  { id: 'ten_phong_ban', label: i18n.t('adminForm.store.departmentCol'), visible: true, minWidth: 160, order: 1 },
  { id: 'loai_phieu', label: i18n.t('adminForm.store.typeCol'), visible: true, minWidth: 180, order: 2 },
  { id: 'ca', label: i18n.t('adminForm.store.shiftCol'), visible: true, minWidth: 120, order: 3 },
  { id: 'ngay', label: i18n.t('adminForm.store.dateCol'), visible: true, minWidth: 120, order: 4 },
  { id: 'trang_thai', label: i18n.t('adminForm.store.statusCol'), visible: true, minWidth: 140, order: 5 },
  { id: 'tg_cap_nhat', label: i18n.t('adminForm.store.updatedCol'), visible: false, minWidth: 140, order: 6 },
];

const initialFilters: AdminFormManagedFilters = {
  status: [],
  type: [],
  shift: [],
  month: '',
};

export const useAdminFormManagedStore = createGenericStore<AdminFormManagedFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
