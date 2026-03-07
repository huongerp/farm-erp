import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';
import type { LoginDeviceFilters } from '../core/types';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_user', label: i18n.t('loginDevices.store.userCol'), visible: true, minWidth: 180, order: 0 },
  { id: 'ten_thiet_bi', label: i18n.t('loginDevices.store.deviceCol'), visible: true, minWidth: 200, order: 1 },
  { id: 'dia_chi_ip', label: i18n.t('loginDevices.store.ipCol'), visible: true, minWidth: 120, order: 2 },
  { id: 'tg_dang_nhap_cuoi', label: i18n.t('loginDevices.store.lastLoginCol'), visible: true, minWidth: 160, order: 3 },
  { id: 'trang_thai', label: i18n.t('loginDevices.store.statusCol'), visible: true, minWidth: 120, order: 4 },
];

const initialFilters: LoginDeviceFilters = {
  status: [],
};

export const useLoginDeviceStore = createGenericStore<LoginDeviceFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
