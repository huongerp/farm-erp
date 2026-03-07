import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface EmployeeAttendanceFilters {
  department: string[];
  branch: string[];
  month: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'user_name', label: i18n.t('attendance.management.employeeCol'), visible: true, minWidth: 180, order: 0 },
  { id: 'department_name', label: i18n.t('attendance.management.departmentCol'), visible: true, minWidth: 160, order: 1 },
  { id: 'branch_name', label: i18n.t('attendance.management.branchCol'), visible: true, minWidth: 160, order: 2 },
  { id: 'total_days', label: i18n.t('attendance.management.daysCol'), visible: true, minWidth: 120, order: 3 },
  { id: 'total_hours', label: i18n.t('attendance.management.hoursCol'), visible: true, minWidth: 120, order: 4 },
  { id: 'late_count', label: i18n.t('attendance.management.lateCol'), visible: true, minWidth: 120, order: 5 },
];

const initialFilters: EmployeeAttendanceFilters = {
  department: [],
  branch: [],
  month: '',
};

export const useEmployeeAttendanceStore = createGenericStore<EmployeeAttendanceFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
