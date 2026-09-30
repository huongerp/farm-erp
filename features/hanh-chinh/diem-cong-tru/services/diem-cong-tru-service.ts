import {
  getDiemCongTruRecords as getDiemCongTruRecordsDb,
  createDiemCongTruRecord as createDiemCongTruRecordDb,
  updateDiemCongTruRecord as updateDiemCongTruRecordDb,
  deleteDiemCongTruRecords as deleteDiemCongTruRecordsDb,
} from './diem-cong-tru-db.service';
import { getPayrollPointGroups } from '../../thiet-lap-cong-luong/services/payroll-point-group-service';

export const getDiemCongTruRecords = getDiemCongTruRecordsDb;

export const getPayrollPointGroupsForModule = getPayrollPointGroups;

export const createDiemCongTruRecord = (
  data: Parameters<typeof createDiemCongTruRecordDb>[0],
  id_nguoi_tao?: string
) => createDiemCongTruRecordDb(data, id_nguoi_tao);

export const updateDiemCongTruRecord = updateDiemCongTruRecordDb;

export const deleteDiemCongTruRecords = deleteDiemCongTruRecordsDb;

export { getDiemCongTruPage } from './diem-cong-tru-db.service';
