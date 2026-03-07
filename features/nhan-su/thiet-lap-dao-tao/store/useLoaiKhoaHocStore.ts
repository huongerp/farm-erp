import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface LoaiKhoaHocFilters {
  status: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma', label: i18n.t('thietLapDaoTao.loaiKhoaHoc.store.maCol'), visible: true, minWidth: 140, order: 0 },
  { id: 'ten', label: i18n.t('thietLapDaoTao.loaiKhoaHoc.store.tenCol'), visible: true, minWidth: 220, order: 1 },
  { id: 'thu_tu', label: i18n.t('thietLapDaoTao.loaiKhoaHoc.store.thuTuCol'), visible: true, minWidth: 100, order: 2 },
  { id: 'ghi_chu', label: i18n.t('thietLapDaoTao.loaiKhoaHoc.store.noteCol'), visible: true, minWidth: 200, order: 3 },
  { id: 'trang_thai', label: i18n.t('thietLapDaoTao.loaiKhoaHoc.store.statusCol'), visible: true, minWidth: 120, order: 4 },
  { id: 'tg_cap_nhat', label: i18n.t('thietLapDaoTao.loaiKhoaHoc.store.updatedCol'), visible: false, minWidth: 140, order: 5 },
];

const initialFilters: LoaiKhoaHocFilters = {
  status: [],
};

export const useLoaiKhoaHocStore = createGenericStore<LoaiKhoaHocFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
