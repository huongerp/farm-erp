import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DonViTinhFilters {
  searchOnly: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'thu_tu', label: i18n.t('tieuChiKpi.thietLapDvt.colThuTu'), visible: true, minWidth: 70, maxWidth: 90, order: 0 },
  { id: 'ma', label: i18n.t('tieuChiKpi.thietLapDvt.colMa'), visible: true, minWidth: 100, maxWidth: 140, order: 1 },
  { id: 'ten', label: i18n.t('tieuChiKpi.thietLapDvt.colTen'), visible: true, minWidth: 120, maxWidth: 200, order: 2 },
  { id: 'ky_hieu', label: i18n.t('tieuChiKpi.thietLapDvt.colKyHieu'), visible: true, minWidth: 80, maxWidth: 120, order: 3 },
];

const initialFilters: DonViTinhFilters = {
  searchOnly: false,
};

export const useDonViTinhStore = createGenericStore<DonViTinhFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
