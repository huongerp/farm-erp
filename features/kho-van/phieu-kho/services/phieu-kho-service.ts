/**
 * Service phiếu kho: đọc/ghi DB (fp_mh_phieu_kho, fp_mh_phieu_kho_chi_tiet).
 * App liên kết và enrich với: danh sách kho, danh sách hàng hóa, nhân viên, danh sách đối tác.
 */
import type { LoaiPhieuKho, TrangThaiPhieuKho } from '../core/types';
import type { PhieuKhoFormValues } from '../core/schema';
import {
  getAllPhieuKhoDb,
  getPhieuKhoByIdDb,
  createPhieuKhoDb,
  updatePhieuKhoDb,
  deletePhieuKhoDb,
  deletePhieuKhoManyDb,
  getPhieuKhoByDoiTacDb,
  getChiTietPhieuKhoAllDb,
  getLichSuNhapXuatByHangHoaDb,
  getLichSuNhapXuatByKhoDb,
  getNextSoPhieuDb,
  updatePhieuKhoTrangThaiDb,
  updatePhieuKhoTrangThaiManyDb,
  getPhieuKhoPageDb,
  getChiTietPhieuKhoPageDb,
  fetchAllPhieuKhoForListQueryDb,
  fetchAllChiTietPhieuKhoForListQueryDb,
  type UpdatePhieuKhoTrangThaiOptions,
  type UpdatePhieuKhoTrangThaiManyResult,
} from './phieu-kho-db.service';

export type { PhieuKhoListServerQuery, ChiTietPhieuKhoListServerQuery } from './phieu-kho-list-query';
export { buildPhieuKhoListServerQuery, buildChiTietPhieuKhoListServerQuery } from './phieu-kho-list-query';

export type { LichSuNhapXuatRow, LichSuNhapXuatByKhoRow } from './phieu-kho-db.service';
export type { PaginatedTableResult } from '../../../../lib/db';

export const getAllPhieuKho = getAllPhieuKhoDb;
export const getPhieuKhoById = getPhieuKhoByIdDb;
export const createPhieuKho = (loai: LoaiPhieuKho, data: PhieuKhoFormValues) => createPhieuKhoDb(loai, data);
export const updatePhieuKho = updatePhieuKhoDb;
export const deletePhieuKho = deletePhieuKhoDb;
export const deletePhieuKhoMany = deletePhieuKhoManyDb;
export const getPhieuKhoByDoiTac = getPhieuKhoByDoiTacDb;
export const getChiTietPhieuKhoAll = getChiTietPhieuKhoAllDb;
export const getLichSuNhapXuatByHangHoa = getLichSuNhapXuatByHangHoaDb;
export const getLichSuNhapXuatByKho = getLichSuNhapXuatByKhoDb;
export const getNextSoPhieu = getNextSoPhieuDb;
export type { UpdatePhieuKhoTrangThaiOptions, UpdatePhieuKhoTrangThaiManyResult };

export const updatePhieuKhoTrangThai = (id: string, trang_thai: TrangThaiPhieuKho, opts?: UpdatePhieuKhoTrangThaiOptions) =>
  updatePhieuKhoTrangThaiDb(id, trang_thai, opts);

export const updatePhieuKhoTrangThaiMany = (
  ids: string[],
  trang_thai: TrangThaiPhieuKho,
  opts?: UpdatePhieuKhoTrangThaiOptions
) => updatePhieuKhoTrangThaiManyDb(ids, trang_thai, opts);

export const getPhieuKhoPage = getPhieuKhoPageDb;
export const getChiTietPhieuKhoPage = getChiTietPhieuKhoPageDb;
export const fetchAllPhieuKhoForListQuery = fetchAllPhieuKhoForListQueryDb;
export const fetchAllChiTietPhieuKhoForListQuery = fetchAllChiTietPhieuKhoForListQueryDb;
