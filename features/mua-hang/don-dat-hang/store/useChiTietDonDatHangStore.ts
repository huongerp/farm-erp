import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';
import type { DonDatHangFilters } from './useDonDatHangStore';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'so_po', label: i18n.t('donDatHang.chiTietTab.soPoCol'), visible: true, minWidth: 132, maxWidth: 190, order: 0 },
  { id: 'ngay_dat', label: i18n.t('donDatHang.chiTietTab.orderDateCol'), visible: true, minWidth: 132, maxWidth: 168, order: 1 },
  { id: 'ten_nha_cung_cap', label: i18n.t('donDatHang.chiTietTab.supplierCol'), visible: true, minWidth: 220, maxWidth: 340, order: 2 },
  { id: 'ten_kho_nhan', label: i18n.t('donDatHang.chiTietTab.warehouseCol'), visible: true, minWidth: 180, maxWidth: 280, order: 3 },
  { id: 'ten_danh_muc_cap1', label: i18n.t('donDatHang.chiTietTab.categoryLevel1Col'), visible: true, minWidth: 190, maxWidth: 300, order: 4 },
  { id: 'ten_danh_muc_cap2', label: i18n.t('donDatHang.chiTietTab.categoryLevel2Col'), visible: true, minWidth: 190, maxWidth: 300, order: 5 },
  { id: 'phan_loai', label: i18n.t('donDatHang.chiTietTab.classificationCol'), visible: true, minWidth: 140, maxWidth: 220, order: 6 },
  { id: 'ma_hang', label: i18n.t('donDatHang.chiTietTab.itemCodeCol'), visible: true, minWidth: 130, maxWidth: 180, order: 7 },
  { id: 'ten_hang', label: i18n.t('donDatHang.chiTietTab.itemNameCol'), visible: true, minWidth: 280, maxWidth: 420, order: 8 },
  { id: 'so_luong', label: i18n.t('donDatHang.chiTietTab.qtyCol'), visible: true, minWidth: 100, maxWidth: 130, order: 9 },
  { id: 'don_gia', label: i18n.t('donDatHang.chiTietTab.unitPriceCol'), visible: true, minWidth: 120, maxWidth: 170, order: 10 },
  { id: 'thanh_tien', label: i18n.t('donDatHang.chiTietTab.amountCol'), visible: true, minWidth: 130, maxWidth: 190, order: 11 },
  { id: 'don_vi_tinh', label: i18n.t('donDatHang.chiTietTab.unitCol'), visible: true, minWidth: 90, maxWidth: 120, order: 12 },
  { id: 'trang_thai', label: i18n.t('donDatHang.chiTietTab.statusCol'), visible: true, minWidth: 132, maxWidth: 196, order: 13 },
  { id: 'ten_nguoi_dat', label: i18n.t('donDatHang.chiTietTab.buyerCol'), visible: true, minWidth: 160, maxWidth: 240, order: 14 },
  { id: 'ghi_chu', label: i18n.t('donDatHang.chiTietTab.lineNoteCol'), visible: false, minWidth: 180, maxWidth: 280, order: 15 },
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

export const useChiTietDonDatHangStore = createGenericStore<DonDatHangFilters>(initialFilters, DEFAULT_COLUMNS);
