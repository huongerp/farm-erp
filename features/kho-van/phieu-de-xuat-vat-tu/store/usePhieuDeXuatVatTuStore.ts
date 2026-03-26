import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface PhieuDeXuatVatTuFilters {
  status: string[];
  noiDeXuatIds: string[];
  nguoiDeXuatIds: string[];
  nguoiDuyetIds: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'so_phieu', label: i18n.t('phieuDeXuatVatTu.store.soPhieuCol'), visible: true, minWidth: 120, maxWidth: 180, order: 0 },
  { id: 'ngay', label: i18n.t('phieuDeXuatVatTu.store.ngayCol'), visible: true, minWidth: 100, maxWidth: 140, order: 1 },
  { id: 'ngay_can', label: i18n.t('phieuDeXuatVatTu.store.ngayCanCol'), visible: true, minWidth: 100, maxWidth: 140, order: 2 },
  { id: 'ten_noi_de_xuat', label: i18n.t('phieuDeXuatVatTu.store.noiDeXuatCol'), visible: true, minWidth: 140, maxWidth: 220, order: 3 },
  { id: 'ten_nguoi_de_xuat', label: i18n.t('phieuDeXuatVatTu.store.nguoiDeXuatCol'), visible: true, minWidth: 140, maxWidth: 220, order: 4 },
  { id: 'ten_nguoi_duyet', label: i18n.t('phieuDeXuatVatTu.store.nguoiDuyetCol'), visible: true, minWidth: 140, maxWidth: 220, order: 5 },
  { id: 'tong_so_dong', label: i18n.t('phieuDeXuatVatTu.store.lineItemsCol'), visible: true, minWidth: 90, maxWidth: 120, order: 6 },
  { id: 'tong_so_luong', label: i18n.t('phieuDeXuatVatTu.store.totalQuantityCol'), visible: true, minWidth: 100, maxWidth: 130, order: 7 },
  { id: 'ghi_chu', label: i18n.t('phieuDeXuatVatTu.store.notesCol'), visible: true, minWidth: 140, maxWidth: 260, order: 8 },
  { id: 'tg_tao', label: i18n.t('phieuDeXuatVatTu.store.createdAtCol'), visible: true, minWidth: 100, maxWidth: 140, order: 9 },
  { id: 'trang_thai', label: i18n.t('phieuDeXuatVatTu.store.statusCol'), visible: true, minWidth: 100, maxWidth: 140, order: 10 },
  { id: 'tg_cap_nhat', label: i18n.t('phieuDeXuatVatTu.store.updatedCol'), visible: true, minWidth: 100, maxWidth: 140, order: 11 },
];

const initialFilters: PhieuDeXuatVatTuFilters = {
  status: [],
  noiDeXuatIds: [],
  nguoiDeXuatIds: [],
  nguoiDuyetIds: [],
};

export const usePhieuDeXuatVatTuStore = createGenericStore<PhieuDeXuatVatTuFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
