import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface HangMucThuChiFilters {
  status: string[];
  loai: string[];
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten', label: i18n.t('thietLapQuy.hangMuc.store.tenCol'), visible: true, minWidth: 200, order: 0 },
  { id: 'loai', label: i18n.t('thietLapQuy.hangMuc.store.loaiCol'), visible: true, minWidth: 110, order: 1 },
  { id: 'thu_tu', label: i18n.t('thietLapQuy.hangMuc.store.thuTuCol'), visible: true, minWidth: 90, order: 2 },
  { id: 'ghi_chu', label: i18n.t('thietLapQuy.hangMuc.store.noteCol'), visible: true, minWidth: 220, order: 3 },
  { id: 'trang_thai', label: i18n.t('thietLapQuy.hangMuc.store.statusCol'), visible: true, minWidth: 120, order: 4 },
  { id: 'tg_cap_nhat', label: i18n.t('thietLapQuy.hangMuc.store.updatedCol'), visible: false, minWidth: 140, order: 5 },
];

export const useHangMucThuChiStore = createGenericStore<HangMucThuChiFilters>(
  { status: [], loai: [] },
  DEFAULT_COLUMNS,
  'table-thiet-lap-quy-hang-muc-thu-chi'
);
