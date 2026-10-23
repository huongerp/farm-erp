import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';

export interface DonDatHangFilters {
  status: string[];
  nhaCungCapIds: string[];
  khoNhanIds: string[];
  nguoiDatIds: string[];
  danhMucCap1Ids?: string[];
  danhMucCap2Ids?: string[];
  phanLoai?: string[];
  /** Kỳ lọc theo Ngày đặt; 'all' = không lọc. Optional vì store tab Chi tiết dùng chung builder. */
  datePreset?: DateRangePresetId;
  customDateFrom?: string;
  customDateEnd?: string;
}

const getDefaultColumns = (): ColumnConfig[] => [
  { id: 'so_po', label: i18n.t('donDatHang.store.soPoCol'), visible: true, minWidth: 132, maxWidth: 190, order: 0 },
  { id: 'so_phieu_de_xuat', label: i18n.t('donDatHang.store.requestNoCol'), visible: true, minWidth: 150, maxWidth: 210, order: 1 },
  { id: 'ngay_dat', label: i18n.t('donDatHang.store.orderDateCol'), visible: true, minWidth: 132, maxWidth: 168, order: 2 },
  { id: 'ngay_giao_dk', label: i18n.t('donDatHang.store.deliveryDateCol'), visible: true, minWidth: 140, maxWidth: 176, order: 3 },
  { id: 'ten_nha_cung_cap', label: i18n.t('donDatHang.store.supplierCol'), visible: true, minWidth: 220, maxWidth: 340, order: 4 },
  { id: 'ten_kho_nhan', label: i18n.t('donDatHang.store.warehouseCol'), visible: true, minWidth: 180, maxWidth: 280, order: 5 },
  { id: 'so_dong_hang', label: i18n.t('donDatHang.store.lineCountCol'), visible: true, minWidth: 100, maxWidth: 140, order: 6 },
  { id: 'tong_tien', label: i18n.t('donDatHang.store.totalAmountCol'), visible: true, minWidth: 140, maxWidth: 200, order: 7 },
  { id: 'ten_nguoi_dat', label: i18n.t('donDatHang.store.buyerCol'), visible: true, minWidth: 160, maxWidth: 240, order: 8 },
  { id: 'ten_nguoi_duyet', label: i18n.t('donDatHang.store.approverCol'), visible: true, minWidth: 160, maxWidth: 240, order: 9 },
  { id: 'trang_thai', label: i18n.t('donDatHang.store.statusCol'), visible: true, minWidth: 132, maxWidth: 196, order: 10 },
  { id: 'tg_cap_nhat', label: i18n.t('donDatHang.store.updatedCol'), visible: true, minWidth: 160, maxWidth: 220, order: 11 },
  { id: 'ghi_chu', label: i18n.t('donDatHang.store.noteCol'), visible: false, minWidth: 200, maxWidth: 380, order: 12 },
  { id: 'tg_tao', label: i18n.t('donDatHang.store.createdCol'), visible: false, minWidth: 140, maxWidth: 200, order: 13 },
];

const initialFilters: DonDatHangFilters = {
  status: [],
  nhaCungCapIds: [],
  khoNhanIds: [],
  nguoiDatIds: [],
  danhMucCap1Ids: [],
  danhMucCap2Ids: [],
  phanLoai: [],
  datePreset: 'all',
  customDateFrom: '',
  customDateEnd: '',
};

export const useDonDatHangStore = createGenericStore<DonDatHangFilters>(
  initialFilters,
  getDefaultColumns(),
  'table-don-dat-hang'
);
