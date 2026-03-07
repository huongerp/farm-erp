import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface AdminFormQuotaFilters {
  type: string[];
  month: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'loai_phieu', label: i18n.t('adminForm.store.typeCol'), visible: true, minWidth: 200, order: 0 },
  { id: 'so_luong_thang', label: i18n.t('adminForm.store.quotaCol'), visible: true, minWidth: 140, order: 1 },
  { id: 'da_dung', label: i18n.t('adminForm.store.usedCol'), visible: true, minWidth: 120, order: 2 },
  { id: 'con_lai', label: i18n.t('adminForm.store.remainingCol'), visible: true, minWidth: 120, order: 3 },
];

const initialFilters: AdminFormQuotaFilters = {
  type: [],
  month: '',
};

export const useAdminFormQuotaStore = createGenericStore<AdminFormQuotaFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
