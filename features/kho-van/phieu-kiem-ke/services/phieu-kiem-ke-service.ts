/**
 * Service phiếu kiểm kê – sử dụng Supabase.
 */
import type { PhieuKiemKeFormValues } from '../core/schema';
import {
  getAllPhieuKiemKeSupabase,
  getPhieuKiemKeByIdSupabase,
  createPhieuKiemKeSupabase,
  updatePhieuKiemKeSupabase,
  deletePhieuKiemKeSupabase,
  deletePhieuKiemKeManySupabase,
  getNextSoPhieuPhieuKiemKe,
} from './phieu-kiem-ke-supabase.service';

export const getAllPhieuKiemKe = getAllPhieuKiemKeSupabase;
export const getPhieuKiemKeById = getPhieuKiemKeByIdSupabase;
export const createPhieuKiemKe = (data: PhieuKiemKeFormValues) => createPhieuKiemKeSupabase(data);
export const updatePhieuKiemKe = updatePhieuKiemKeSupabase;
export const deletePhieuKiemKe = deletePhieuKiemKeSupabase;
export const deletePhieuKiemKeMany = deletePhieuKiemKeManySupabase;
export { getNextSoPhieuPhieuKiemKe };
