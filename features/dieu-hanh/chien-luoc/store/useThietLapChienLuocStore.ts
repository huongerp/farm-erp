import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface ThietLapFilters {
  nhom: string | null;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'thu_tu', label: i18n.t('chienLuoc.thietLap.colThuTu'), visible: true, minWidth: 70, maxWidth: 90, order: 0 },
  { id: 'nhom', label: i18n.t('chienLuoc.thietLap.colNhom'), visible: true, minWidth: 140, maxWidth: 200, order: 1 },
  { id: 'ma', label: i18n.t('chienLuoc.thietLap.colMa'), visible: true, minWidth: 100, maxWidth: 150, order: 2 },
  { id: 'ten', label: i18n.t('chienLuoc.thietLap.colTen'), visible: true, minWidth: 180, maxWidth: 280, order: 3 },
  { id: 'mo_ta', label: i18n.t('chienLuoc.thietLap.colMoTa'), visible: true, minWidth: 160, maxWidth: 320, order: 4 },
  { id: 'cau_chien_luoc_mau', label: i18n.t('chienLuoc.thietLap.cauChienLuocMau'), visible: true, minWidth: 200, maxWidth: 400, order: 5 },
];

const initialFilters: ThietLapFilters = {
  nhom: null,
};

export const useThietLapChienLuocStore = createGenericStore<ThietLapFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
