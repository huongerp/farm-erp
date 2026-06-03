import {
  createGenericStore,
  ColumnConfig,
  COLUMN_WIDTH_CODE_MIN,
  COLUMN_WIDTH_CODE_MAX,
  COLUMN_WIDTH_NAME_MIN,
  COLUMN_WIDTH_NAME_MAX,
  COLUMN_WIDTH_PERSON_MIN,
  COLUMN_WIDTH_PERSON_MAX,
  COLUMN_WIDTH_NOTE_MIN,
  COLUMN_WIDTH_NOTE_MAX,
  COLUMN_WIDTH_COUNT_MIN,
  COLUMN_WIDTH_COUNT_MAX,
} from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface KiemKeKhoFilters {
  trang_thai_dot: string[];
  dateFrom: string;
  dateTo: string;
  id_nguoi_phu_trach: string[];
  id_kho: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma_dot', label: i18n.t('kiemKeKho.store.maDotCol'), visible: true, minWidth: COLUMN_WIDTH_CODE_MIN, maxWidth: COLUMN_WIDTH_CODE_MAX, order: 0 },
  { id: 'ten_dot', label: i18n.t('kiemKeKho.store.tenDotCol'), visible: true, minWidth: COLUMN_WIDTH_NAME_MIN, maxWidth: COLUMN_WIDTH_NAME_MAX, order: 1 },
  { id: 'ngay_bat_dau', label: i18n.t('kiemKeKho.store.ngayBatDauCol'), visible: true, order: 2 },
  { id: 'ngay_ket_thuc', label: i18n.t('kiemKeKho.store.ngayKetThucCol'), visible: true, order: 3 },
  { id: 'trang_thai', label: i18n.t('kiemKeKho.store.trangThaiCol'), visible: true, order: 4 },
  { id: 'so_kho', label: i18n.t('kiemKeKho.store.soKhoCol'), visible: true, minWidth: COLUMN_WIDTH_COUNT_MIN, maxWidth: COLUMN_WIDTH_COUNT_MAX, order: 5 },
  { id: 'so_hang_hoa', label: i18n.t('kiemKeKho.store.soHangHoaCol'), visible: true, minWidth: COLUMN_WIDTH_COUNT_MIN, maxWidth: COLUMN_WIDTH_COUNT_MAX, order: 6 },
  { id: 'so_lech', label: i18n.t('kiemKeKho.store.soLechCol'), visible: true, minWidth: COLUMN_WIDTH_COUNT_MIN, maxWidth: COLUMN_WIDTH_COUNT_MAX, order: 7 },
  { id: 'ten_nguoi_tao', label: i18n.t('kiemKeKho.store.nguoiTaoCol'), visible: true, minWidth: COLUMN_WIDTH_PERSON_MIN, maxWidth: COLUMN_WIDTH_PERSON_MAX, order: 8 },
  { id: 'ten_nguoi_phu_trach', label: i18n.t('kiemKeKho.store.nguoiPhuTrachCol'), visible: true, minWidth: COLUMN_WIDTH_PERSON_MIN, maxWidth: COLUMN_WIDTH_PERSON_MAX, order: 9 },
  { id: 'ghi_chu', label: i18n.t('kiemKeKho.store.ghiChuCol'), visible: false, minWidth: COLUMN_WIDTH_NOTE_MIN, maxWidth: COLUMN_WIDTH_NOTE_MAX, order: 10 },
  { id: 'tg_tao', label: i18n.t('kiemKeKho.store.createdAtCol'), visible: false, order: 11 },
  { id: 'tg_cap_nhat', label: i18n.t('kiemKeKho.store.updatedCol'), visible: true, order: 12 },
];

const initialFilters: KiemKeKhoFilters = {
  trang_thai_dot: [],
  dateFrom: '',
  dateTo: '',
  id_nguoi_phu_trach: [],
  id_kho: [],
};

export const useKiemKeKhoStore = createGenericStore<KiemKeKhoFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
