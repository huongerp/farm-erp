/**
 * Service phiếu đề xuất vật tư – đọc/ghi DB (fp_mh_phieu_de_xuat_vat_tu, fp_mh_phieu_de_xuat_vat_tu_chi_tiet).
 */
import type { PaginatedTableResult } from '../../../../lib/db';
import type { PhieuDeXuatVatTuFormValues } from '../core/schema';
import type { PhieuDeXuatVatTu, PhieuDeXuatVatTuChiTietRow } from '../core/types';
import {
  getAllPhieuDeXuatVatTuDb,
  getPhieuDeXuatVatTuByIdDb,
  getPhieuDeXuatVatTuPageDb,
  fetchAllPhieuDeXuatVatTuForListQueryDb,
  createPhieuDeXuatVatTuDb,
  updatePhieuDeXuatVatTuDb,
  deletePhieuDeXuatVatTuDb,
  deletePhieuDeXuatVatTuManyDb,
  updatePhieuDeXuatVatTuTrangThaiDb,
  updatePhieuDeXuatVatTuTrangThaiManyDb,
  getAllPhieuDeXuatVatTuChiTietDb,
  getPhieuDeXuatVatTuChiTietPageDb,
  fetchAllPhieuDeXuatVatTuChiTietForListQueryDb,
} from './phieu-de-xuat-vat-tu-db.service';
import type { PhieuDeXuatChiTietListServerQuery, PhieuDeXuatVatTuListServerQuery } from './phieu-de-xuat-list-query';
import { buildPhieuDeXuatChiTietListServerQuery, buildPhieuDeXuatVatTuListServerQuery } from './phieu-de-xuat-list-query';

export type { PhieuDeXuatChiTietListServerQuery, PhieuDeXuatVatTuListServerQuery };
export { buildPhieuDeXuatChiTietListServerQuery, buildPhieuDeXuatVatTuListServerQuery };

export const getAllPhieuDeXuatVatTu = getAllPhieuDeXuatVatTuDb;
export async function getPhieuDeXuatVatTuPage(
  page: number,
  pageSize?: number,
  listQuery?: PhieuDeXuatVatTuListServerQuery
): Promise<PaginatedTableResult<PhieuDeXuatVatTu>> {
  return getPhieuDeXuatVatTuPageDb(page, pageSize ?? 50, listQuery);
}
export const fetchAllPhieuDeXuatVatTuForListQuery = fetchAllPhieuDeXuatVatTuForListQueryDb;
export const getAllPhieuDeXuatVatTuChiTiet = getAllPhieuDeXuatVatTuChiTietDb;
export async function getPhieuDeXuatVatTuChiTietPage(
  page: number,
  pageSize?: number,
  listQuery?: PhieuDeXuatChiTietListServerQuery
): Promise<PaginatedTableResult<PhieuDeXuatVatTuChiTietRow>> {
  return getPhieuDeXuatVatTuChiTietPageDb(page, pageSize ?? 100, listQuery);
}
export const fetchAllPhieuDeXuatVatTuChiTietForListQuery = fetchAllPhieuDeXuatVatTuChiTietForListQueryDb;
export const getPhieuDeXuatVatTuById = getPhieuDeXuatVatTuByIdDb;
export const createPhieuDeXuatVatTu = (data: PhieuDeXuatVatTuFormValues) => createPhieuDeXuatVatTuDb(data);
export const updatePhieuDeXuatVatTu = updatePhieuDeXuatVatTuDb;
export const deletePhieuDeXuatVatTu = deletePhieuDeXuatVatTuDb;
export const deletePhieuDeXuatVatTuMany = deletePhieuDeXuatVatTuManyDb;
export const updatePhieuDeXuatVatTuTrangThai = updatePhieuDeXuatVatTuTrangThaiDb;
export const updatePhieuDeXuatVatTuTrangThaiMany = updatePhieuDeXuatVatTuTrangThaiManyDb;
export type {
  UpdatePhieuDeXuatTrangThaiOptions,
  UpdatePhieuDeXuatTrangThaiManyResult,
} from './phieu-de-xuat-vat-tu-db.service';
