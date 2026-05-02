import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export type DatePresetIdChiTietPT =
  | 'all'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'custom';

export interface ChiTietPhieuKhoPTFilters {
  loai: string[];
  datePreset: DatePresetIdChiTietPT;
  customDateFrom: string;
  customDateEnd: string;
  khoIds: string[];
  khoDenIds: string[];
  trangThaiKeys: string[];
  nguoiTaoIds: string[];
  nguoiDuyetIds: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'so_phieu', label: i18n.t('phieuKhoPhanThuoc.store.soPhieuCol'), visible: true, minWidth: 100, maxWidth: 160, order: 0 },
  { id: 'ngay', label: i18n.t('phieuKhoPhanThuoc.store.ngayCol'), visible: true, minWidth: 100, maxWidth: 120, order: 1 },
  { id: 'loai', label: i18n.t('phieuKhoPhanThuoc.chiTietTab.loaiPhieuCol'), visible: true, minWidth: 90, maxWidth: 120, order: 2 },
  { id: 'ten_kho', label: i18n.t('phieuKhoPhanThuoc.store.khoCol'), visible: true, minWidth: 120, maxWidth: 180, order: 3 },
  { id: 'ten_kho_den', label: i18n.t('phieuKhoPhanThuoc.store.khoDenCol'), visible: true, minWidth: 120, maxWidth: 180, order: 4 },
  { id: 'ma_hang', label: i18n.t('phieuKhoPhanThuoc.form.itemCode'), visible: true, minWidth: 100, maxWidth: 140, order: 5 },
  { id: 'ten_hang', label: i18n.t('phieuKhoPhanThuoc.form.itemName'), visible: true, minWidth: 140, maxWidth: 220, order: 6 },
  { id: 'so_luong', label: i18n.t('phieuKhoPhanThuoc.form.quantity'), visible: true, minWidth: 80, maxWidth: 100, order: 7 },
  { id: 'don_gia', label: i18n.t('phieuKhoPhanThuoc.form.unitPrice'), visible: true, minWidth: 90, maxWidth: 120, order: 8 },
  { id: 'thanh_tien', label: i18n.t('phieuKhoPhanThuoc.form.amount'), visible: true, minWidth: 100, maxWidth: 140, order: 9 },
  { id: 'don_vi_tinh', label: i18n.t('phieuKhoPhanThuoc.form.unit'), visible: true, minWidth: 60, maxWidth: 80, order: 10 },
  { id: 'so_lot', label: i18n.t('phieuKhoPhanThuoc.preview.soLot'), visible: true, minWidth: 80, maxWidth: 120, order: 11 },
  { id: 'ghi_chu', label: i18n.t('phieuKhoPhanThuoc.form.note'), visible: true, minWidth: 100, maxWidth: 180, order: 12 },
  { id: 'trang_thai', label: i18n.t('phieuKhoPhanThuoc.store.statusCol'), visible: true, minWidth: 90, maxWidth: 120, order: 13 },
  { id: 'ten_nguoi_duyet', label: i18n.t('phieuKhoPhanThuoc.store.approverCol'), visible: true, minWidth: 120, maxWidth: 200, order: 14 },
];

const initialFilters: ChiTietPhieuKhoPTFilters = {
  loai: [],
  datePreset: 'all',
  customDateFrom: '',
  customDateEnd: '',
  khoIds: [],
  khoDenIds: [],
  trangThaiKeys: [],
  nguoiTaoIds: [],
  nguoiDuyetIds: [],
};

export const useChiTietPhieuKhoPTStore = createGenericStore<ChiTietPhieuKhoPTFilters>(initialFilters, DEFAULT_COLUMNS);
