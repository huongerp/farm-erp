
import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import { LogFilters } from '../core/types';
import i18n from '../../../../lib/i18n';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'nguoi_dung', label: i18n.t('permission.store.logUserCol'), visible: true, minWidth: 220, order: 0 },
  { id: 'hanh_dong', label: i18n.t('permission.store.logActionCol'), visible: true, minWidth: 200, order: 1 },
  { id: 'thong_tin', label: i18n.t('permission.store.logDeviceCol'), visible: true, minWidth: 250, order: 2 },
  { id: 'tg_thuc_hien', label: i18n.t('permission.store.logTimeCol'), visible: true, minWidth: 180, order: 3 },
  { id: 'trang_thai', label: i18n.t('permission.store.logResultCol'), visible: true, minWidth: 120, order: 4 },
];

const initialFilters: LogFilters = {
  trang_thai: 'All',
};

export const useLogStore = createGenericStore<LogFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
