/**
 * Service đợt kiểm kê kho – gọi Supabase (fp_mh_dot_kiem_ke_kho, fp_mh_dot_kiem_ke_kho_kho, fp_mh_dot_kiem_ke_kho_chi_tiet).
 */
import type {
  ChiTietKiemKeKho,
  TrangThaiDotKiemKeKho,
} from '../core/types';
import {
  getDotKiemKeKhoListSupabase,
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
import type { GetDotKiemKeKhoListParamsSupabase, TaoDanhSachKiemKeKhoFiltersSupabase } from './kiem-ke-kho-supabase.service';

/** Tham số lọc danh sách đợt kiểm kê */
export interface GetDotKiemKeKhoListParams {
  filter?: 'all' | 'mine';
  id_nguoi?: string;
  q?: string;
  trang_thai_dot?: TrangThaiDotKiemKeKho[];
  dateFrom?: string;
  dateTo?: string;
  id_nguoi_phu_trach?: string[];
  id_kho?: string[];
}

/** Bộ lọc phạm vi khi tạo danh sách kiểm kê (kho, danh mục, hàng hóa — tùy chọn) */
export interface TaoDanhSachKiemKeKhoFilters {
  id_kho?: string[];
  id_danh_muc?: string[];
  id_hang_hoa?: string[];
}

function toSupabaseParams(p: GetDotKiemKeKhoListParams): GetDotKiemKeKhoListParamsSupabase {
  return {
    filter: p.filter,
    id_nguoi: p.id_nguoi,
    q: p.q,
    trang_thai_dot: p.trang_thai_dot,
    dateFrom: p.dateFrom,
    dateTo: p.dateTo,
    id_nguoi_phu_trach: p.id_nguoi_phu_trach,
    id_kho: p.id_kho,
  };
}

export const getDotKiemKeKhoList = (params: GetDotKiemKeKhoListParams = {}) =>
  getDotKiemKeKhoListSupabase(toSupabaseParams(params));

export const getDotKiemKeKhoById = getDotKiemKeKhoByIdSupabase;
export const getChiTietByDot = getChiTietByDotSupabase;
export const createDotKiemKeKho = createDotKiemKeKhoSupabase;
export const updateDotKiemKeKho = updateDotKiemKeKhoSupabase;
export const deleteDotKiemKeKho = deleteDotKiemKeKhoSupabase;
export const changeTrangThaiDot = changeTrangThaiDotSupabase;

export async function taoDanhSachKiemKe(
  id_dot_kiem_ke_kho: string,
  filters?: TaoDanhSachKiemKeKhoFilters
): Promise<ChiTietKiemKeKho[]> {
  const supabaseFilters: TaoDanhSachKiemKeKhoFiltersSupabase | undefined = filters
    ? { id_kho: filters.id_kho, id_danh_muc: filters.id_danh_muc, id_hang_hoa: filters.id_hang_hoa }
    : undefined;
  return taoDanhSachKiemKeSupabase(id_dot_kiem_ke_kho, supabaseFilters);
}

export const createChiTietKiemKe = createChiTietKiemKeSupabase;
export const deleteChiTietKiemKe = deleteChiTietKiemKeSupabase;
export const updateChiTietKetQua = updateChiTietKetQuaSupabase;
export const dieuChinhTonTheoKetQua = dieuChinhTonTheoKetQuaSupabase;
export const dieuChinhTonTheoDot = dieuChinhTonTheoDotSupabase;
export const hoanThanhDot = hoanThanhDotSupabase;
export const getNextMaDotDotKiemKeKho = getNextMaDotDotKiemKeKhoSupabase;
