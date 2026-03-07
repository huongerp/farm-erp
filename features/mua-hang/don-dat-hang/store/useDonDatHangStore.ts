import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DonDatHangFilters {
  status: string[];
  nhaCungCapIds: string[];
  khoNhanIds: string[];
  nguoiDatIds: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'so_po', label: i18n.t('donDatHang.store.soPoCol'), visible: true, minWidth: 120, maxWidth: 180, order: 0 },
  { id: 'ngay_dat', label: i18n.t('donDatHang.store.orderDateCol'), visible: true, minWidth: 100, maxWidth: 140, order: 1 },
  { id: 'ngay_giao_dk', label: i18n.t('donDatHang.store.deliveryDateCol'), visible: true, minWidth: 100, maxWidth: 140, order: 2 },
  { id: 'ten_nha_cung_cap', label: i18n.t('donDatHang.store.supplierCol'), visible: true, minWidth: 140, maxWidth: 220, order: 3 },
  { id: 'ten_kho_nhan', label: i18n.t('donDatHang.store.warehouseCol'), visible: true, minWidth: 120, maxWidth: 180, order: 4 },
  { id: 'ten_nguoi_dat', label: i18n.t('donDatHang.store.buyerCol'), visible: true, minWidth: 120, maxWidth: 180, order: 5 },
  { id: 'trang_thai', label: i18n.t('donDatHang.store.statusCol'), visible: true, minWidth: 100, maxWidth: 140, order: 6 },
  { id: 'tg_cap_nhat', label: i18n.t('donDatHang.store.updatedCol'), visible: true, minWidth: 100, maxWidth: 140, order: 7 },
];

const initialFilters: DonDatHangFilters = {
  status: [],
  nhaCungCapIds: [],
  khoNhanIds: [],
  nguoiDatIds: [],
};

export const useDonDatHangStore = createGenericStore<DonDatHangFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
