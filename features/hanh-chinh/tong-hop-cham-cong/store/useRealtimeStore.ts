import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface RealtimeFilters {
  status: string[];
  department: string[];
  branch: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'user_name', label: i18n.t('attendance.realtime.employeeCol'), visible: true, minWidth: 180, order: 0 },
  { id: 'department_name', label: i18n.t('attendance.realtime.departmentCol'), visible: true, minWidth: 160, order: 1 },
  { id: 'branch_name', label: i18n.t('attendance.realtime.branchCol'), visible: true, minWidth: 160, order: 2 },
  { id: 'check_in', label: i18n.t('attendance.realtime.checkInCol'), visible: true, minWidth: 120, order: 3 },
  { id: 'status', label: i18n.t('attendance.realtime.statusCol'), visible: true, minWidth: 120, order: 4 },
];

const initialFilters: RealtimeFilters = {
  status: [],
  department: [],
  branch: [],
};

export const useRealtimeStore = createGenericStore<RealtimeFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
