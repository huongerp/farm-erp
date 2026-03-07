import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface BranchFilters {
  /** Trạng thái: ['Active','Inactive'] hoặc [] = tất cả */
  status: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_chi_nhanh', label: i18n.t('branch.store.nameCol'), visible: true, minWidth: 220, order: 0 },
  { id: 'ma_chi_nhanh', label: i18n.t('branch.store.codeCol'), visible: true, minWidth: 140, order: 1 },
  { id: 'dia_chi', label: i18n.t('branch.store.addressCol'), visible: true, minWidth: 260, order: 2 },
  { id: 'tinh_thanh', label: i18n.t('branch.store.provinceCol'), visible: true, minWidth: 140, order: 3 },
  { id: 'quan_huyen', label: i18n.t('branch.store.districtCol'), visible: false, minWidth: 140, order: 4 },
  { id: 'trang_thai', label: i18n.t('branch.store.statusCol'), visible: true, minWidth: 120, order: 5 },
];

const initialFilters: BranchFilters = {
  status: [],
};

export const useBranchStore = createGenericStore<BranchFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
