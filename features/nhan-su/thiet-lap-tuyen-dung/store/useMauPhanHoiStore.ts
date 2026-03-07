import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface MauPhanHoiFilters {
  status: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma', label: i18n.t('thietLapTuyenDung.mauPhanHoi.store.maCol'), visible: true, minWidth: 120, order: 0 },
  { id: 'ten_loai', label: i18n.t('thietLapTuyenDung.mauPhanHoi.store.tenLoaiCol'), visible: true, minWidth: 160, order: 1 },
  { id: 'tieu_de', label: i18n.t('thietLapTuyenDung.mauPhanHoi.store.tieuDeCol'), visible: true, minWidth: 220, order: 2 },
  { id: 'trang_thai', label: i18n.t('thietLapTuyenDung.mauPhanHoi.store.statusCol'), visible: true, minWidth: 120, order: 3 },
  { id: 'tg_cap_nhat', label: i18n.t('thietLapTuyenDung.mauPhanHoi.store.updatedCol'), visible: false, minWidth: 140, order: 4 },
];

const initialFilters: MauPhanHoiFilters = {
  status: [],
};

export const useMauPhanHoiStore = createGenericStore<MauPhanHoiFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
