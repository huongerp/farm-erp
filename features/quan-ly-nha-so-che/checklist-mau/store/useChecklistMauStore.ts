import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma', label: i18n.t('checklistMau.col.ma'), visible: true, minWidth: 110, order: 0 },
  { id: 'ten', label: i18n.t('checklistMau.col.ten'), visible: true, minWidth: 220, order: 1 },
  { id: 'loai', label: i18n.t('checklistMau.col.loai'), visible: true, minWidth: 130, order: 2 },
  { id: 'dang_dung', label: i18n.t('checklistMau.col.dangDung'), visible: true, minWidth: 110, order: 3 },
  { id: 'thu_tu', label: i18n.t('checklistMau.col.thuTu'), visible: true, minWidth: 80, order: 4 },
  { id: 'so_muc', label: i18n.t('checklistMau.col.soMuc'), visible: true, minWidth: 72, order: 5 },
  { id: 'so_hang_muc', label: i18n.t('checklistMau.col.soHangMuc'), visible: true, minWidth: 90, order: 6 },
  { id: 'actions', label: '', visible: true, order: 7 },
];

// Danh sách ít dòng, lọc ở client — không cần bộ lọc server.
type ChecklistMauFilters = Record<string, never>;

const initialFilters: ChecklistMauFilters = {};

export const useChecklistMauStore = createGenericStore<ChecklistMauFilters>(
  initialFilters,
  DEFAULT_COLUMNS,
  'table-checklist-mau'
);
