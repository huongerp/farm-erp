/**
 * Service khấu hao tài sản – đọc/ghi DB (fp_ts_ky_khau_hao, fp_ts_chi_tiet_khau_hao).
 */
import type { ChiTietKhauHao } from '../core/types';
import {
  getKyKhauHaoListDb,
  getKyKhauHaoByIdDb,
  createKyKhauHaoDb,
  updateKyKhauHaoDb,
  getChiTietKhauHaoDb,
  tinhToanKhauHaoKyDb,
  chotKyDb,
  deleteKyKhauHaoDb,
  updateKyKhauHaoGhiChuDb,
  updateKyKhauHaoTrangThaiDb,
} from './khau-hao-tai-san-db.service';

export const getKyKhauHaoList = getKyKhauHaoListDb;
export const getKyKhauHaoById = getKyKhauHaoByIdDb;
export const createKyKhauHao = createKyKhauHaoDb;
export const updateKyKhauHao = updateKyKhauHaoDb;
export const getChiTietKhauHao = getChiTietKhauHaoDb;

export const tinhToanKhauHaoKy = async (
  idKy: string,
  options?: { id_nguoi_tao?: string | null; ten_nguoi_tao?: string | null }
): Promise<ChiTietKhauHao[]> => {
  return tinhToanKhauHaoKyDb(idKy, options?.id_nguoi_tao, options?.ten_nguoi_tao);
};

export const chotKy = chotKyDb;
export const deleteKyKhauHao = deleteKyKhauHaoDb;
export const updateKyKhauHaoGhiChu = updateKyKhauHaoGhiChuDb;
export const updateKyKhauHaoTrangThai = updateKyKhauHaoTrangThaiDb;

export { getKyKhauHaoPageDb } from './khau-hao-tai-san-db.service';
