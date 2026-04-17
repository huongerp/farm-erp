import {
  getDiemCongTruRecords as getDiemCongTruRecordsSupabase,
  createDiemCongTruRecord as createDiemCongTruRecordSupabase,
  updateDiemCongTruRecord as updateDiemCongTruRecordSupabase,
  deleteDiemCongTruRecords as deleteDiemCongTruRecordsSupabase,
} from './diem-cong-tru-supabase.service';
import { getPayrollPointGroups } from '../../thiet-lap-cong-luong/services/payroll-point-group-service';

export const getDiemCongTruRecords = getDiemCongTruRecordsSupabase;

export const getPayrollPointGroupsForModule = getPayrollPointGroups;

export const createDiemCongTruRecord = (
  data: Parameters<typeof createDiemCongTruRecordSupabase>[0],
  id_nguoi_tao?: string
) => createDiemCongTruRecordSupabase(data, id_nguoi_tao);

export const updateDiemCongTruRecord = updateDiemCongTruRecordSupabase;

export const deleteDiemCongTruRecords = deleteDiemCongTruRecordsSupabase;
