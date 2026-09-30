/**
 * Service kiểm kê tài sản – đọc/ghi DB.
 * Re-export từ kiem-ke-tai-san-db.service, giữ API cho hooks/store.
 */
import type {
  DotKiemKe,
  ChiTietKiemKe,
  DotKiemKeCreate,
  ChiTietKiemKeUpdate,
  TrangThaiDotKiemKe,
} from '../core/types';
import {
  getDotKiemKeListDb,
  getDotKiemKeByIdDb,
  getChiTietByDotDb,
  createDotKiemKeDb,
  updateDotKiemKeDb,
  deleteDotKiemKeDb,
  changeTrangThaiDotDb,
  taoDanhSachKiemKeDb,
  updateChiTietKetQuaDb,
  deleteChiTietKiemKeDb,
  themChiTietPhatHienDb,
  capNhatSoTheoKetQuaDb,
  hoanThanhDotDb,
  getNextMaDotDotKiemKeTaiSan,
  type GetDotKiemKeListParams,
  type TaoDanhSachKiemKeFilters,
  type ThemChiTietPhatHienPayload,
} from './kiem-ke-tai-san-db.service';

export type { GetDotKiemKeListParams, TaoDanhSachKiemKeFilters, ThemChiTietPhatHienPayload };

export async function getDotKiemKeList(params: GetDotKiemKeListParams = {}): Promise<DotKiemKe[]> {
  let list = await getDotKiemKeListDb(params);
  if (params.q?.trim()) {
    const q = params.q.trim().toLowerCase();
    list = list.filter(
      (d) =>
        d.ma_dot.toLowerCase().includes(q) ||
        (d.ten_dot && d.ten_dot.toLowerCase().includes(q)) ||
        (d.ten_nguoi_phu_trach && d.ten_nguoi_phu_trach.toLowerCase().includes(q))
    );
  }
  return list;
}

export async function getDotKiemKeById(id: string): Promise<DotKiemKe | null> {
  return getDotKiemKeByIdDb(id);
}

export async function getChiTietByDot(id_dot_kiem_ke: string): Promise<ChiTietKiemKe[]> {
  return getChiTietByDotDb(id_dot_kiem_ke);
}

export async function createDotKiemKe(data: DotKiemKeCreate): Promise<DotKiemKe> {
  return createDotKiemKeDb(data);
}

export async function updateDotKiemKe(id: string, data: Partial<DotKiemKeCreate>): Promise<DotKiemKe> {
  return updateDotKiemKeDb(id, data);
}

export async function deleteDotKiemKe(ids: string[]): Promise<void> {
  return deleteDotKiemKeDb(ids);
}

export async function changeTrangThaiDot(id: string, trang_thai: TrangThaiDotKiemKe): Promise<DotKiemKe> {
  return changeTrangThaiDotDb(id, trang_thai);
}

export async function taoDanhSachKiemKe(
  id_dot_kiem_ke: string,
  filters?: TaoDanhSachKiemKeFilters
): Promise<ChiTietKiemKe[]> {
  return taoDanhSachKiemKeDb(id_dot_kiem_ke, filters);
}

export async function updateChiTietKetQua(
  id_chi_tiet: string,
  data: ChiTietKiemKeUpdate,
  id_nguoi_kiem: string
): Promise<ChiTietKiemKe> {
  return updateChiTietKetQuaDb(id_chi_tiet, data, id_nguoi_kiem);
}

export async function deleteChiTietKiemKe(id_chi_tiet: string): Promise<void> {
  return deleteChiTietKiemKeDb(id_chi_tiet);
}

export async function themChiTietPhatHien(
  id_dot_kiem_ke: string,
  payload: ThemChiTietPhatHienPayload,
  id_nguoi_kiem: string
): Promise<ChiTietKiemKe> {
  return themChiTietPhatHienDb(id_dot_kiem_ke, payload, id_nguoi_kiem);
}

export async function capNhatSoTheoKetQua(id_chi_tiet: string): Promise<void> {
  return capNhatSoTheoKetQuaDb(id_chi_tiet);
}

export async function hoanThanhDot(id_dot_kiem_ke: string): Promise<DotKiemKe> {
  return hoanThanhDotDb(id_dot_kiem_ke);
}

export { getNextMaDotDotKiemKeTaiSan };

export { getDotKiemKePageDb } from './kiem-ke-tai-san-db.service';
