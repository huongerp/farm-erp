/**
 * Service phiếu đề xuất vật tư – đọc/ghi DB (fp_farm_de_xuat_mua_hang, fp_farm_de_xuat_mua_hang_chi_tiet).
 */
import type { PaginatedTableResult } from '../../../../lib/db';
import type { DeXuatMuaHangFormValues } from '../core/schema';
import type { DeXuatMuaHang, DeXuatMuaHangChiTietRow } from '../core/types';
import {
  getAllDeXuatMuaHangDb,
  getDeXuatMuaHangByIdDb,
  getDeXuatMuaHangPageDb,
  fetchAllDeXuatMuaHangForListQueryDb,
  createDeXuatMuaHangDb,
  updateDeXuatMuaHangDb,
  deleteDeXuatMuaHangDb,
  deleteDeXuatMuaHangManyDb,
  updateDeXuatMuaHangTrangThaiDb,
  updateDeXuatMuaHangTrangThaiManyDb,
  getAllDeXuatMuaHangChiTietDb,
  getDeXuatMuaHangChiTietPageDb,
  fetchAllDeXuatMuaHangChiTietForListQueryDb,
} from './de-xuat-mua-hang-db.service';
import type { DeXuatMuaHangChiTietListServerQuery, DeXuatMuaHangListServerQuery } from './de-xuat-mua-hang-list-query';
import { buildDeXuatMuaHangChiTietListServerQuery, buildDeXuatMuaHangListServerQuery } from './de-xuat-mua-hang-list-query';
import type { KhoBienThe } from '../../kho-bien-the/bien-the';

export type { DeXuatMuaHangChiTietListServerQuery, DeXuatMuaHangListServerQuery };
export { buildDeXuatMuaHangChiTietListServerQuery, buildDeXuatMuaHangListServerQuery };

export const getAllDeXuatMuaHang = getAllDeXuatMuaHangDb;
export async function getDeXuatMuaHangPage(
  bt: KhoBienThe,
  page: number,
  pageSize?: number,
  listQuery?: DeXuatMuaHangListServerQuery
): Promise<PaginatedTableResult<DeXuatMuaHang>> {
  return getDeXuatMuaHangPageDb(bt, page, pageSize ?? 50, listQuery);
}
export const fetchAllDeXuatMuaHangForListQuery = fetchAllDeXuatMuaHangForListQueryDb;
export const getAllDeXuatMuaHangChiTiet = getAllDeXuatMuaHangChiTietDb;
export async function getDeXuatMuaHangChiTietPage(
  bt: KhoBienThe,
  page: number,
  pageSize?: number,
  listQuery?: DeXuatMuaHangChiTietListServerQuery
): Promise<PaginatedTableResult<DeXuatMuaHangChiTietRow>> {
  return getDeXuatMuaHangChiTietPageDb(bt, page, pageSize ?? 100, listQuery);
}
export const fetchAllDeXuatMuaHangChiTietForListQuery = fetchAllDeXuatMuaHangChiTietForListQueryDb;
export const getDeXuatMuaHangById = getDeXuatMuaHangByIdDb;
export const createDeXuatMuaHang = (bt: KhoBienThe, data: DeXuatMuaHangFormValues) => createDeXuatMuaHangDb(bt, data);
export const updateDeXuatMuaHang = updateDeXuatMuaHangDb;
export const deleteDeXuatMuaHang = deleteDeXuatMuaHangDb;
export const deleteDeXuatMuaHangMany = deleteDeXuatMuaHangManyDb;
export const updateDeXuatMuaHangTrangThai = updateDeXuatMuaHangTrangThaiDb;
export const updateDeXuatMuaHangTrangThaiMany = updateDeXuatMuaHangTrangThaiManyDb;
export type {
  UpdateDeXuatMuaHangTrangThaiOptions,
  UpdateDeXuatMuaHangTrangThaiManyResult,
} from './de-xuat-mua-hang-db.service';
