import {
  createGenericStore,
  type ColumnConfig,
  COLUMN_WIDTH_COMPACT_MIN,
  COLUMN_WIDTH_COMPACT_MAX,
  COLUMN_WIDTH_DATETIME_MIN,
  COLUMN_WIDTH_DATETIME_MAX,
  COLUMN_WIDTH_NOTE_MIN,
  COLUMN_WIDTH_NOTE_MAX,
} from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface HangHoaFilters {
  status: string[];
  /** Danh mục cấp 1 (cha). */
  id_danh_muc_cha: string[];
  /** Danh mục cấp 2 (con). */
  id_danh_muc: string[];
  /** Đơn vị tính. */
  dvt: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'hinh_anh', label: i18n.t('hangHoa.store.imageCol'), visible: true, minWidth: COLUMN_WIDTH_COMPACT_MIN, maxWidth: COLUMN_WIDTH_COMPACT_MAX, order: 0 },
  { id: 'thu_tu', label: i18n.t('hangHoa.store.orderCol'), visible: true, minWidth: 80, maxWidth: 100, order: 1 },
  { id: 'ma_hang_hoa', label: i18n.t('hangHoa.store.codeCol'), visible: true, minWidth: 140, maxWidth: 200, order: 2 },
  { id: 'ten_hang_hoa', label: i18n.t('hangHoa.store.nameCol'), visible: true, minWidth: 300, maxWidth: 460, order: 3 },
  { id: 'ten_danh_muc', label: i18n.t('hangHoa.store.categoryCol'), visible: true, minWidth: 180, maxWidth: 300, order: 4 },
  { id: 'dvt', label: i18n.t('hangHoa.store.unitCol'), visible: true, minWidth: 100, maxWidth: 140, order: 5 },
  { id: 'don_gia', label: i18n.t('hangHoa.store.priceCol'), visible: true, minWidth: 120, maxWidth: 160, order: 6 },
  { id: 'trang_thai', label: i18n.t('hangHoa.store.statusCol'), visible: true, minWidth: 120, maxWidth: 180, order: 7 },
  { id: 'tg_cap_nhat', label: i18n.t('hangHoa.store.updatedCol'), visible: true, minWidth: COLUMN_WIDTH_DATETIME_MIN, maxWidth: COLUMN_WIDTH_DATETIME_MAX, order: 8 },
  { id: 'mo_ta', label: i18n.t('hangHoa.store.descCol'), visible: false, minWidth: COLUMN_WIDTH_NOTE_MIN, maxWidth: COLUMN_WIDTH_NOTE_MAX, order: 9 },
  { id: 'tong_dinh_muc', label: i18n.t('hangHoa.store.tongDinhMucCol'), visible: false, minWidth: 120, maxWidth: 160, order: 10 },
  { id: 'so_kho_dinh_muc', label: i18n.t('hangHoa.store.soKhoDinhMucCol'), visible: false, minWidth: 100, maxWidth: 140, order: 11 },
  { id: 'tg_tao', label: i18n.t('hangHoa.store.createdCol'), visible: false, minWidth: COLUMN_WIDTH_DATETIME_MIN, maxWidth: COLUMN_WIDTH_DATETIME_MAX, order: 12 },
];

const initialFilters: HangHoaFilters = {
  status: [],
  id_danh_muc_cha: [],
  id_danh_muc: [],
  dvt: [],
};

export const useHangHoaStore = createGenericStore<HangHoaFilters>(initialFilters, DEFAULT_COLUMNS);
