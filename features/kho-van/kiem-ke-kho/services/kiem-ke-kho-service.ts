/**
 * Service đợt kiểm kê kho – gọi Supabase (fp_mh_dot_kiem_ke_kho, fp_mh_dot_kiem_ke_kho_kho, fp_mh_dot_kiem_ke_kho_chi_tiet).
 */
import type { ChiTietKiemKeKho } from '../core/types';
import {
  getDotKiemKeKhoByIdSupabase,
  getChiTietByDotSupabase,
  createDotKiemKeKhoSupabase,
  updateDotKiemKeKhoSupabase,
  deleteDotKiemKeKhoSupabase,
  changeTrangThaiDotSupabase,
  taoDanhSachKiemKeSupabase,
  createChiTietKiemKeSupabase,
  deleteChiTietKiemKeSupabase,
  updateChiTietKetQuaSupabase,
  dieuChinhTonTheoKetQuaSupabase,
  dieuChinhTonTheoDotSupabase,
  hoanThanhDotSupabase,
  getNextMaDotDotKiemKeKhoSupabase,
} from './kiem-ke-kho-supabase.service';
import type { TaoDanhSachKiemKeKhoFiltersSupabase } from './kiem-ke-kho-supabase.service';

/** Bộ lọc phạm vi khi tạo danh sách kiểm kê (kho, danh mục, hàng hóa — tùy chọn) */
export interface TaoDanhSachKiemKeKhoFilters {
  id_kho?: string[];
  id_danh_muc?: string[];
  id_hang_hoa?: string[];
}

export const getDotKiemKeKhoById = getDotKiemKeKhoByIdSupabase;
export const getChiTietByDot = getChiTietByDotSupabase;
export const createDotKiemKeKho = createDotKiemKeKhoSupabase;
export const updateDotKiemKeKho = updateDotKiemKeKhoSupabase;
export const deleteDotKiemKeKho = deleteDotKiemKeKhoSupabase;
export const changeTrangThaiDot = changeTrangThaiDotSupabase;

export async function taoDanhSachKiemKe(
  id_dot_kiem_ke_kho: string,
  filters?: TaoDanhSachKiemKeKhoFilters,
  capCao = false
): Promise<ChiTietKiemKeKho[]> {
  const supabaseFilters: TaoDanhSachKiemKeKhoFiltersSupabase | undefined = filters
    ? { id_kho: filters.id_kho, id_danh_muc: filters.id_danh_muc, id_hang_hoa: filters.id_hang_hoa }
    : undefined;
  return taoDanhSachKiemKeSupabase(id_dot_kiem_ke_kho, supabaseFilters, capCao);
}

export const createChiTietKiemKe = createChiTietKiemKeSupabase;
export const deleteChiTietKiemKe = deleteChiTietKiemKeSupabase;
export const updateChiTietKetQua = updateChiTietKetQuaSupabase;
export const dieuChinhTonTheoKetQua = dieuChinhTonTheoKetQuaSupabase;
export const dieuChinhTonTheoDot = dieuChinhTonTheoDotSupabase;
export const hoanThanhDot = hoanThanhDotSupabase;
export const getNextMaDotDotKiemKeKho = getNextMaDotDotKiemKeKhoSupabase;

export { getDotKiemKeKhoPageSupabase, getDotKiemKeKhoTomTatSupabase } from './kiem-ke-kho-supabase.service';
