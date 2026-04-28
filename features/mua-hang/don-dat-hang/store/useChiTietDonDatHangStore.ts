import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';
import type { DonDatHangFilters } from './useDonDatHangStore';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'so_po', label: i18n.t('donDatHang.chiTietTab.soPoCol'), visible: true, minWidth: 120, maxWidth: 180, order: 0 },
  { id: 'ngay_dat', label: i18n.t('donDatHang.chiTietTab.orderDateCol'), visible: true, minWidth: 100, maxWidth: 140, order: 1 },
  { id: 'ten_nha_cung_cap', label: i18n.t('donDatHang.chiTietTab.supplierCol'), visible: true, minWidth: 140, maxWidth: 220, order: 2 },
  { id: 'ten_kho_nhan', label: i18n.t('donDatHang.chiTietTab.warehouseCol'), visible: true, minWidth: 120, maxWidth: 180, order: 3 },
  { id: 'ma_hang', label: i18n.t('donDatHang.chiTietTab.itemCodeCol'), visible: true, minWidth: 100, maxWidth: 140, order: 4 },
  { id: 'ten_hang', label: i18n.t('donDatHang.chiTietTab.itemNameCol'), visible: true, minWidth: 140, maxWidth: 220, order: 5 },
  { id: 'so_luong', label: i18n.t('donDatHang.chiTietTab.qtyCol'), visible: true, minWidth: 80, maxWidth: 100, order: 6 },
  { id: 'don_gia', label: i18n.t('donDatHang.chiTietTab.unitPriceCol'), visible: true, minWidth: 90, maxWidth: 120, order: 7 },
  { id: 'thanh_tien', label: i18n.t('donDatHang.chiTietTab.amountCol'), visible: true, minWidth: 100, maxWidth: 140, order: 8 },
  { id: 'don_vi_tinh', label: i18n.t('donDatHang.chiTietTab.unitCol'), visible: true, minWidth: 60, maxWidth: 80, order: 9 },
  { id: 'trang_thai', label: i18n.t('donDatHang.chiTietTab.statusCol'), visible: true, minWidth: 100, maxWidth: 140, order: 10 },
  { id: 'ten_nguoi_dat', label: i18n.t('donDatHang.chiTietTab.buyerCol'), visible: true, minWidth: 120, maxWidth: 180, order: 11 },
  { id: 'ghi_chu', label: i18n.t('donDatHang.chiTietTab.lineNoteCol'), visible: false, minWidth: 100, maxWidth: 180, order: 12 },
];

const initialFilters: DonDatHangFilters = {
  status: [],
  nhaCungCapIds: [],
  khoNhanIds: [],
  nguoiDatIds: [],
};

export const useChiTietDonDatHangStore = createGenericStore<DonDatHangFilters>(initialFilters, DEFAULT_COLUMNS);
