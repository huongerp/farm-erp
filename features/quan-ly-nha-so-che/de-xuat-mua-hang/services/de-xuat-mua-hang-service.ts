/**
 * Service phiếu đề xuất vật tư – sử dụng Supabase (fp_farm_de_xuat_mua_hang, fp_farm_de_xuat_mua_hang_chi_tiet).
 */
import type { PaginatedTableResult } from '../../../../lib/db';
import type { DeXuatMuaHangFormValues } from '../core/schema';
import type { DeXuatMuaHang, DeXuatMuaHangChiTietRow } from '../core/types';
import {
  getAllDeXuatMuaHangSupabase,
  getDeXuatMuaHangByIdSupabase,
  getDeXuatMuaHangPageSupabase,
  fetchAllDeXuatMuaHangForListQuerySupabase,
  createDeXuatMuaHangSupabase,
  updateDeXuatMuaHangSupabase,
  deleteDeXuatMuaHangSupabase,
  deleteDeXuatMuaHangManySupabase,
  updateDeXuatMuaHangTrangThaiSupabase,
  updateDeXuatMuaHangTrangThaiManySupabase,
  getAllDeXuatMuaHangChiTietSupabase,
  getDeXuatMuaHangChiTietPageSupabase,
  fetchAllDeXuatMuaHangChiTietForListQuerySupabase,
} from './de-xuat-mua-hang-supabase.service';
import type { DeXuatMuaHangChiTietListServerQuery, DeXuatMuaHangListServerQuery } from './de-xuat-mua-hang-list-query';
import { buildDeXuatMuaHangChiTietListServerQuery, buildDeXuatMuaHangListServerQuery } from './de-xuat-mua-hang-list-query';

export type { DeXuatMuaHangChiTietListServerQuery, DeXuatMuaHangListServerQuery };
export { buildDeXuatMuaHangChiTietListServerQuery, buildDeXuatMuaHangListServerQuery };

export const getAllDeXuatMuaHang = getAllDeXuatMuaHangSupabase;
export async function getDeXuatMuaHangPage(
  page: number,
  pageSize?: number,
  listQuery?: DeXuatMuaHangListServerQuery
): Promise<PaginatedTableResult<DeXuatMuaHang>> {
  return getDeXuatMuaHangPageSupabase(page, pageSize ?? 50, listQuery);
}
export const fetchAllDeXuatMuaHangForListQuery = fetchAllDeXuatMuaHangForListQuerySupabase;
export const getAllDeXuatMuaHangChiTiet = getAllDeXuatMuaHangChiTietSupabase;
export async function getDeXuatMuaHangChiTietPage(
  page: number,
  pageSize?: number,
  listQuery?: DeXuatMuaHangChiTietListServerQuery
): Promise<PaginatedTableResult<DeXuatMuaHangChiTietRow>> {
  return getDeXuatMuaHangChiTietPageSupabase(page, pageSize ?? 100, listQuery);
}
export const fetchAllDeXuatMuaHangChiTietForListQuery = fetchAllDeXuatMuaHangChiTietForListQuerySupabase;
export const getDeXuatMuaHangById = getDeXuatMuaHangByIdSupabase;
export const createDeXuatMuaHang = (data: DeXuatMuaHangFormValues) => createDeXuatMuaHangSupabase(data);
export const updateDeXuatMuaHang = updateDeXuatMuaHangSupabase;
export const deleteDeXuatMuaHang = deleteDeXuatMuaHangSupabase;
export const deleteDeXuatMuaHangMany = deleteDeXuatMuaHangManySupabase;
export const updateDeXuatMuaHangTrangThai = updateDeXuatMuaHangTrangThaiSupabase;
export const updateDeXuatMuaHangTrangThaiMany = updateDeXuatMuaHangTrangThaiManySupabase;
export type {
  UpdateDeXuatMuaHangTrangThaiOptions,
  UpdateDeXuatMuaHangTrangThaiManyResult,
} from './de-xuat-mua-hang-supabase.service';
