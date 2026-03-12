/**
 * Service trạng thái thanh toán đối tác – sử dụng Supabase (fp_mh_trang_thai_thanh_toan_doi_tac).
 */
import type { TrangThaiThanhToanDoiTacFormValues } from '../core/schema';
import {
  getTrangThaiThanhToanDoiTacList as getListSupabase,
  createTrangThaiThanhToanDoiTac as createSupabase,
  updateTrangThaiThanhToanDoiTac as updateSupabase,
  updateTrangThaiThanhToanDoiTacStatus as updateStatusSupabase,
  deleteTrangThaiThanhToanDoiTacList as deleteListSupabase,
} from './trang-thai-thanh-toan-doi-tac-supabase.service';

export const getTrangThaiThanhToanDoiTacList = getListSupabase;
export const createTrangThaiThanhToanDoiTac = (data: TrangThaiThanhToanDoiTacFormValues) => createSupabase(data);
export const updateTrangThaiThanhToanDoiTac = updateSupabase;
export const updateTrangThaiThanhToanDoiTacStatus = updateStatusSupabase;
export const deleteTrangThaiThanhToanDoiTacList = deleteListSupabase;
