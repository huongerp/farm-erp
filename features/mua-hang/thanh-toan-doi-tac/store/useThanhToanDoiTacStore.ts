import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface ThanhToanDoiTacFilters {
  statusIds: string[];
  doiTacIds: string[];
  donViIds: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'so_phieu', label: i18n.t('thanhToanDoiTac.store.soPhieuCol'), visible: true, minWidth: 120, maxWidth: 160, order: 0 },
  { id: 'hang_muc_thanh_toan', label: i18n.t('thanhToanDoiTac.store.hangMucCol'), visible: true, minWidth: 180, maxWidth: 280, order: 1 },
  { id: 'ngay_xu_ly', label: i18n.t('thanhToanDoiTac.store.ngayXuLyCol'), visible: true, minWidth: 100, maxWidth: 120, order: 2 },
  { id: 'ngay', label: i18n.t('thanhToanDoiTac.store.ngayCol'), visible: true, minWidth: 100, maxWidth: 120, order: 3 },
  { id: 'ten_don_vi', label: i18n.t('thanhToanDoiTac.store.donViCol'), visible: true, minWidth: 120, maxWidth: 180, order: 4 },
  { id: 'ten_nhom', label: i18n.t('thanhToanDoiTac.store.nhomDoiTacCol'), visible: true, minWidth: 120, maxWidth: 180, order: 5 },
  { id: 'ten_doi_tac', label: i18n.t('thanhToanDoiTac.store.doiTacCol'), visible: true, minWidth: 140, maxWidth: 220, order: 6 },
  { id: 'ten_trang_thai', label: i18n.t('thanhToanDoiTac.store.trangThaiCol'), visible: true, minWidth: 120, maxWidth: 160, order: 7 },
  { id: 'so_tien', label: i18n.t('thanhToanDoiTac.store.soTienCol'), visible: true, minWidth: 110, maxWidth: 140, order: 8 },
  { id: 'tg_cap_nhat', label: i18n.t('thanhToanDoiTac.store.updatedCol'), visible: true, minWidth: 100, maxWidth: 140, order: 9 },
];

const initialFilters: ThanhToanDoiTacFilters = {
  statusIds: [],
  doiTacIds: [],
  donViIds: [],
};

export const useThanhToanDoiTacStore = createGenericStore<ThanhToanDoiTacFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
