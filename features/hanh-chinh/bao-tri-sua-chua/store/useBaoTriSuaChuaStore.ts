import {
  createGenericStore,
  ColumnConfig,
  COLUMN_WIDTH_CODE_MIN,
  COLUMN_WIDTH_CODE_MAX,
  COLUMN_WIDTH_ENTITY_MIN,
  COLUMN_WIDTH_ENTITY_MAX,
  COLUMN_WIDTH_PERSON_MIN,
  COLUMN_WIDTH_PERSON_MAX,
  COLUMN_WIDTH_NOTE_MIN,
  COLUMN_WIDTH_NOTE_MAX,
  COLUMN_WIDTH_DATETIME_MIN,
  COLUMN_WIDTH_DATETIME_MAX,
} from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface BaoTriSuaChuaFilters {
  hang_muc: string[];
  dateFrom: string;
  dateTo: string;
  id_tai_san: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ngay', label: i18n.t('baoTriSuaChua.store.ngayCol'), visible: true, minWidth: 110, order: 0 },
  { id: 'ten_hang_muc', label: i18n.t('baoTriSuaChua.store.hangMucCol'), visible: true, minWidth: 100, order: 1 },
  { id: 'ma_phieu', label: i18n.t('baoTriSuaChua.store.maPhieuCol'), visible: true, minWidth: COLUMN_WIDTH_CODE_MIN, maxWidth: COLUMN_WIDTH_CODE_MAX, order: 2 },
  { id: 'ma_tai_san', label: i18n.t('baoTriSuaChua.store.maTaiSanCol'), visible: true, minWidth: COLUMN_WIDTH_CODE_MIN, maxWidth: COLUMN_WIDTH_CODE_MAX, order: 3 },
  { id: 'ten_tai_san', label: i18n.t('baoTriSuaChua.store.tenTaiSanCol'), visible: true, minWidth: COLUMN_WIDTH_ENTITY_MIN, maxWidth: COLUMN_WIDTH_ENTITY_MAX, order: 4 },
  { id: 'mo_ta', label: i18n.t('baoTriSuaChua.store.moTaCol'), visible: true, minWidth: COLUMN_WIDTH_NOTE_MIN, maxWidth: COLUMN_WIDTH_NOTE_MAX, order: 5 },
  { id: 'so_tien', label: i18n.t('baoTriSuaChua.store.soTienCol'), visible: true, minWidth: 110, order: 6 },
  { id: 'trang_thai', label: i18n.t('baoTriSuaChua.store.trangThaiCol'), visible: true, minWidth: 110, order: 7 },
  { id: 'nguoi_duyet', label: i18n.t('baoTriSuaChua.store.nguoiDuyetCol'), visible: true, minWidth: COLUMN_WIDTH_PERSON_MIN, maxWidth: COLUMN_WIDTH_PERSON_MAX, order: 8 },
  { id: 'ten_nguoi_tao', label: i18n.t('baoTriSuaChua.store.nguoiTaoCol'), visible: true, minWidth: COLUMN_WIDTH_PERSON_MIN, maxWidth: COLUMN_WIDTH_PERSON_MAX, order: 9 },
  { id: 'ghi_chu', label: i18n.t('baoTriSuaChua.store.ghiChuCol'), visible: false, minWidth: COLUMN_WIDTH_NOTE_MIN, maxWidth: COLUMN_WIDTH_NOTE_MAX, order: 10 },
  { id: 'tg_tao', label: i18n.t('baoTriSuaChua.store.createdCol'), visible: false, minWidth: COLUMN_WIDTH_DATETIME_MIN, maxWidth: COLUMN_WIDTH_DATETIME_MAX, order: 11 },
  { id: 'tg_cap_nhat', label: i18n.t('baoTriSuaChua.store.updatedCol'), visible: true, minWidth: COLUMN_WIDTH_DATETIME_MIN, maxWidth: COLUMN_WIDTH_DATETIME_MAX, order: 12 },
];

const initialFilters: BaoTriSuaChuaFilters = {
  hang_muc: [],
  dateFrom: '',
  dateTo: '',
  id_tai_san: [],
};

export const useBaoTriSuaChuaStore = createGenericStore<BaoTriSuaChuaFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
