import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';

export interface PhieuKhoPTFilters {
  /** nhap | xuat | chuyen — rỗng = cả 3 loại */
  loaiKeys: string[];
  status: string[];
  khoIds: string[];
  khoDenIds: string[];
  datePreset: DateRangePresetId;
  customDateFrom: string;
  customDateEnd: string;
  nguoiTaoIds: string[];
  nguoiDuyetIds: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'loai', label: i18n.t('phieuKhoPhanThuoc.store.loaiCol'), visible: true, minWidth: 100, maxWidth: 140, order: 0 },
  { id: 'so_phieu', label: i18n.t('phieuKhoPhanThuoc.store.soPhieuCol'), visible: true, minWidth: 120, maxWidth: 180, order: 1 },
  { id: 'ngay', label: i18n.t('phieuKhoPhanThuoc.store.ngayCol'), visible: true, minWidth: 100, maxWidth: 140, order: 2 },
  { id: 'ten_kho', label: i18n.t('phieuKhoPhanThuoc.store.khoCol'), visible: true, minWidth: 140, maxWidth: 220, order: 3 },
  { id: 'ten_kho_den', label: i18n.t('phieuKhoPhanThuoc.store.khoDenCol'), visible: true, minWidth: 140, maxWidth: 220, order: 4 },
  { id: 'tong_so_dong', label: i18n.t('phieuKhoPhanThuoc.list.totalItems'), visible: true, minWidth: 90, maxWidth: 120, order: 5 },
  { id: 'tong_so_luong', label: i18n.t('phieuKhoPhanThuoc.list.totalQuantity'), visible: true, minWidth: 100, maxWidth: 130, order: 6 },
  { id: 'tong_tien', label: i18n.t('phieuKhoPhanThuoc.list.totalValue'), visible: true, minWidth: 110, maxWidth: 160, order: 7 },
  { id: 'mo_ta', label: i18n.t('phieuKhoPhanThuoc.store.descCol'), visible: true, minWidth: 160, maxWidth: 360, order: 8 },
  { id: 'ten_nguoi_tao', label: i18n.t('phieuKhoPhanThuoc.store.creatorCol'), visible: true, minWidth: 120, maxWidth: 180, order: 9 },
  { id: 'tg_tao', label: i18n.t('phieuKhoPhanThuoc.store.createdAtCol'), visible: true, minWidth: 100, maxWidth: 140, order: 10 },
  { id: 'trang_thai', label: i18n.t('phieuKhoPhanThuoc.store.statusCol'), visible: true, minWidth: 100, maxWidth: 140, order: 11 },
  { id: 'ten_nguoi_duyet', label: i18n.t('phieuKhoPhanThuoc.store.approverCol'), visible: true, minWidth: 120, maxWidth: 200, order: 12 },
  { id: 'tg_cap_nhat', label: i18n.t('phieuKhoPhanThuoc.store.updatedCol'), visible: true, minWidth: 100, maxWidth: 140, order: 13 },
];

const initialFilters: PhieuKhoPTFilters = {
  loaiKeys: [],
  status: [],
  khoIds: [],
  khoDenIds: [],
  datePreset: 'all',
  customDateFrom: '',
  customDateEnd: '',
  nguoiTaoIds: [],
  nguoiDuyetIds: [],
};

export const usePhieuKhoPTStore = createGenericStore<PhieuKhoPTFilters>(initialFilters, DEFAULT_COLUMNS);
