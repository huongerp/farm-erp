import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';
import type { LoaiPhieuKho } from '../core/types';

export type DatePresetId = 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'custom';

export interface ChiTietPhieuKhoFilters {
  /** Loại phiếu: nhap, xuat, chuyen */
  loai: string[];
  /** Preset khoảng thời gian (giống tab Thống kê nhân viên) */
  datePreset: DatePresetId;
  customDateFrom: string;
  customDateEnd: string;
  /** Kho (kho_id của phiếu) */
  khoIds: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'so_phieu', label: i18n.t('phieuKho.store.soPhieuCol'), visible: true, minWidth: 100, maxWidth: 160, order: 0 },
  { id: 'ngay', label: i18n.t('phieuKho.store.ngayCol'), visible: true, minWidth: 100, maxWidth: 120, order: 1 },
  { id: 'loai', label: i18n.t('phieuKho.chiTietTab.loaiPhieuCol'), visible: true, minWidth: 90, maxWidth: 120, order: 2 },
  { id: 'ten_kho', label: i18n.t('phieuKho.store.khoCol'), visible: true, minWidth: 120, maxWidth: 180, order: 3 },
  { id: 'ten_kho_den', label: i18n.t('phieuKho.store.khoDenCol'), visible: true, minWidth: 120, maxWidth: 180, order: 4 },
  { id: 'ten_nha_cung_cap', label: i18n.t('phieuKho.detail.supplier'), visible: true, minWidth: 120, maxWidth: 200, order: 5 },
  { id: 'trang_thai', label: i18n.t('phieuKho.store.statusCol'), visible: true, minWidth: 90, maxWidth: 120, order: 6 },
  { id: 'ma_hang', label: i18n.t('phieuKho.form.itemCode'), visible: true, minWidth: 100, maxWidth: 140, order: 7 },
  { id: 'ten_hang', label: i18n.t('phieuKho.form.itemName'), visible: true, minWidth: 140, maxWidth: 220, order: 8 },
  { id: 'so_luong', label: i18n.t('phieuKho.form.quantity'), visible: true, minWidth: 80, maxWidth: 100, order: 9 },
  { id: 'don_gia', label: i18n.t('phieuKho.form.unitPrice'), visible: true, minWidth: 90, maxWidth: 120, order: 10 },
  { id: 'thanh_tien', label: i18n.t('phieuKho.form.amount'), visible: true, minWidth: 100, maxWidth: 140, order: 11 },
  { id: 'don_vi_tinh', label: i18n.t('phieuKho.form.unit'), visible: true, minWidth: 60, maxWidth: 80, order: 12 },
  { id: 'ghi_chu', label: i18n.t('phieuKho.form.note'), visible: true, minWidth: 100, maxWidth: 180, order: 13 },
];

const initialFilters: ChiTietPhieuKhoFilters = {
  loai: [],
  datePreset: 'this_month',
  customDateFrom: '',
  customDateEnd: '',
  khoIds: [],
};

export const useChiTietPhieuKhoStore = createGenericStore<ChiTietPhieuKhoFilters>(initialFilters, DEFAULT_COLUMNS);
