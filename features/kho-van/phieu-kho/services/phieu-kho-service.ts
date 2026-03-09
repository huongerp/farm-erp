/**
 * Service phiếu kho: sử dụng Supabase (fp_mh_phieu_kho, fp_mh_phieu_kho_chi_tiet).
 * App liên kết và enrich với: danh sách kho, danh sách hàng hóa, nhân viên, danh sách đối tác.
 */
import type { LoaiPhieuKho, TrangThaiPhieuKho } from '../core/types';
import type { PhieuKhoFormValues } from '../core/schema';
import {
  getAllPhieuKhoSupabase,
  getPhieuKhoByIdSupabase,
  createPhieuKhoSupabase,
  updatePhieuKhoSupabase,
  deletePhieuKhoSupabase,
  deletePhieuKhoManySupabase,
  getPhieuKhoByDoiTacSupabase,
  getChiTietPhieuKhoAllSupabase,
  getLichSuNhapXuatByHangHoaSupabase,
  getLichSuNhapXuatByKhoSupabase,
  getNextSoPhieuSupabase,
  updatePhieuKhoTrangThaiSupabase,
} from './phieu-kho-supabase.service';

export type { LichSuNhapXuatRow, LichSuNhapXuatByKhoRow } from './phieu-kho-supabase.service';

export const getAllPhieuKho = getAllPhieuKhoSupabase;
export const getPhieuKhoById = getPhieuKhoByIdSupabase;
export const createPhieuKho = (loai: LoaiPhieuKho, data: PhieuKhoFormValues) => createPhieuKhoSupabase(loai, data);
export const updatePhieuKho = updatePhieuKhoSupabase;
export const deletePhieuKho = deletePhieuKhoSupabase;
export const deletePhieuKhoMany = deletePhieuKhoManySupabase;
export const getPhieuKhoByDoiTac = getPhieuKhoByDoiTacSupabase;
export const getChiTietPhieuKhoAll = getChiTietPhieuKhoAllSupabase;
export const getLichSuNhapXuatByHangHoa = getLichSuNhapXuatByHangHoaSupabase;
export const getLichSuNhapXuatByKho = getLichSuNhapXuatByKhoSupabase;
export const getNextSoPhieu = getNextSoPhieuSupabase;
export const updatePhieuKhoTrangThai = (id: string, trang_thai: TrangThaiPhieuKho, ghi_chu?: string) =>
  updatePhieuKhoTrangThaiSupabase(id, trang_thai, ghi_chu);
