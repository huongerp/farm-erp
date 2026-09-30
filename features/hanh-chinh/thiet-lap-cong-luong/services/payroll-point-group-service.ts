/**
 * Service nhóm điểm cộng trừ – đọc/ghi DB (fp_hr_thiet_lap_diem_cong_tru).
 */
import type { PayrollPointGroupFormValues } from '../core/schema';
import {
  getPayrollPointGroups as getPayrollPointGroupsDb,
  createPayrollPointGroup as createPayrollPointGroupDb,
  updatePayrollPointGroup as updatePayrollPointGroupDb,
  updatePayrollPointGroupStatus as updatePayrollPointGroupStatusDb,
  deletePayrollPointGroups as deletePayrollPointGroupsDb,
} from './payroll-point-group-db.service';

export const getPayrollPointGroups = getPayrollPointGroupsDb;
export const createPayrollPointGroup = (data: PayrollPointGroupFormValues) =>
  createPayrollPointGroupDb(data);
export const updatePayrollPointGroup = (id: string, data: PayrollPointGroupFormValues) =>
  updatePayrollPointGroupDb(id, data);
export const updatePayrollPointGroupStatus = updatePayrollPointGroupStatusDb;
export const deletePayrollPointGroups = deletePayrollPointGroupsDb;
