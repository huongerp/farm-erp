
import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import { RoleFilters } from '../core/types';
import i18n from '../../../../lib/i18n';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'vai_tro', label: i18n.t('permission.store.roleCol'), visible: true, minWidth: 220, order: 0 },
  { id: 'mo_ta', label: i18n.t('permission.store.descCol'), visible: true, minWidth: 300, order: 1 },
  { id: 'thong_ke', label: i18n.t('permission.store.statsCol'), visible: true, minWidth: 150, order: 2 },
  { id: 'trang_thai', label: i18n.t('permission.store.statusCol'), visible: true, minWidth: 140, order: 3 },
];

const initialFilters: RoleFilters = {
  trang_thai: 'All',
  // Fix missing property error
  id_phong_ban: 'All',
};

export const useRoleStore = createGenericStore<RoleFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
