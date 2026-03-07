import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface LoaiTaiLieuFilters {
  status: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma', label: i18n.t('thietLapTaiLieu.loai.store.maCol'), visible: true, minWidth: 100, order: 0 },
  { id: 'ten', label: i18n.t('thietLapTaiLieu.loai.store.tenCol'), visible: true, minWidth: 180, order: 1 },
  { id: 'ghi_chu', label: i18n.t('thietLapTaiLieu.loai.store.noteCol'), visible: true, minWidth: 200, order: 2 },
  { id: 'trang_thai', label: i18n.t('thietLapTaiLieu.loai.store.statusCol'), visible: true, minWidth: 110, order: 3 },
  { id: 'tg_cap_nhat', label: i18n.t('thietLapTaiLieu.loai.store.updatedCol'), visible: false, minWidth: 140, order: 4 },
];

const initialFilters: LoaiTaiLieuFilters = {
  status: [],
};

export const useLoaiTaiLieuStore = createGenericStore<LoaiTaiLieuFilters>(initialFilters, DEFAULT_COLUMNS);
