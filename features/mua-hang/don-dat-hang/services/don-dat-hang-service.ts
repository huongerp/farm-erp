/**
 * Service đơn đặt hàng – đọc/ghi DB (fp_mh_don_dat_hang, fp_mh_don_dat_hang_chi_tiet).
 */
import type { DonDatHangFormValues } from '../core/schema';
import type { PaginatedTableResult } from '../../../../lib/db';
import type { ChiTietDonDatHangFlat, DonDatHang, DonDatHangTrangThai } from '../core/types';
import {
  getAllDonDatHangDb,
  getDonDatHangByIdDb,
  getDonDatHangPageDb,
  fetchAllDonDatHangForListQueryDb,
  getChiTietDonDatHangPageDb,
  fetchAllChiTietDonDatHangForListQueryDb,
  getPhanLoaiDonDatHangChiTietDb,
  createDonDatHangDb,
  updateDonDatHangDb,
  updateDonDatHangTrangThaiDb,
  updateDonDatHangTrangThaiManyDb,
  deleteDonDatHangDb,
  deleteDonDatHangManyDb,
  getNextSoPoDonDatHangDb,
  fetchChiTietForCategoryStatsDb,
} from './don-dat-hang-db.service';
export type { ChiTietCategoryStatsItem, UpdateDonDatHangTrangThaiManyResult } from './don-dat-hang-db.service';
import { buildDonDatHangListServerQuery, type DonDatHangListServerQuery } from './don-dat-hang-list-query';

export type { DonDatHangListServerQuery };
export { buildDonDatHangListServerQuery };

/** Quy tắc số PO: PO-YYYY-NNNNN (năm + 5 chữ số). Có thể sửa mã khi tạo/sửa. */
export async function getNextSoPoFormatted(): Promise<string> {
  const n = await getNextSoPoDonDatHangDb();
  const year = new Date().getFullYear();
  return `PO-${year}-${String(n).padStart(5, '0')}`;
}

export const getAllDonDatHang = getAllDonDatHangDb;
export async function getDonDatHangPage(
  page: number,
  pageSize?: number,
  listQuery?: DonDatHangListServerQuery
): Promise<PaginatedTableResult<DonDatHang>> {
  return getDonDatHangPageDb(page, pageSize ?? 50, listQuery);
}

export const fetchAllDonDatHangForListQuery = fetchAllDonDatHangForListQueryDb;

export async function getChiTietDonDatHangPage(
  page: number,
  pageSize?: number,
  listQuery?: DonDatHangListServerQuery
): Promise<PaginatedTableResult<ChiTietDonDatHangFlat>> {
  return getChiTietDonDatHangPageDb(page, pageSize ?? 100, listQuery);
}

export const fetchAllChiTietDonDatHangForListQuery = fetchAllChiTietDonDatHangForListQueryDb;
export const getPhanLoaiDonDatHangChiTiet = getPhanLoaiDonDatHangChiTietDb;
export const getNextSoPoDonDatHang = getNextSoPoFormatted;
export const getDonDatHangById = getDonDatHangByIdDb;
export const createDonDatHang = (data: DonDatHangFormValues) => createDonDatHangDb(data);
export const updateDonDatHang = updateDonDatHangDb;
export const updateDonDatHangTrangThai = (
  id: string,
  trang_thai: DonDatHangTrangThai,
  options?: { ghi_chu?: string; notePrefix?: string }
) => updateDonDatHangTrangThaiDb(id, trang_thai, options);

export const updateDonDatHangTrangThaiMany = (
  ids: string[],
  trang_thai: DonDatHangTrangThai,
  options?: { ghi_chu?: string; notePrefix?: string }
) => updateDonDatHangTrangThaiManyDb(ids, trang_thai, options);
export const deleteDonDatHang = deleteDonDatHangDb;
export const deleteDonDatHangMany = deleteDonDatHangManyDb;
export const fetchChiTietForCategoryStats = fetchChiTietForCategoryStatsDb;
