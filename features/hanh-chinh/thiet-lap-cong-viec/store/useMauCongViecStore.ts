import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface MauCongViecFilters {
  status: string[];
  uu_tien: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_mau', label: i18n.t('thietLapCongViec.mau.store.tenCol'), visible: true, minWidth: 160, order: 0 },
  { id: 'tieu_de_mac_dinh', label: i18n.t('thietLapCongViec.mau.store.tieuDeCol'), visible: true, minWidth: 200, order: 1 },
  { id: 'uu_tien_mac_dinh', label: i18n.t('thietLapCongViec.mau.store.uuTienCol'), visible: true, minWidth: 120, order: 2 },
  { id: 'trang_thai_mac_dinh', label: i18n.t('thietLapCongViec.mau.store.statusCol'), visible: true, minWidth: 110, order: 3 },
  { id: 'tg_cap_nhat', label: i18n.t('thietLapCongViec.mau.store.updatedCol'), visible: false, minWidth: 140, order: 4 },
];

const initialFilters: MauCongViecFilters = {
  status: [],
  uu_tien: [],
};

export const useMauCongViecStore = createGenericStore<MauCongViecFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
