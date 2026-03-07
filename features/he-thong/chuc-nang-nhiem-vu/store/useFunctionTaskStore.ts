import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

const functionColumns: ColumnConfig[] = [
  { id: 'ma_chuc_nang', label: i18n.t('chucNangNhiemVu.col.code'), visible: true, minWidth: 120, order: 0 },
  { id: 'ten_chuc_nang', label: i18n.t('chucNangNhiemVu.col.name'), visible: true, minWidth: 200, order: 1 },
  { id: 'mo_ta', label: i18n.t('chucNangNhiemVu.form.description'), visible: true, minWidth: 200, order: 2 },
  { id: 'thu_tu', label: i18n.t('chucNangNhiemVu.col.order'), visible: true, minWidth: 80, order: 3 },
  { id: 'trang_thai', label: i18n.t('chucNangNhiemVu.col.status'), visible: true, minWidth: 100, order: 4 },
  { id: 'actions', label: i18n.t('chucNangNhiemVu.col.actions'), visible: true, minWidth: 100, order: 5 },
];

const taskColumns: ColumnConfig[] = [
  { id: 'ten_chuc_nang', label: i18n.t('chucNangNhiemVu.col.function'), visible: true, minWidth: 160, order: 0 },
  { id: 'ma_nhiem_vu', label: i18n.t('chucNangNhiemVu.col.code'), visible: true, minWidth: 120, order: 1 },
  { id: 'ten_nhiem_vu', label: i18n.t('chucNangNhiemVu.col.name'), visible: true, minWidth: 200, order: 2 },
  { id: 'mo_ta', label: i18n.t('chucNangNhiemVu.form.description'), visible: true, minWidth: 200, order: 3 },
  { id: 'thu_tu', label: i18n.t('chucNangNhiemVu.col.order'), visible: true, minWidth: 80, order: 4 },
  { id: 'trang_thai', label: i18n.t('chucNangNhiemVu.col.status'), visible: true, minWidth: 100, order: 5 },
  { id: 'actions', label: i18n.t('chucNangNhiemVu.col.actions'), visible: true, minWidth: 100, order: 6 },
];

const kpiColumns: ColumnConfig[] = [
  { id: 'ten_chi_so', label: i18n.t('chucNangNhiemVu.col.name'), visible: true, minWidth: 200, order: 0 },
  { id: 'don_vi', label: i18n.t('chucNangNhiemVu.col.unit'), visible: true, minWidth: 100, order: 1 },
  { id: 'chi_tieu_nguong', label: i18n.t('chucNangNhiemVu.col.target'), visible: true, minWidth: 140, order: 2 },
  { id: 'chu_ky_danh_gia', label: i18n.t('chucNangNhiemVu.col.cycle'), visible: true, minWidth: 120, order: 3 },
  { id: 'thu_tu', label: i18n.t('chucNangNhiemVu.col.order'), visible: true, minWidth: 80, order: 4 },
  { id: 'trang_thai', label: i18n.t('chucNangNhiemVu.col.status'), visible: true, minWidth: 100, order: 5 },
  { id: 'actions', label: i18n.t('chucNangNhiemVu.col.actions'), visible: true, minWidth: 100, order: 6 },
];

export const useFunctionTableStore = createGenericStore<Record<string, never>>({}, functionColumns);
export const useTaskTableStore = createGenericStore<Record<string, never>>({}, taskColumns);
export const useKpiTableStore = createGenericStore<Record<string, never>>({}, kpiColumns);
