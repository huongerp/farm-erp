import type { FarmTienDoMuaHangFormValues } from '../core/schema';
import {
  getFarmTienDoMuaHangList as getListDb,
  createFarmTienDoMuaHang as createDb,
  updateFarmTienDoMuaHang as updateDb,
  updateFarmTienDoMuaHangStatus as updateStatusDb,
  deleteFarmTienDoMuaHangList as deleteListDb,
} from './farm-tien-do-mua-hang-db.service';

export const getFarmTienDoMuaHangList = getListDb;
export const createFarmTienDoMuaHang = (data: FarmTienDoMuaHangFormValues) => createDb(data);
export const updateFarmTienDoMuaHang = updateDb;
export const updateFarmTienDoMuaHangStatus = updateStatusDb;
export const deleteFarmTienDoMuaHangList = deleteListDb;
