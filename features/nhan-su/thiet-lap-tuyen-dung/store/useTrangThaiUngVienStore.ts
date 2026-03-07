import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface TrangThaiUngVienFilters {
  status: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma', label: i18n.t('thietLapTuyenDung.trangThaiUngVien.store.maCol'), visible: true, minWidth: 140, order: 0 },
  { id: 'ten', label: i18n.t('thietLapTuyenDung.trangThaiUngVien.store.tenCol'), visible: true, minWidth: 220, order: 1 },
  { id: 'thu_tu', label: i18n.t('thietLapTuyenDung.trangThaiUngVien.store.thuTuCol'), visible: true, minWidth: 100, order: 2 },
  { id: 'loai_ket_qua', label: i18n.t('thietLapTuyenDung.trangThaiUngVien.store.loaiKetQuaCol'), visible: true, minWidth: 140, order: 3 },
  { id: 'ghi_chu', label: i18n.t('thietLapTuyenDung.trangThaiUngVien.store.noteCol'), visible: true, minWidth: 200, order: 4 },
  { id: 'trang_thai', label: i18n.t('thietLapTuyenDung.trangThaiUngVien.store.statusCol'), visible: true, minWidth: 120, order: 5 },
  { id: 'tg_cap_nhat', label: i18n.t('thietLapTuyenDung.trangThaiUngVien.store.updatedCol'), visible: false, minWidth: 140, order: 6 },
];

const initialFilters: TrangThaiUngVienFilters = {
  status: [],
};

export const useTrangThaiUngVienStore = createGenericStore<TrangThaiUngVienFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
