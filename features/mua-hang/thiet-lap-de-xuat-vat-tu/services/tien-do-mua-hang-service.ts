import type { TienDoMuaHangFormValues } from '../core/schema';
import {
  getTienDoMuaHangList as getListSupabase,
  createTienDoMuaHang as createSupabase,
  updateTienDoMuaHang as updateSupabase,
  updateTienDoMuaHangStatus as updateStatusSupabase,
  deleteTienDoMuaHangList as deleteListSupabase,
} from './tien-do-mua-hang-supabase.service';

export const getTienDoMuaHangList = getListSupabase;
export const createTienDoMuaHang = (data: TienDoMuaHangFormValues) => createSupabase(data);
export const updateTienDoMuaHang = updateSupabase;
export const updateTienDoMuaHangStatus = updateStatusSupabase;
export const deleteTienDoMuaHangList = deleteListSupabase;
