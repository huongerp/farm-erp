import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export type TonKhoFilters = {
  belowMinStock: string[];
  /** Lọc theo danh mục (ten_danh_muc). Rỗng = tất cả. */
  categoryIds: string[];
  /** Tab theo nơi lưu: lọc theo id_kho. Rỗng = tất cả. */
  warehouseIds: string[];
};

const initialTonKhoFilters: TonKhoFilters = {
  belowMinStock: [],
  categoryIds: [],
  warehouseIds: [],
};

const DEFAULT_COLUMNS_BY_PRODUCT: ColumnConfig[] = [
  { id: 'ma_hang', label: i18n.t('tonKho.byProduct.code'), visible: true, minWidth: 100, maxWidth: 160, order: 0 },
  { id: 'ten_hang', label: i18n.t('tonKho.byProduct.name'), visible: true, minWidth: 160, maxWidth: 280, order: 1 },
  { id: 'ten_danh_muc', label: i18n.t('tonKho.byProduct.category'), visible: true, minWidth: 110, maxWidth: 180, order: 2 },
  { id: 'tong_so_luong', label: i18n.t('tonKho.byProduct.totalQty'), visible: true, minWidth: 95, maxWidth: 115, order: 3 },
  { id: 'ton_toi_thieu', label: i18n.t('tonKho.byProduct.minStock'), visible: true, minWidth: 95, maxWidth: 115, order: 4 },
  { id: 'canh_bao', label: i18n.t('tonKho.byProduct.alert'), visible: true, minWidth: 115, maxWidth: 160, order: 5 },
  { id: 'don_vi_tinh', label: i18n.t('tonKho.byProduct.unit'), visible: true, minWidth: 70, maxWidth: 100, order: 6 },
];

const DEFAULT_COLUMNS_BY_LOCATION: ColumnConfig[] = [
  { id: 'ma_kho', label: i18n.t('tonKho.byLocation.code'), visible: true, minWidth: 100, maxWidth: 160, order: 0 },
  { id: 'ten_kho', label: i18n.t('tonKho.byLocation.warehouse'), visible: true, minWidth: 160, maxWidth: 280, order: 1 },
  { id: 'so_mat_hang', label: i18n.t('tonKho.byLocation.itemsCount'), visible: true, minWidth: 95, maxWidth: 120, order: 2 },
  { id: 'tong_so_luong', label: i18n.t('tonKho.byLocation.totalQty'), visible: true, minWidth: 110, maxWidth: 140, order: 3 },
];

export const useTonKhoByProductStore = createGenericStore<TonKhoFilters>(initialTonKhoFilters, DEFAULT_COLUMNS_BY_PRODUCT);
export const useTonKhoByLocationStore = createGenericStore<TonKhoFilters>(initialTonKhoFilters, DEFAULT_COLUMNS_BY_LOCATION);
