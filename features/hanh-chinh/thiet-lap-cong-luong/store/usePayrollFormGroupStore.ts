import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface PayrollFormGroupFilters {
  status: string[];
  type: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'loai_phieu', label: i18n.t('payrollIp.groups.store.typeCol'), visible: true, minWidth: 200, order: 0 },
  { id: 'so_luong_thang', label: i18n.t('payrollIp.groups.store.quotaCol'), visible: true, minWidth: 140, order: 1 },
  { id: 'ghi_chu', label: i18n.t('payrollIp.groups.store.noteCol'), visible: true, minWidth: 200, order: 2 },
  { id: 'trang_thai', label: i18n.t('payrollIp.groups.store.statusCol'), visible: true, minWidth: 120, order: 3 },
  { id: 'tg_cap_nhat', label: i18n.t('payrollIp.groups.store.updatedCol'), visible: false, minWidth: 140, order: 4 },
];

const initialFilters: PayrollFormGroupFilters = {
  status: [],
  type: [],
};

export const usePayrollFormGroupStore = createGenericStore<PayrollFormGroupFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
