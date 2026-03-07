import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface AttendanceHistoryFilters {
  status: string[];
  branch: string[];
  month: string;
}

const getCurrentMonthKey = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
};

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'date', label: i18n.t('attendance.history.dateCol'), visible: true, minWidth: 120, order: 0 },
  { id: 'check_in', label: i18n.t('attendance.history.checkInCol'), visible: true, minWidth: 120, order: 1 },
  { id: 'check_out', label: i18n.t('attendance.history.checkOutCol'), visible: true, minWidth: 120, order: 2 },
  { id: 'status', label: i18n.t('attendance.history.statusCol'), visible: true, minWidth: 120, order: 3 },
];

const initialFilters: AttendanceHistoryFilters = {
  status: [],
  branch: [],
  month: getCurrentMonthKey(),
};

export const useAttendanceHistoryStore = createGenericStore<AttendanceHistoryFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
