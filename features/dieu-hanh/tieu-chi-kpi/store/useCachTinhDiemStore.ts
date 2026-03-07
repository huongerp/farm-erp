import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface CachTinhDiemFilters {
  searchOnly: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'thu_tu', label: i18n.t('tieuChiKpi.thietLapCtd.colThuTu'), visible: true, minWidth: 70, maxWidth: 90, order: 0 },
  { id: 'ma', label: i18n.t('tieuChiKpi.thietLapCtd.colMa'), visible: true, minWidth: 120, maxWidth: 160, order: 1 },
  { id: 'ten', label: i18n.t('tieuChiKpi.thietLapCtd.colTen'), visible: true, minWidth: 140, maxWidth: 220, order: 2 },
  { id: 'mo_ta', label: i18n.t('tieuChiKpi.thietLapCtd.colMoTa'), visible: true, minWidth: 160, maxWidth: 320, order: 3 },
];

const initialFilters: CachTinhDiemFilters = {
  searchOnly: false,
};

export const useCachTinhDiemStore = createGenericStore<CachTinhDiemFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
