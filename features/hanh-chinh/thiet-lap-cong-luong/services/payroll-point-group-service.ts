/**
 * Service nhóm điểm cộng trừ – sử dụng Supabase (fp_hr_thiet_lap_diem_cong_tru).
 */
import type { PayrollPointGroupFormValues } from '../core/schema';
import {
  getPayrollPointGroups as getPayrollPointGroupsSupabase,
  createPayrollPointGroup as createPayrollPointGroupSupabase,
  updatePayrollPointGroup as updatePayrollPointGroupSupabase,
  updatePayrollPointGroupStatus as updatePayrollPointGroupStatusSupabase,
  deletePayrollPointGroups as deletePayrollPointGroupsSupabase,
} from './payroll-point-group-supabase.service';

export const getPayrollPointGroups = getPayrollPointGroupsSupabase;
export const createPayrollPointGroup = (data: PayrollPointGroupFormValues) =>
  createPayrollPointGroupSupabase(data);
export const updatePayrollPointGroup = (id: string, data: PayrollPointGroupFormValues) =>
  updatePayrollPointGroupSupabase(id, data);
export const updatePayrollPointGroupStatus = updatePayrollPointGroupStatusSupabase;
export const deletePayrollPointGroups = deletePayrollPointGroupsSupabase;
