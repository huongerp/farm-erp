/**
 * Service phiếu đề xuất vật tư – sử dụng Supabase (fp_mh_phieu_de_xuat_vat_tu, fp_mh_phieu_de_xuat_vat_tu_chi_tiet).
 */
import type { PaginatedTableResult } from '../../../../lib/db';
import type { PhieuDeXuatVatTuFormValues } from '../core/schema';
import type { PhieuDeXuatVatTu, PhieuDeXuatVatTuChiTietRow } from '../core/types';
import {
  getAllPhieuDeXuatVatTuSupabase,
  getPhieuDeXuatVatTuByIdSupabase,
  getPhieuDeXuatVatTuPageSupabase,
  fetchAllPhieuDeXuatVatTuForListQuerySupabase,
  createPhieuDeXuatVatTuSupabase,
  updatePhieuDeXuatVatTuSupabase,
  deletePhieuDeXuatVatTuSupabase,
  deletePhieuDeXuatVatTuManySupabase,
  getAllPhieuDeXuatVatTuChiTietSupabase,
  getPhieuDeXuatVatTuChiTietPageSupabase,
  fetchAllPhieuDeXuatVatTuChiTietForListQuerySupabase,
} from './phieu-de-xuat-vat-tu-supabase.service';
import type { PhieuDeXuatChiTietListServerQuery, PhieuDeXuatVatTuListServerQuery } from './phieu-de-xuat-list-query';
import { buildPhieuDeXuatChiTietListServerQuery, buildPhieuDeXuatVatTuListServerQuery } from './phieu-de-xuat-list-query';

export type { PhieuDeXuatChiTietListServerQuery, PhieuDeXuatVatTuListServerQuery };
export { buildPhieuDeXuatChiTietListServerQuery, buildPhieuDeXuatVatTuListServerQuery };

export const getAllPhieuDeXuatVatTu = getAllPhieuDeXuatVatTuSupabase;
export async function getPhieuDeXuatVatTuPage(
  page: number,
  pageSize?: number,
  listQuery?: PhieuDeXuatVatTuListServerQuery
): Promise<PaginatedTableResult<PhieuDeXuatVatTu>> {
  return getPhieuDeXuatVatTuPageSupabase(page, pageSize ?? 50, listQuery);
}
export const fetchAllPhieuDeXuatVatTuForListQuery = fetchAllPhieuDeXuatVatTuForListQuerySupabase;
export const getAllPhieuDeXuatVatTuChiTiet = getAllPhieuDeXuatVatTuChiTietSupabase;
export async function getPhieuDeXuatVatTuChiTietPage(
  page: number,
  pageSize?: number,
  listQuery?: PhieuDeXuatChiTietListServerQuery
): Promise<PaginatedTableResult<PhieuDeXuatVatTuChiTietRow>> {
  return getPhieuDeXuatVatTuChiTietPageSupabase(page, pageSize ?? 100, listQuery);
}
export const fetchAllPhieuDeXuatVatTuChiTietForListQuery = fetchAllPhieuDeXuatVatTuChiTietForListQuerySupabase;
export const getPhieuDeXuatVatTuById = getPhieuDeXuatVatTuByIdSupabase;
export const createPhieuDeXuatVatTu = (data: PhieuDeXuatVatTuFormValues) => createPhieuDeXuatVatTuSupabase(data);
export const updatePhieuDeXuatVatTu = updatePhieuDeXuatVatTuSupabase;
export const deletePhieuDeXuatVatTu = deletePhieuDeXuatVatTuSupabase;
export const deletePhieuDeXuatVatTuMany = deletePhieuDeXuatVatTuManySupabase;
