import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DanhMucTaiChinhFilters {
  loai: '' | 'thu' | 'chi';
  status: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'thu_tu', label: i18n.t('danhMucTaiChinh.columns.thuTu'), visible: true, minWidth: 80, maxWidth: 100, order: 0 },
  { id: 'ten_danh_muc', label: i18n.t('danhMucTaiChinh.columns.tenDanhMuc'), visible: true, minWidth: 180, maxWidth: 320, order: 1 },
  { id: 'ma_danh_muc', label: i18n.t('danhMucTaiChinh.columns.maDanhMuc'), visible: true, minWidth: 120, maxWidth: 180, order: 2 },
  { id: 'loai', label: i18n.t('danhMucTaiChinh.columns.loai'), visible: true, minWidth: 90, maxWidth: 120, order: 3 },
  { id: 'ten_cha', label: i18n.t('danhMucTaiChinh.columns.tenCha'), visible: true, minWidth: 140, maxWidth: 260, order: 4 },
  { id: 'mo_ta', label: i18n.t('danhMucTaiChinh.columns.moTa'), visible: true, minWidth: 160, maxWidth: 280, order: 5 },
  { id: 'quyen_xem', label: i18n.t('danhMucTaiChinh.columns.quyenXem'), visible: true, minWidth: 140, maxWidth: 240, order: 6 },
  { id: 'quyen_quan_ly', label: i18n.t('danhMucTaiChinh.columns.quyenQuanLy'), visible: true, minWidth: 140, maxWidth: 240, order: 7 },
  { id: 'trang_thai', label: i18n.t('danhMucTaiChinh.columns.trangThai'), visible: true, minWidth: 100, maxWidth: 140, order: 8 },
  { id: 'tg_cap_nhat', label: i18n.t('danhMucTaiChinh.columns.tgCapNhat'), visible: true, minWidth: 100, maxWidth: 140, order: 9 },
];

const initialFilters: DanhMucTaiChinhFilters = {
  loai: '',
  status: [],
};

export const useDanhMucTaiChinhStore = createGenericStore<DanhMucTaiChinhFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
