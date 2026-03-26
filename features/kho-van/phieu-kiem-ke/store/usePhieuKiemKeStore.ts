import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface PhieuKiemKeFilters {
  status: string[];
  khoIds: string[];
  nguoiThucHienIds: string[];
  nguoiDuyetIds: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'so_phieu', label: i18n.t('phieuKiemKe.store.soPhieuCol'), visible: true, minWidth: 120, maxWidth: 180, order: 0 },
  { id: 'ngay', label: i18n.t('phieuKiemKe.store.ngayCol'), visible: true, minWidth: 100, maxWidth: 140, order: 1 },
  { id: 'ten_kho', label: i18n.t('phieuKiemKe.store.khoCol'), visible: true, minWidth: 140, maxWidth: 220, order: 2 },
  { id: 'ten_nguoi_thuc_hien', label: i18n.t('phieuKiemKe.store.performerCol'), visible: true, minWidth: 140, maxWidth: 220, order: 3 },
  { id: 'ten_nguoi_duyet', label: i18n.t('phieuKiemKe.store.approverCol'), visible: true, minWidth: 140, maxWidth: 220, order: 4 },
  { id: 'tong_so_dong', label: i18n.t('phieuKiemKe.store.lineItemsCol'), visible: true, minWidth: 90, maxWidth: 120, order: 5 },
  { id: 'tong_so_luong', label: i18n.t('phieuKiemKe.store.totalBookQtyCol'), visible: true, minWidth: 110, maxWidth: 140, order: 6 },
  { id: 'ghi_chu', label: i18n.t('phieuKiemKe.store.notesCol'), visible: true, minWidth: 140, maxWidth: 260, order: 7 },
  { id: 'trang_thai', label: i18n.t('phieuKiemKe.store.statusCol'), visible: true, minWidth: 100, maxWidth: 140, order: 8 },
  { id: 'tg_cap_nhat', label: i18n.t('phieuKiemKe.store.updatedCol'), visible: true, minWidth: 100, maxWidth: 140, order: 9 },
];

const initialFilters: PhieuKiemKeFilters = {
  status: [],
  khoIds: [],
  nguoiThucHienIds: [],
  nguoiDuyetIds: [],
};

export const usePhieuKiemKeStore = createGenericStore<PhieuKiemKeFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
