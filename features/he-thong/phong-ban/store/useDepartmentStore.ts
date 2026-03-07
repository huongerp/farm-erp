import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DepartmentFilters {
  status: string[];
  /** Lọc theo phòng (1 cấp – giữ key cũ để toolbar không đổi nhiều, có thể bỏ sau) */
  id_phong_goc: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'tt', label: i18n.t('department.store.orderCol'), visible: true, minWidth: 80, maxWidth: 100, order: 0 },
  { id: 'ten_phong_ban', label: i18n.t('department.store.nameCol'), visible: true, minWidth: 180, maxWidth: 320, order: 1 },
  { id: 'chuc_nang', label: i18n.t('department.store.chucNangCol'), visible: true, minWidth: 160, maxWidth: 280, order: 2 },
  { id: 'trang_thai', label: i18n.t('department.store.statusCol'), visible: true, minWidth: 100, maxWidth: 140, order: 3 },
  { id: 'tg_cap_nhat', label: i18n.t('department.store.updatedCol'), visible: true, minWidth: 100, maxWidth: 140, order: 4 },
];

const initialFilters: DepartmentFilters = {
  status: [],
  id_phong_goc: [],
};

export const useDepartmentStore = createGenericStore<DepartmentFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
