import type { HangMucThuChiFormValues } from '../core/schema';
import {
  getHangMucThuChiList as getListDb,
  createHangMucThuChi as createDb,
  updateHangMucThuChi as updateDb,
  updateHangMucThuChiStatus as updateStatusDb,
  deleteHangMucThuChiList as deleteListDb,
} from './hang-muc-thu-chi-db.service';

export const getHangMucThuChiList = getListDb;
export const createHangMucThuChi = (data: HangMucThuChiFormValues) => createDb(data);
export const updateHangMucThuChi = updateDb;
export const updateHangMucThuChiStatus = updateStatusDb;
export const deleteHangMucThuChiList = deleteListDb;
