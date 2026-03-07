import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface TaiKhoanFilters {
  status: string[];
  loai: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_tai_khoan', label: i18n.t('taiKhoan.columns.tenTaiKhoan'), visible: true, minWidth: 180, maxWidth: 280, order: 0 },
  { id: 'loai_tai_khoan', label: i18n.t('taiKhoan.columns.loai'), visible: true, minWidth: 100, maxWidth: 140, order: 1 },
  { id: 'ngan_hang', label: i18n.t('taiKhoan.columns.nganHang'), visible: true, minWidth: 120, maxWidth: 180, order: 2 },
  { id: 'so_tai_khoan', label: i18n.t('taiKhoan.columns.soTaiKhoan'), visible: true, minWidth: 120, maxWidth: 180, order: 3 },
  { id: 'chu_tai_khoan', label: i18n.t('taiKhoan.columns.chuTaiKhoan'), visible: true, minWidth: 140, maxWidth: 220, order: 4 },
  { id: 'so_du_dau', label: i18n.t('taiKhoan.columns.tonDau'), visible: true, minWidth: 110, maxWidth: 140, order: 5 },
  { id: 'tong_thu', label: i18n.t('taiKhoan.columns.tongThu'), visible: true, minWidth: 110, maxWidth: 140, order: 6 },
  { id: 'tong_chi', label: i18n.t('taiKhoan.columns.tongChi'), visible: true, minWidth: 110, maxWidth: 140, order: 7 },
  { id: 'so_du_cuoi', label: i18n.t('taiKhoan.columns.duCuoi'), visible: true, minWidth: 110, maxWidth: 140, order: 8 },
  { id: 'trang_thai', label: i18n.t('taiKhoan.columns.trangThai'), visible: true, minWidth: 90, maxWidth: 120, order: 9 },
  { id: 'tg_cap_nhat', label: i18n.t('taiKhoan.columns.tgCapNhat'), visible: true, minWidth: 100, maxWidth: 140, order: 10 },
  { id: 'actions', label: '', visible: true, minWidth: 90, maxWidth: 100, order: 11 },
];

const initialFilters: TaiKhoanFilters = {
  status: [],
  loai: [],
};

export const useTaiKhoanStore = createGenericStore<TaiKhoanFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
