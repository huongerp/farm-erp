/**
 * Service đợt kiểm kê kho – đọc/ghi DB (fp_mh_dot_kiem_ke_kho, fp_mh_dot_kiem_ke_kho_kho, fp_mh_dot_kiem_ke_kho_chi_tiet).
 */
import type { ChiTietKiemKeKho } from '../core/types';
import {
  getDotKiemKeKhoByIdDb,
  getChiTietByDotDb,
  createDotKiemKeKhoDb,
  updateDotKiemKeKhoDb,
  deleteDotKiemKeKhoDb,
  changeTrangThaiDotDb,
  taoDanhSachKiemKeDb,
  createChiTietKiemKeDb,
  deleteChiTietKiemKeDb,
  updateChiTietKetQuaDb,
  dieuChinhTonTheoKetQuaDb,
  dieuChinhTonTheoDotDb,
  hoanThanhDotDb,
  getNextMaDotDotKiemKeKhoDb,
} from './kiem-ke-kho-db.service';
import type { TaoDanhSachKiemKeKhoFiltersDb } from './kiem-ke-kho-db.service';

/** Bộ lọc phạm vi khi tạo danh sách kiểm kê (kho, danh mục, hàng hóa — tùy chọn) */
export interface TaoDanhSachKiemKeKhoFilters {
  id_kho?: string[];
  id_danh_muc?: string[];
  id_hang_hoa?: string[];
}

export const getDotKiemKeKhoById = getDotKiemKeKhoByIdDb;
export const getChiTietByDot = getChiTietByDotDb;
export const createDotKiemKeKho = createDotKiemKeKhoDb;
export const updateDotKiemKeKho = updateDotKiemKeKhoDb;
export const deleteDotKiemKeKho = deleteDotKiemKeKhoDb;
export const changeTrangThaiDot = changeTrangThaiDotDb;

export async function taoDanhSachKiemKe(
  id_dot_kiem_ke_kho: string,
  filters?: TaoDanhSachKiemKeKhoFilters,
  capCao = false
): Promise<ChiTietKiemKeKho[]> {
  const dbFilters: TaoDanhSachKiemKeKhoFiltersDb | undefined = filters
    ? { id_kho: filters.id_kho, id_danh_muc: filters.id_danh_muc, id_hang_hoa: filters.id_hang_hoa }
    : undefined;
  return taoDanhSachKiemKeDb(id_dot_kiem_ke_kho, dbFilters, capCao);
}

export const createChiTietKiemKe = createChiTietKiemKeDb;
export const deleteChiTietKiemKe = deleteChiTietKiemKeDb;
export const updateChiTietKetQua = updateChiTietKetQuaDb;
export const dieuChinhTonTheoKetQua = dieuChinhTonTheoKetQuaDb;
export const dieuChinhTonTheoDot = dieuChinhTonTheoDotDb;
export const hoanThanhDot = hoanThanhDotDb;
export const getNextMaDotDotKiemKeKho = getNextMaDotDotKiemKeKhoDb;

export { getDotKiemKeKhoPageDb, getDotKiemKeKhoTomTatDb } from './kiem-ke-kho-db.service';
