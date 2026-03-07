import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface CapPhatThuHoiFilters {
  loai_phieu: string[];
  dateFrom: string;
  dateTo: string;
  id_noi_luu_truoc: string[];
  id_nguoi_thuc_hien: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'loai_phieu', label: i18n.t('capPhatThuHoi.store.loaiCol'), visible: true, minWidth: 140, order: 0 },
  { id: 'ten_tai_san', label: i18n.t('capPhatThuHoi.store.taiSanCol'), visible: true, minWidth: 160, order: 1 },
  { id: 'ten_noi_luu_truoc', label: i18n.t('capPhatThuHoi.store.noiLuuTruocCol'), visible: true, minWidth: 120, order: 2 },
  { id: 'ten_noi_luu_sau', label: i18n.t('capPhatThuHoi.store.noiLuuSauCol'), visible: true, minWidth: 120, order: 3 },
  { id: 'ten_nguoi_giu_truoc', label: i18n.t('capPhatThuHoi.store.nguoiGiuTruocCol'), visible: true, minWidth: 120, order: 4 },
  { id: 'ten_nguoi_giu_sau', label: i18n.t('capPhatThuHoi.store.nguoiGiuSauCol'), visible: true, minWidth: 120, order: 5 },
  { id: 'ngay_thuc_hien', label: i18n.t('capPhatThuHoi.store.ngayCol'), visible: true, minWidth: 110, order: 6 },
  { id: 'ten_nguoi_thuc_hien', label: i18n.t('capPhatThuHoi.store.nguoiThucHienCol'), visible: true, minWidth: 120, order: 7 },
  { id: 'ghi_chu', label: i18n.t('capPhatThuHoi.store.ghiChuCol'), visible: false, minWidth: 160, order: 8 },
  { id: 'tg_cap_nhat', label: i18n.t('capPhatThuHoi.store.updatedCol'), visible: true, minWidth: 130, order: 9 },
];

const initialFilters: CapPhatThuHoiFilters = {
  loai_phieu: [],
  dateFrom: '',
  dateTo: '',
  id_noi_luu_truoc: [],
  id_nguoi_thuc_hien: [],
};

export const useCapPhatThuHoiStore = createGenericStore<CapPhatThuHoiFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
