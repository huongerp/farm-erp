import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface PayrollWifiIpFilters {
  status: string[];
  id_chi_nhanh: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_chi_nhanh', label: i18n.t('payrollIp.store.branchCol'), visible: true, minWidth: 200, order: 0 },
  { id: 'ip_wifi', label: i18n.t('payrollIp.store.ipCol'), visible: true, minWidth: 160, order: 1 },
  { id: 'ghi_chu', label: i18n.t('payrollIp.store.noteCol'), visible: true, minWidth: 200, order: 2 },
  { id: 'trang_thai', label: i18n.t('payrollIp.store.statusCol'), visible: true, minWidth: 120, order: 3 },
  { id: 'tg_cap_nhat', label: i18n.t('payrollIp.store.updatedCol'), visible: false, minWidth: 140, order: 4 },
];

const initialFilters: PayrollWifiIpFilters = {
  status: [],
  id_chi_nhanh: [],
};

export const usePayrollWifiIpStore = createGenericStore<PayrollWifiIpFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
