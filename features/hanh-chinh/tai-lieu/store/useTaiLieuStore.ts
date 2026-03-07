import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface TaiLieuFilters {
  status: string[];
  id_loai: string[];
  id_ho_so: string;
  id_trang_thai: string;
  id_phong_ban: string;
  /** Hướng: noi_bo | den | di */
  huong: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma_so', label: i18n.t('taiLieu.store.maSoCol'), visible: true, minWidth: 100, order: 0 },
  { id: 'trich_yeu', label: i18n.t('taiLieu.store.trichYeuCol'), visible: true, minWidth: 220, order: 1 },
  { id: 'huong', label: i18n.t('taiLieu.store.huongCol'), visible: true, minWidth: 120, order: 2 },
  { id: 'ten_loai', label: i18n.t('taiLieu.store.loaiCol'), visible: true, minWidth: 120, order: 3 },
  { id: 'ten_nhom_tai_lieu', label: i18n.t('taiLieu.store.nhomCol'), visible: true, minWidth: 120, order: 4 },
  { id: 'ten_trang_thai', label: i18n.t('taiLieu.store.trangThaiCol'), visible: true, minWidth: 110, order: 5 },
  { id: 'ten_phong_ban', label: i18n.t('taiLieu.store.phongQuanLyCol'), visible: true, minWidth: 140, order: 6 },
  { id: 'phan_quyen', label: i18n.t('taiLieu.store.phanQuyenCol'), visible: true, minWidth: 120, order: 7 },
  { id: 'so_den', label: i18n.t('taiLieu.store.soDenCol'), visible: true, minWidth: 100, order: 8 },
  { id: 'so_di', label: i18n.t('taiLieu.store.soDiCol'), visible: true, minWidth: 100, order: 9 },
  { id: 'ngay_den', label: i18n.t('taiLieu.store.ngayDenCol'), visible: true, minWidth: 110, order: 10 },
  { id: 'ngay_ky', label: i18n.t('taiLieu.store.ngayKyCol'), visible: true, minWidth: 110, order: 11 },
  { id: 'tg_cap_nhat', label: i18n.t('taiLieu.store.updatedCol'), visible: false, minWidth: 140, order: 12 },
];

const initialFilters: TaiLieuFilters = {
  status: [],
  id_loai: [],
  id_ho_so: '',
  id_trang_thai: '',
  id_phong_ban: '',
  huong: '',
};

export const useTaiLieuStore = createGenericStore<TaiLieuFilters>(initialFilters, DEFAULT_COLUMNS);
