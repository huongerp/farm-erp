import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export type DatePresetId =
  | 'all'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'custom';

export interface ChiTietPhieuKhoFilters {
  /** Loại phiếu: nhap, xuat, chuyen */
  loai: string[];
  /** Preset khoảng thời gian (giống tab Thống kê nhân viên) */
  datePreset: DatePresetId;
  customDateFrom: string;
  customDateEnd: string;
  /** Kho (kho_id của phiếu) */
  khoIds: string[];
  /** Kho đến (phiếu chuyển) */
  khoDenIds: string[];
  /** Pending | Approved | Rejected — khớp filter tab danh sách */
  trangThaiKeys: string[];
  nguoiTaoIds: string[];
  nguoiDuyetIds: string[];
  /** NCC hoặc KH (id đối tác) */
  doiTacIds: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'so_phieu', label: i18n.t('phieuKho.store.soPhieuCol'), visible: true, minWidth: 100, maxWidth: 160, order: 0 },
  { id: 'ngay', label: i18n.t('phieuKho.store.ngayCol'), visible: true, minWidth: 100, maxWidth: 120, order: 1 },
  { id: 'loai', label: i18n.t('phieuKho.chiTietTab.loaiPhieuCol'), visible: true, minWidth: 132, maxWidth: 200, order: 2 },
  { id: 'ten_kho', label: i18n.t('phieuKho.store.khoCol'), visible: true, minWidth: 120, maxWidth: 180, order: 3 },
  { id: 'ten_kho_den', label: i18n.t('phieuKho.store.khoDenCol'), visible: true, minWidth: 120, maxWidth: 180, order: 4 },
  { id: 'ten_nha_cung_cap', label: i18n.t('phieuKho.detail.supplier'), visible: true, minWidth: 120, maxWidth: 200, order: 5 },
  { id: 'so_po_don_dat_hang', label: i18n.t('phieuKho.store.poCol'), visible: true, minWidth: 220, maxWidth: 360, order: 5.5 },
  { id: 'ma_hang', label: i18n.t('phieuKho.form.itemCode'), visible: true, minWidth: 128, maxWidth: 200, order: 6 },
  { id: 'ten_hang', label: i18n.t('phieuKho.form.itemName'), visible: true, minWidth: 280, maxWidth: 480, order: 7 },
  { id: 'so_luong', label: i18n.t('phieuKho.form.quantity'), visible: true, minWidth: 96, maxWidth: 120, order: 8 },
  { id: 'don_gia', label: i18n.t('phieuKho.form.unitPrice'), visible: true, minWidth: 112, maxWidth: 140, order: 9 },
  { id: 'thanh_tien', label: i18n.t('phieuKho.form.amount'), visible: true, minWidth: 120, maxWidth: 168, order: 10 },
  { id: 'don_vi_tinh', label: i18n.t('phieuKho.form.unit'), visible: true, minWidth: 88, maxWidth: 120, order: 11 },
  { id: 'so_lot', label: i18n.t('phieuKho.preview.soLot'), visible: true, minWidth: 96, maxWidth: 140, order: 12 },
  { id: 'ghi_chu', label: i18n.t('phieuKho.form.note'), visible: true, minWidth: 200, maxWidth: 360, order: 13 },
  { id: 'trang_thai', label: i18n.t('phieuKho.store.statusCol'), visible: true, minWidth: 90, maxWidth: 120, order: 14 },
  { id: 'ten_nguoi_duyet', label: i18n.t('phieuKho.store.approverCol'), visible: true, minWidth: 120, maxWidth: 200, order: 15 },
];

const initialFilters: ChiTietPhieuKhoFilters = {
  loai: [],
  datePreset: 'all',
  customDateFrom: '',
  customDateEnd: '',
  khoIds: [],
  khoDenIds: [],
  trangThaiKeys: [],
  nguoiTaoIds: [],
  nguoiDuyetIds: [],
  doiTacIds: [],
};

export const useChiTietPhieuKhoStore = createGenericStore<ChiTietPhieuKhoFilters>(initialFilters, DEFAULT_COLUMNS);
