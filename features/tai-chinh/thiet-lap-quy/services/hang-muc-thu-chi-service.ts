import type { HangMucThuChiFormValues } from '../core/schema';
import {
  getHangMucThuChiList as getListSupabase,
  createHangMucThuChi as createSupabase,
  updateHangMucThuChi as updateSupabase,
  updateHangMucThuChiStatus as updateStatusSupabase,
  deleteHangMucThuChiList as deleteListSupabase,
} from './hang-muc-thu-chi-supabase.service';

export const getHangMucThuChiList = getListSupabase;
export const createHangMucThuChi = (data: HangMucThuChiFormValues) => createSupabase(data);
export const updateHangMucThuChi = updateSupabase;
export const updateHangMucThuChiStatus = updateStatusSupabase;
export const deleteHangMucThuChiList = deleteListSupabase;
