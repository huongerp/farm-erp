import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface PayrollPointGroupFilters {
  status: string[];
  type: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma', label: i18n.t('payrollIp.pointGroups.store.maCol'), visible: true, minWidth: 140, order: 0 },
  { id: 'ten', label: i18n.t('payrollIp.pointGroups.store.tenCol'), visible: true, minWidth: 220, order: 1 },
  { id: 'loai', label: i18n.t('payrollIp.pointGroups.store.loaiCol'), visible: true, minWidth: 120, order: 2 },
  { id: 'thu_tu', label: i18n.t('payrollIp.pointGroups.store.thuTuCol'), visible: true, minWidth: 100, order: 3 },
  { id: 'ghi_chu', label: i18n.t('payrollIp.pointGroups.store.noteCol'), visible: true, minWidth: 200, order: 4 },
  { id: 'trang_thai', label: i18n.t('payrollIp.pointGroups.store.statusCol'), visible: true, minWidth: 120, order: 5 },
  { id: 'tg_cap_nhat', label: i18n.t('payrollIp.pointGroups.store.updatedCol'), visible: false, minWidth: 140, order: 6 },
];

const initialFilters: PayrollPointGroupFilters = {
  status: [],
  type: [],
};

export const usePayrollPointGroupStore = createGenericStore<PayrollPointGroupFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
