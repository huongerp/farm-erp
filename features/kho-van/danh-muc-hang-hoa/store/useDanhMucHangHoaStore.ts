import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DanhMucHangHoaFilters {
  status: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'thu_tu', label: i18n.t('danhMucHangHoa.store.orderCol'), visible: true, minWidth: 80, maxWidth: 100, order: 0 },
  { id: 'ten_danh_muc', label: i18n.t('danhMucHangHoa.store.nameCol'), visible: true, minWidth: 180, maxWidth: 320, order: 1 },
  { id: 'ma_danh_muc', label: i18n.t('danhMucHangHoa.store.codeCol'), visible: true, minWidth: 120, maxWidth: 180, order: 2 },
  { id: 'ten_cha', label: i18n.t('danhMucHangHoa.store.tenCha'), visible: true, minWidth: 140, maxWidth: 260, order: 3 },
  { id: 'mo_ta', label: i18n.t('danhMucHangHoa.store.descCol'), visible: true, minWidth: 160, maxWidth: 280, order: 4 },
  { id: 'trang_thai', label: i18n.t('danhMucHangHoa.store.statusCol'), visible: true, minWidth: 100, maxWidth: 140, order: 5 },
  { id: 'tg_cap_nhat', label: i18n.t('danhMucHangHoa.store.updatedCol'), visible: true, minWidth: 100, maxWidth: 140, order: 6 },
];

const initialFilters: DanhMucHangHoaFilters = {
  status: [],
};

export const useDanhMucHangHoaStore = createGenericStore<DanhMucHangHoaFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
