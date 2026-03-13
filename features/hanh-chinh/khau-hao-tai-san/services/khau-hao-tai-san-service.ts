/**
 * Service khấu hao tài sản – dùng Supabase (fp_ts_ky_khau_hao, fp_ts_chi_tiet_khau_hao).
 */
import type { KyKhauHao, ChiTietKhauHao, KyKhauHaoCreate, TrangThaiKyKhauHao } from '../core/types';
import {
  getKyKhauHaoListSupabase,
  getKyKhauHaoByIdSupabase,
  createKyKhauHaoSupabase,
  updateKyKhauHaoSupabase,
  getChiTietKhauHaoSupabase,
  tinhToanKhauHaoKySupabase,
  chotKySupabase,
  deleteKyKhauHaoSupabase,
  updateKyKhauHaoGhiChuSupabase,
  updateKyKhauHaoTrangThaiSupabase,
} from './khau-hao-tai-san-supabase.service';

export const getKyKhauHaoList = getKyKhauHaoListSupabase;
export const getKyKhauHaoById = getKyKhauHaoByIdSupabase;
export const createKyKhauHao = createKyKhauHaoSupabase;
export const updateKyKhauHao = updateKyKhauHaoSupabase;
export const getChiTietKhauHao = getChiTietKhauHaoSupabase;

export const tinhToanKhauHaoKy = async (
  idKy: string,
  options?: { id_nguoi_tao?: string | null; ten_nguoi_tao?: string | null }
): Promise<ChiTietKhauHao[]> => {
  return tinhToanKhauHaoKySupabase(idKy, options?.id_nguoi_tao, options?.ten_nguoi_tao);
};

export const chotKy = chotKySupabase;
export const deleteKyKhauHao = deleteKyKhauHaoSupabase;
export const updateKyKhauHaoGhiChu = updateKyKhauHaoGhiChuSupabase;
export const updateKyKhauHaoTrangThai = updateKyKhauHaoTrangThaiSupabase;
