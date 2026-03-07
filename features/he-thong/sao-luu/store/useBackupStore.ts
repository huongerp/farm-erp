
import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import { BackupFilters } from '../core/types';
import i18n from '../../../../lib/i18n';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_file', label: i18n.t('backup.store.nameCol'), visible: true, minWidth: 280, order: 0 },
  { id: 'loai_dung_luong', label: i18n.t('backup.store.typeSizeCol'), visible: true, minWidth: 180, order: 1 },
  { id: 'thoi_gian', label: i18n.t('backup.store.timeCol'), visible: true, minWidth: 200, order: 2 },
  { id: 'trang_thai', label: i18n.t('backup.store.statusCol'), visible: true, minWidth: 140, order: 3 },
];

const initialFilters: BackupFilters = {
  loai_sao_luu: 'All',
  trang_thai: 'All',
};

export const useBackupStore = createGenericStore<BackupFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
