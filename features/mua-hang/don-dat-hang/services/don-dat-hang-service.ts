/**
 * Service đơn đặt hàng – sử dụng Supabase (fp_mh_don_dat_hang, fp_mh_don_dat_hang_chi_tiet).
 */
import type { DonDatHangFormValues } from '../core/schema';
import type { PaginatedTableResult } from '../../../../lib/supabase';
import type { ChiTietDonDatHangFlat, DonDatHang, DonDatHangTrangThai } from '../core/types';
import {
  getAllDonDatHangSupabase,
  getDonDatHangByIdSupabase,
  getDonDatHangPageSupabase,
  fetchAllDonDatHangForListQuerySupabase,
  getChiTietDonDatHangPageSupabase,
  fetchAllChiTietDonDatHangForListQuerySupabase,
  getPhanLoaiDonDatHangChiTietSupabase,
  createDonDatHangSupabase,
  updateDonDatHangSupabase,
  updateDonDatHangTrangThaiSupabase,
  deleteDonDatHangSupabase,
  deleteDonDatHangManySupabase,
  getNextSoPoDonDatHangSupabase,
  fetchChiTietForCategoryStatsSupabase,
} from './don-dat-hang-supabase.service';
export type { ChiTietCategoryStatsItem } from './don-dat-hang-supabase.service';
import { buildDonDatHangListServerQuery, type DonDatHangListServerQuery } from './don-dat-hang-list-query';

export type { DonDatHangListServerQuery };
export { buildDonDatHangListServerQuery };

/** Quy tắc số PO: PO-YYYY-NNNNN (năm + 5 chữ số). Có thể sửa mã khi tạo/sửa. */
export async function getNextSoPoFormatted(): Promise<string> {
  const n = await getNextSoPoDonDatHangSupabase();
  const year = new Date().getFullYear();
  return `PO-${year}-${String(n).padStart(5, '0')}`;
}

export const getAllDonDatHang = getAllDonDatHangSupabase;
export async function getDonDatHangPage(
  page: number,
  pageSize?: number,
  listQuery?: DonDatHangListServerQuery
): Promise<PaginatedTableResult<DonDatHang>> {
  return getDonDatHangPageSupabase(page, pageSize ?? 50, listQuery);
}

export const fetchAllDonDatHangForListQuery = fetchAllDonDatHangForListQuerySupabase;

export async function getChiTietDonDatHangPage(
  page: number,
  pageSize?: number,
  listQuery?: DonDatHangListServerQuery
): Promise<PaginatedTableResult<ChiTietDonDatHangFlat>> {
  return getChiTietDonDatHangPageSupabase(page, pageSize ?? 100, listQuery);
}

export const fetchAllChiTietDonDatHangForListQuery = fetchAllChiTietDonDatHangForListQuerySupabase;
export const getPhanLoaiDonDatHangChiTiet = getPhanLoaiDonDatHangChiTietSupabase;
export const getNextSoPoDonDatHang = getNextSoPoFormatted;
export const getDonDatHangById = getDonDatHangByIdSupabase;
export const createDonDatHang = (data: DonDatHangFormValues) => createDonDatHangSupabase(data);
export const updateDonDatHang = updateDonDatHangSupabase;
export const updateDonDatHangTrangThai = (
  id: string,
  trang_thai: DonDatHangTrangThai,
  options?: { ghi_chu?: string; notePrefix?: string }
) => updateDonDatHangTrangThaiSupabase(id, trang_thai, options);
export const deleteDonDatHang = deleteDonDatHangSupabase;
export const deleteDonDatHangMany = deleteDonDatHangManySupabase;
export const fetchChiTietForCategoryStats = fetchChiTietForCategoryStatsSupabase;
