import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface HangHoaFilters {
  status: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'thu_tu', label: i18n.t('hangHoa.store.orderCol'), visible: true, minWidth: 80, maxWidth: 100, order: 0 },
  { id: 'hinh_anh', label: i18n.t('hangHoa.store.imageCol'), visible: true, minWidth: 72, maxWidth: 96, order: 1 },
  { id: 'ma_hang', label: i18n.t('hangHoa.store.codeCol'), visible: true, minWidth: 120, maxWidth: 180, order: 2 },
  { id: 'ten_hang', label: i18n.t('hangHoa.store.nameCol'), visible: true, minWidth: 180, maxWidth: 320, order: 3 },
  { id: 'ten_danh_muc', label: i18n.t('hangHoa.store.categoryCol'), visible: true, minWidth: 140, maxWidth: 260, order: 4 },
  { id: 'don_vi_tinh', label: i18n.t('hangHoa.store.unitCol'), visible: true, minWidth: 80, maxWidth: 120, order: 5 },
  { id: 'ton_toi_thieu', label: i18n.t('hangHoa.store.minStockCol'), visible: true, minWidth: 100, maxWidth: 120, order: 6 },
  { id: 'mo_ta', label: i18n.t('hangHoa.store.descCol'), visible: true, minWidth: 140, maxWidth: 260, order: 7 },
  { id: 'trang_thai', label: i18n.t('hangHoa.store.statusCol'), visible: true, minWidth: 100, maxWidth: 140, order: 8 },
  { id: 'tg_cap_nhat', label: i18n.t('hangHoa.store.updatedCol'), visible: true, minWidth: 100, maxWidth: 140, order: 9 },
];

const initialFilters: HangHoaFilters = {
  status: [],
};

export const useHangHoaStore = createGenericStore<HangHoaFilters>(initialFilters, DEFAULT_COLUMNS);
