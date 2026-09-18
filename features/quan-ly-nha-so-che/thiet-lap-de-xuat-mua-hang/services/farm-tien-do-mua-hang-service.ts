import type { FarmTienDoMuaHangFormValues } from '../core/schema';
import {
  getFarmTienDoMuaHangList as getListSupabase,
  createFarmTienDoMuaHang as createSupabase,
  updateFarmTienDoMuaHang as updateSupabase,
  updateFarmTienDoMuaHangStatus as updateStatusSupabase,
  deleteFarmTienDoMuaHangList as deleteListSupabase,
} from './farm-tien-do-mua-hang-supabase.service';

export const getFarmTienDoMuaHangList = getListSupabase;
export const createFarmTienDoMuaHang = (data: FarmTienDoMuaHangFormValues) => createSupabase(data);
export const updateFarmTienDoMuaHang = updateSupabase;
export const updateFarmTienDoMuaHangStatus = updateStatusSupabase;
export const deleteFarmTienDoMuaHangList = deleteListSupabase;
