import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

/** Bộ lọc tab Chi tiết: trạng thái + nơi/người + tiến độ mh (theo text vì row không có id) */
export interface ChiTietTabFilters {
  status: string[];
  noiDeXuat: string[];
  nguoiDeXuat: string[];
  nguoiDuyet: string[];
  tienDoMh: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'so_phieu', label: i18n.t('phieuDeXuatVatTu.store.soPhieuCol'), visible: true, minWidth: 100, maxWidth: 160, order: 0 },
  { id: 'ngay', label: i18n.t('phieuDeXuatVatTu.store.ngayCol'), visible: true, minWidth: 90, maxWidth: 120, order: 1 },
  { id: 'ngay_can', label: i18n.t('phieuDeXuatVatTu.store.ngayCanCol'), visible: true, minWidth: 90, maxWidth: 120, order: 2 },
  { id: 'ten_noi_de_xuat', label: i18n.t('phieuDeXuatVatTu.store.noiDeXuatCol'), visible: true, minWidth: 120, maxWidth: 200, order: 3 },
  { id: 'ten_nguoi_de_xuat', label: i18n.t('phieuDeXuatVatTu.store.nguoiDeXuatCol'), visible: true, minWidth: 100, maxWidth: 160, order: 4 },
  { id: 'ten_nguoi_duyet', label: i18n.t('phieuDeXuatVatTu.store.nguoiDuyetCol'), visible: true, minWidth: 100, maxWidth: 160, order: 5 },
  { id: 'trang_thai_phieu', label: i18n.t('phieuDeXuatVatTu.store.statusCol'), visible: true, minWidth: 90, maxWidth: 120, order: 6 },
  { id: 'ma_hang', label: i18n.t('phieuDeXuatVatTu.form.itemCode'), visible: true, minWidth: 90, maxWidth: 140, order: 7 },
  { id: 'ten_hang', label: i18n.t('phieuDeXuatVatTu.form.itemName'), visible: true, minWidth: 140, maxWidth: 260, order: 8 },
  { id: 'so_luong', label: i18n.t('phieuDeXuatVatTu.form.quantity'), visible: true, minWidth: 80, maxWidth: 100, order: 9 },
  { id: 'don_vi_tinh', label: i18n.t('phieuDeXuatVatTu.form.unit'), visible: true, minWidth: 70, maxWidth: 90, order: 10 },
  { id: 'ten_tien_do_mh', label: i18n.t('phieuDeXuatVatTu.form.tienDoMh'), visible: true, minWidth: 110, maxWidth: 160, order: 11 },
  { id: 'thong_so', label: i18n.t('phieuDeXuatVatTu.form.specs'), visible: false, minWidth: 100, maxWidth: 180, order: 12 },
  { id: 'ghi_chu', label: i18n.t('phieuDeXuatVatTu.form.note'), visible: true, minWidth: 120, maxWidth: 220, order: 13 },
  { id: 'actions', label: '', visible: true, minWidth: 80, maxWidth: 80, order: 14 },
];

const initialFilters: ChiTietTabFilters = {
  status: [],
  noiDeXuat: [],
  nguoiDeXuat: [],
  nguoiDuyet: [],
  tienDoMh: [],
};

export const useChiTietTabStore = createGenericStore<ChiTietTabFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
