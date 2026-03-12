/**
 * Service thanh toán đối tác – sử dụng Supabase (fp_mh_thanh_toan_doi_tac).
 */
import type { ThanhToanDoiTacFormValues } from '../core/schema';
import {
  getAllThanhToanDoiTac as getAllSupabase,
  getThanhToanDoiTacById as getByIdSupabase,
  createThanhToanDoiTac as createSupabase,
  updateThanhToanDoiTac as updateSupabase,
  deleteThanhToanDoiTac as deleteSupabase,
  deleteThanhToanDoiTacMany as deleteManySupabase,
} from './thanh-toan-doi-tac-supabase.service';

export const getAllThanhToanDoiTac = getAllSupabase;
export const getThanhToanDoiTacById = getByIdSupabase;
export const createThanhToanDoiTac = (data: ThanhToanDoiTacFormValues) => createSupabase(data);
export const updateThanhToanDoiTac = updateSupabase;
export const deleteThanhToanDoiTac = deleteSupabase;
export const deleteThanhToanDoiTacMany = deleteManySupabase;
