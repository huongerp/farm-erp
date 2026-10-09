import type { FarmTienDoMuaHangFormValues } from '../core/schema';
import {
  getFarmTienDoMuaHangList as getListDb,
  createFarmTienDoMuaHang as createDb,
  updateFarmTienDoMuaHang as updateDb,
  updateFarmTienDoMuaHangStatus as updateStatusDb,
  deleteFarmTienDoMuaHangList as deleteListDb,
} from './farm-tien-do-mua-hang-db.service';
import type { KhoBienThe } from '../../kho-bien-the/bien-the';

export const getFarmTienDoMuaHangList = getListDb;
export const createFarmTienDoMuaHang = (bt: KhoBienThe, data: FarmTienDoMuaHangFormValues) => createDb(bt, data);
export const updateFarmTienDoMuaHang = updateDb;
export const updateFarmTienDoMuaHangStatus = updateStatusDb;
export const deleteFarmTienDoMuaHangList = deleteListDb;
