import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DonDatHangFilters {
  status: string[];
  nhaCungCapIds: string[];
  khoNhanIds: string[];
  nguoiDatIds: string[];
  danhMucCap1Ids?: string[];
  danhMucCap2Ids?: string[];
  phanLoai?: string[];
}

const getDefaultColumns = (): ColumnConfig[] => [
  { id: 'so_po', label: i18n.t('donDatHang.store.soPoCol'), visible: true, minWidth: 132, maxWidth: 190, order: 0 },
  { id: 'ngay_dat', label: i18n.t('donDatHang.store.orderDateCol'), visible: true, minWidth: 132, maxWidth: 168, order: 1 },
  { id: 'ngay_giao_dk', label: i18n.t('donDatHang.store.deliveryDateCol'), visible: true, minWidth: 140, maxWidth: 176, order: 2 },
  { id: 'ten_nha_cung_cap', label: i18n.t('donDatHang.store.supplierCol'), visible: true, minWidth: 220, maxWidth: 340, order: 3 },
  { id: 'ten_kho_nhan', label: i18n.t('donDatHang.store.warehouseCol'), visible: true, minWidth: 180, maxWidth: 280, order: 4 },
  { id: 'ten_nguoi_dat', label: i18n.t('donDatHang.store.buyerCol'), visible: true, minWidth: 160, maxWidth: 240, order: 5 },
  { id: 'trang_thai', label: i18n.t('donDatHang.store.statusCol'), visible: true, minWidth: 132, maxWidth: 196, order: 6 },
  { id: 'tg_cap_nhat', label: i18n.t('donDatHang.store.updatedCol'), visible: true, minWidth: 160, maxWidth: 220, order: 7 },
];

const initialFilters: DonDatHangFilters = {
  status: [],
  nhaCungCapIds: [],
  khoNhanIds: [],
  nguoiDatIds: [],
  danhMucCap1Ids: [],
  danhMucCap2Ids: [],
  phanLoai: [],
};

export const useDonDatHangStore = createGenericStore<DonDatHangFilters>(
  initialFilters,
  getDefaultColumns()
);
