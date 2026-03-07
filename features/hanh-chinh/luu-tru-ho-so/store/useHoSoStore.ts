import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface HoSoFilters {
  status: string[];
  id_phong_ban: string;
  id_tai_lieu: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma_ho_so', label: i18n.t('hoSo.store.maCol'), visible: true, minWidth: 120, order: 0 },
  { id: 'ten_ho_so', label: i18n.t('hoSo.store.tenCol'), visible: true, minWidth: 220, order: 1 },
  { id: 'ten_tai_lieu', label: i18n.t('hoSo.store.taiLieuCol'), visible: true, minWidth: 180, order: 2 },
  { id: 'ten_phong_ban', label: i18n.t('hoSo.store.phongQuanLyCol'), visible: true, minWidth: 140, order: 3 },
  { id: 'thoi_han_luu_tru', label: i18n.t('hoSo.store.thoiHanCol'), visible: true, minWidth: 120, order: 4 },
  { id: 'trang_thai', label: i18n.t('hoSo.store.statusCol'), visible: true, minWidth: 110, order: 5 },
  { id: 'tg_cap_nhat', label: i18n.t('hoSo.store.updatedCol'), visible: false, minWidth: 140, order: 6 },
];

const initialFilters: HoSoFilters = {
  status: [],
  id_phong_ban: '',
  id_tai_lieu: '',
};

export const useHoSoStore = createGenericStore<HoSoFilters>(initialFilters, DEFAULT_COLUMNS);
