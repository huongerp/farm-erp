import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DiemCongTruFilters {
  status: string[];
  type: string[];
  yearMonth: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_nhan_vien', label: i18n.t('diemCongTru.store.employeeCol'), visible: true, minWidth: 180, order: 0 },
  { id: 'period', label: i18n.t('diemCongTru.store.periodCol'), visible: true, minWidth: 120, order: 1 },
  { id: 'loai', label: i18n.t('diemCongTru.store.loaiCol'), visible: true, minWidth: 100, order: 2 },
  { id: 'ten_hang_muc', label: i18n.t('diemCongTru.store.categoryCol'), visible: true, minWidth: 200, order: 3 },
  { id: 'diem', label: i18n.t('diemCongTru.store.diemCol'), visible: true, minWidth: 90, order: 4 },
  { id: 'mo_ta', label: i18n.t('diemCongTru.store.moTaCol'), visible: true, minWidth: 200, order: 5 },
  { id: 'tg_cap_nhat', label: i18n.t('diemCongTru.store.updatedCol'), visible: false, minWidth: 140, order: 6 },
];

const initialFilters: DiemCongTruFilters = {
  status: [],
  type: [],
  yearMonth: '',
};

export const useDiemCongTruStore = createGenericStore<DiemCongTruFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
