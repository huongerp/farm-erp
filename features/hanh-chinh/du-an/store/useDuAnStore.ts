import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DuAnFilters {
  status: string[];
  id_phong_ban: string[];
  /** Năm lọc theo ngày bắt đầu (vd: ['2024','2025']) */
  nam_bat_dau: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma_du_an', label: i18n.t('duAn.store.maCol'), visible: true, minWidth: 120, order: 0 },
  { id: 'ten_du_an', label: i18n.t('duAn.store.tenCol'), visible: true, minWidth: 200, order: 1 },
  { id: 'ten_phong_ban', label: i18n.t('duAn.store.phongBanCol'), visible: true, minWidth: 160, order: 2 },
  { id: 'ngay_bat_dau', label: i18n.t('duAn.store.ngayBatDauCol'), visible: true, minWidth: 110, order: 3 },
  { id: 'ngay_ket_thuc', label: i18n.t('duAn.store.ngayKetThucCol'), visible: true, minWidth: 110, order: 4 },
  { id: 'trang_thai', label: i18n.t('duAn.store.statusCol'), visible: true, minWidth: 110, order: 5 },
  { id: 'tg_cap_nhat', label: i18n.t('duAn.store.updatedCol'), visible: false, minWidth: 140, order: 6 },
];

const initialFilters: DuAnFilters = {
  status: [],
  id_phong_ban: [],
  nam_bat_dau: [],
};

export const useDuAnStore = createGenericStore<DuAnFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
