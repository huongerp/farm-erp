import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';
import type { DonDatHangFilters } from './useDonDatHangStore';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'so_po', label: i18n.t('donDatHang.chiTietTab.soPoCol'), visible: true, minWidth: 132, maxWidth: 190, order: 0 },
  { id: 'ngay_dat', label: i18n.t('donDatHang.chiTietTab.orderDateCol'), visible: true, minWidth: 132, maxWidth: 168, order: 1 },
  { id: 'ten_nha_cung_cap', label: i18n.t('donDatHang.chiTietTab.supplierCol'), visible: true, minWidth: 220, maxWidth: 360, order: 2 },
  { id: 'ten_kho_nhan', label: i18n.t('donDatHang.chiTietTab.warehouseCol'), visible: true, minWidth: 180, maxWidth: 300, order: 3 },
  { id: 'ten_danh_muc_cap1', label: i18n.t('donDatHang.chiTietTab.categoryLevel1Col'), visible: true, minWidth: 200, maxWidth: 320, order: 4 },
  { id: 'ten_danh_muc_cap2', label: i18n.t('donDatHang.chiTietTab.categoryLevel2Col'), visible: true, minWidth: 200, maxWidth: 320, order: 5 },
  { id: 'phan_loai', label: i18n.t('donDatHang.chiTietTab.classificationCol'), visible: true, minWidth: 160, maxWidth: 240, order: 6 },
  { id: 'ma_hang', label: i18n.t('donDatHang.chiTietTab.itemCodeCol'), visible: true, minWidth: 140, maxWidth: 200, order: 7 },
  { id: 'ten_hang', label: i18n.t('donDatHang.chiTietTab.itemNameCol'), visible: true, minWidth: 320, maxWidth: 520, order: 8 },
  { id: 'so_luong', label: i18n.t('donDatHang.chiTietTab.qtyCol'), visible: true, minWidth: 108, maxWidth: 140, order: 9 },
  { id: 'don_gia', label: i18n.t('donDatHang.chiTietTab.unitPriceCol'), visible: true, minWidth: 128, maxWidth: 180, order: 10 },
  { id: 'thanh_tien', label: i18n.t('donDatHang.chiTietTab.amountCol'), visible: true, minWidth: 136, maxWidth: 200, order: 11 },
  { id: 'don_vi_tinh', label: i18n.t('donDatHang.chiTietTab.unitCol'), visible: true, minWidth: 100, maxWidth: 140, order: 12 },
  { id: 'trang_thai', label: i18n.t('donDatHang.chiTietTab.statusCol'), visible: true, minWidth: 132, maxWidth: 196, order: 13 },
  { id: 'ten_nguoi_dat', label: i18n.t('donDatHang.chiTietTab.buyerCol'), visible: true, minWidth: 168, maxWidth: 260, order: 14 },
  { id: 'muc_dich_su_dung', label: i18n.t('donDatHang.chiTietTab.purposeOfUseCol'), visible: true, minWidth: 220, maxWidth: 400, order: 15 },
  { id: 'ghi_chu', label: i18n.t('donDatHang.chiTietTab.lineNoteCol'), visible: false, minWidth: 220, maxWidth: 380, order: 16 },
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
