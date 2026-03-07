import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface ChamDiemKpiMyFilters {
  yearMonth: string;
  danhGia: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'period', label: i18n.t('chamDiemKpi.store.periodCol'), visible: true, minWidth: 100, order: 0 },
  { id: 'ten_phong_ban', label: i18n.t('chamDiemKpi.store.departmentCol'), visible: true, minWidth: 160, order: 1 },
  { id: 'ten_chuc_vu', label: i18n.t('chamDiemKpi.store.positionCol'), visible: true, minWidth: 140, order: 2 },
  { id: 'diem_kpi', label: i18n.t('chamDiemKpi.store.diemKpiCol'), visible: true, minWidth: 90, order: 3 },
  { id: 'tong_kpi', label: i18n.t('chamDiemKpi.store.tongKpiCol'), visible: true, minWidth: 90, order: 4 },
  { id: 'danh_gia', label: i18n.t('chamDiemKpi.store.danhGiaCol'), visible: true, minWidth: 100, order: 5 },
  { id: 'tg_cap_nhat', label: i18n.t('chamDiemKpi.store.updatedCol'), visible: false, minWidth: 130, order: 6 },
];

const initialFilters: ChamDiemKpiMyFilters = {
  yearMonth: '',
  danhGia: [],
};

export const useChamDiemKpiMyStore = createGenericStore<ChamDiemKpiMyFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
