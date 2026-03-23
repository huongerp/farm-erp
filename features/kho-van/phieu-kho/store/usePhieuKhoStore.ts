import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface PhieuKhoFilters {
  status: string[];
  /** Kho đi (xuat/chuyen) hoặc Kho đến (nhap) */
  khoIds: string[];
  /** Chỉ dùng tab Chuyển kho: Kho đến */
  khoDenIds: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'so_phieu', label: i18n.t('phieuKho.store.soPhieuCol'), visible: true, minWidth: 120, maxWidth: 180, order: 0 },
  { id: 'ngay', label: i18n.t('phieuKho.store.ngayCol'), visible: true, minWidth: 100, maxWidth: 140, order: 1 },
  { id: 'ten_kho', label: i18n.t('phieuKho.store.khoCol'), visible: true, minWidth: 140, maxWidth: 220, order: 2 },
  { id: 'ten_kho_den', label: i18n.t('phieuKho.store.khoDenCol'), visible: true, minWidth: 140, maxWidth: 220, order: 3 },
  { id: 'ten_nha_cung_cap', label: i18n.t('phieuKho.store.supplierCol'), visible: true, minWidth: 140, maxWidth: 220, order: 4 },
  { id: 'ten_khach_hang', label: i18n.t('phieuKho.store.customerCol'), visible: true, minWidth: 140, maxWidth: 220, order: 5 },
  { id: 'tong_so_dong', label: i18n.t('phieuKho.list.totalItems'), visible: true, minWidth: 90, maxWidth: 120, order: 6 },
  { id: 'tong_tien', label: i18n.t('phieuKho.list.totalValue'), visible: true, minWidth: 110, maxWidth: 160, order: 7 },
  { id: 'mo_ta', label: i18n.t('phieuKho.store.descCol'), visible: true, minWidth: 140, maxWidth: 260, order: 8 },
  { id: 'ten_nguoi_tao', label: i18n.t('phieuKho.store.creatorCol'), visible: true, minWidth: 120, maxWidth: 180, order: 9 },
  { id: 'tg_tao', label: i18n.t('phieuKho.store.createdAtCol'), visible: true, minWidth: 100, maxWidth: 140, order: 10 },
  { id: 'trang_thai', label: i18n.t('phieuKho.store.statusCol'), visible: true, minWidth: 100, maxWidth: 140, order: 11 },
  { id: 'tg_cap_nhat', label: i18n.t('phieuKho.store.updatedCol'), visible: true, minWidth: 100, maxWidth: 140, order: 12 },
];

const initialFilters: PhieuKhoFilters = {
  status: [],
  khoIds: [],
  khoDenIds: [],
};

export const usePhieuKhoStore = createGenericStore<PhieuKhoFilters>(initialFilters, DEFAULT_COLUMNS);
