import type { TienDoMuaHangFormValues } from '../core/schema';
import {
  getTienDoMuaHangList as getListDb,
  createTienDoMuaHang as createDb,
  updateTienDoMuaHang as updateDb,
  updateTienDoMuaHangStatus as updateStatusDb,
  deleteTienDoMuaHangList as deleteListDb,
} from './tien-do-mua-hang-db.service';

export const getTienDoMuaHangList = getListDb;
export const createTienDoMuaHang = (data: TienDoMuaHangFormValues) => createDb(data);
export const updateTienDoMuaHang = updateDb;
export const updateTienDoMuaHangStatus = updateStatusDb;
export const deleteTienDoMuaHangList = deleteListDb;
