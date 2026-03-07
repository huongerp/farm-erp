import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

/** Trạng thái: ['Active','Inactive'] hoặc [] = tất cả */
interface JobLevelFilters {
  status: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'cap_bac', label: i18n.t('jobLevel.store.orderCol'), visible: true, minWidth: 80, order: 0 },
  { id: 'ten_cap_bac', label: i18n.t('jobLevel.store.nameCol'), visible: true, minWidth: 200, order: 1 },
  { id: 'mo_ta', label: i18n.t('jobLevel.store.descCol'), visible: true, minWidth: 250, order: 2 },
  { id: 'trang_thai', label: i18n.t('jobLevel.store.statusCol'), visible: true, minWidth: 120, order: 3 },
  { id: 'tg_cap_nhat', label: i18n.t('jobLevel.store.updatedCol'), visible: false, minWidth: 150, order: 4 },
];

const initialFilters: JobLevelFilters = {
  status: [],
};

// Create specific store using the generic factory
export const useJobLevelStore = createGenericStore<JobLevelFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
