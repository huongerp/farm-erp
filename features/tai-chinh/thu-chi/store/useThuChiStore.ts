import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface ThuChiFilters {
  loai: string[];
  trang_thai: string[];
  tu_ngay: string;
  den_ngay: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma_giao_dich', label: i18n.t('thuChi.columns.maGiaoDich'), visible: true, minWidth: 120, maxWidth: 160, order: 0 },
  { id: 'ngay_giao_dich', label: i18n.t('thuChi.columns.ngayGiaoDich'), visible: true, minWidth: 100, maxWidth: 140, order: 1 },
  { id: 'loai', label: i18n.t('thuChi.columns.loai'), visible: true, minWidth: 90, maxWidth: 120, order: 2 },
  { id: 'ten_tai_khoan', label: i18n.t('thuChi.columns.taiKhoan'), visible: true, minWidth: 140, maxWidth: 200, order: 3 },
  { id: 'ten_danh_muc', label: i18n.t('thuChi.columns.danhMuc'), visible: true, minWidth: 140, maxWidth: 200, order: 4 },
  { id: 'so_tien', label: i18n.t('thuChi.columns.soTien'), visible: true, minWidth: 110, maxWidth: 140, order: 5 },
  { id: 'noi_dung', label: i18n.t('thuChi.columns.noiDung'), visible: true, minWidth: 160, maxWidth: 280, order: 6 },
  { id: 'ten_nhan_vien', label: i18n.t('thuChi.columns.nguoiThucHien'), visible: true, minWidth: 120, maxWidth: 180, order: 7 },
  { id: 'trang_thai', label: i18n.t('thuChi.columns.trangThai'), visible: true, minWidth: 100, maxWidth: 130, order: 8 },
  { id: 'actions', label: i18n.t('common.actions'), visible: true, minWidth: 88, maxWidth: 100, order: 9 },
];

const initialFilters: ThuChiFilters = {
  loai: [],
  trang_thai: [],
  tu_ngay: '',
  den_ngay: '',
};

export const useThuChiStore = createGenericStore<ThuChiFilters>(initialFilters, DEFAULT_COLUMNS);
