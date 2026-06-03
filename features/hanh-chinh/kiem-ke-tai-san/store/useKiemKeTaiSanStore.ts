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
} from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';
import type { TrangThaiDotKiemKe } from '../core/types';

export interface KiemKeTaiSanFilters {
  trang_thai_dot: TrangThaiDotKiemKe[];
  dateFrom: string;
  dateTo: string;
  id_nguoi_phu_trach: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma_dot', label: i18n.t('kiemKeTaiSan.store.maDotCol'), visible: true, minWidth: COLUMN_WIDTH_CODE_MIN, maxWidth: COLUMN_WIDTH_CODE_MAX, order: 0 },
  { id: 'ten_dot', label: i18n.t('kiemKeTaiSan.store.tenDotCol'), visible: true, minWidth: COLUMN_WIDTH_NAME_MIN, maxWidth: COLUMN_WIDTH_NAME_MAX, order: 1 },
  { id: 'ngay_bat_dau', label: i18n.t('kiemKeTaiSan.store.ngayBatDauCol'), visible: true, order: 2 },
  { id: 'ngay_ket_thuc', label: i18n.t('kiemKeTaiSan.store.ngayKetThucCol'), visible: true, order: 3 },
  { id: 'trang_thai', label: i18n.t('kiemKeTaiSan.store.trangThaiCol'), visible: true, order: 4 },
  { id: 'ten_nguoi_phu_trach', label: i18n.t('kiemKeTaiSan.store.nguoiPhuTrachCol'), visible: true, minWidth: COLUMN_WIDTH_PERSON_MIN, maxWidth: COLUMN_WIDTH_PERSON_MAX, order: 5 },
  { id: 'ghi_chu', label: i18n.t('kiemKeTaiSan.store.ghiChuCol'), visible: false, minWidth: COLUMN_WIDTH_NOTE_MIN, maxWidth: COLUMN_WIDTH_NOTE_MAX, order: 6 },
  { id: 'tg_cap_nhat', label: i18n.t('kiemKeTaiSan.store.updatedCol'), visible: true, order: 7 },
];

const initialFilters: KiemKeTaiSanFilters = {
  trang_thai_dot: [],
  dateFrom: '',
  dateTo: '',
  id_nguoi_phu_trach: [],
};

export const useKiemKeTaiSanStore = createGenericStore<KiemKeTaiSanFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
