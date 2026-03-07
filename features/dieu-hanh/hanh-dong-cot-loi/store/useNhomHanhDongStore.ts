import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface NhomHanhDongFilters {
  searchOnly: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'thu_tu', label: i18n.t('hanhDongCotLoi.thietLap.colThuTu'), visible: true, minWidth: 70, maxWidth: 90, order: 0 },
  { id: 'ma', label: i18n.t('hanhDongCotLoi.thietLap.colMa'), visible: true, minWidth: 120, maxWidth: 160, order: 1 },
  { id: 'ten', label: i18n.t('hanhDongCotLoi.thietLap.colTen'), visible: true, minWidth: 140, maxWidth: 220, order: 2 },
  { id: 'mo_ta', label: i18n.t('hanhDongCotLoi.thietLap.colMoTa'), visible: true, minWidth: 160, maxWidth: 320, order: 3 },
];

const initialFilters: NhomHanhDongFilters = {
  searchOnly: false,
};

export const useNhomHanhDongStore = createGenericStore<NhomHanhDongFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
