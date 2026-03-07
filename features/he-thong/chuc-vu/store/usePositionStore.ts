import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

/** Trạng thái: ['Active','Inactive'] hoặc [] = tất cả */
interface PositionFilters {
  status: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'thu_tu', label: i18n.t('position.store.orderCol'), visible: true, minWidth: 80, order: 0 },
  { id: 'ma_chuc_vu', label: i18n.t('position.store.codeCol'), visible: true, minWidth: 120, order: 1 },
  { id: 'ten_chuc_vu', label: i18n.t('position.store.nameCol'), visible: true, minWidth: 200, order: 2 },
  { id: 'ten_cap_bac', label: i18n.t('position.store.levelCol'), visible: true, minWidth: 150, order: 3 },
  { id: 'ten_phong_ban', label: i18n.t('position.store.deptCol'), visible: true, minWidth: 180, order: 4 },
  { id: 'mo_ta', label: i18n.t('position.store.descCol'), visible: true, minWidth: 250, order: 5 },
  { id: 'trang_thai', label: i18n.t('position.store.statusCol'), visible: true, minWidth: 120, order: 6 },
  { id: 'tg_cap_nhat', label: i18n.t('position.store.updatedCol'), visible: true, minWidth: 120, order: 7 },
];

const initialFilters: PositionFilters = {
  status: [],
};

export const usePositionStore = createGenericStore<PositionFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);