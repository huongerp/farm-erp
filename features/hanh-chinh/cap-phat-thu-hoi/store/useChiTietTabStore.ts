import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface ChiTietTabFilters {
  loaiPhieu: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma_phieu', label: i18n.t('capPhatThuHoi.store.maPhieuCol'), visible: true, minWidth: 100, maxWidth: 140, order: 0 },
  { id: 'loai_phieu', label: i18n.t('capPhatThuHoi.store.loaiCol'), visible: true, minWidth: 90, maxWidth: 140, order: 1 },
  { id: 'ngay_thuc_hien', label: i18n.t('capPhatThuHoi.store.ngayCol'), visible: true, minWidth: 90, maxWidth: 120, order: 2 },
  { id: 'ma_tai_san', label: i18n.t('capPhatThuHoi.store.maTaiSanCol'), visible: true, minWidth: 90, maxWidth: 140, order: 3 },
  { id: 'ten_tai_san', label: i18n.t('capPhatThuHoi.store.taiSanCol'), visible: true, minWidth: 140, maxWidth: 260, order: 4 },
  { id: 'ten_noi_luu_truoc', label: i18n.t('capPhatThuHoi.store.noiLuuTruocCol'), visible: true, minWidth: 110, maxWidth: 180, order: 5 },
  { id: 'ten_noi_luu_sau', label: i18n.t('capPhatThuHoi.store.noiLuuSauCol'), visible: true, minWidth: 110, maxWidth: 180, order: 6 },
  { id: 'ten_nguoi_giu_truoc', label: i18n.t('capPhatThuHoi.store.nguoiGiuTruocCol'), visible: false, minWidth: 110, maxWidth: 180, order: 7 },
  { id: 'ten_nguoi_giu_sau', label: i18n.t('capPhatThuHoi.store.nguoiGiuSauCol'), visible: false, minWidth: 110, maxWidth: 180, order: 8 },
  { id: 'ghi_chu', label: i18n.t('capPhatThuHoi.store.ghiChuCol'), visible: true, minWidth: 100, maxWidth: 200, order: 9 },
  { id: 'actions', label: '', visible: true, minWidth: 60, maxWidth: 60, order: 10 },
];

const initialFilters: ChiTietTabFilters = {
  loaiPhieu: [],
};

export const useChiTietTabStore = createGenericStore<ChiTietTabFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
