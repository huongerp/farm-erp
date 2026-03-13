/**
 * Service kiểm kê tài sản – kết nối Supabase.
 * Re-export từ kiem-ke-tai-san-supabase.service, giữ API cho hooks/store.
 */
import type {
  DotKiemKe,
  ChiTietKiemKe,
  DotKiemKeCreate,
  ChiTietKiemKeUpdate,
  TrangThaiDotKiemKe,
  KetQuaKiemKe,
} from '../core/types';
import {
  getDotKiemKeListSupabase,
  getDotKiemKeByIdSupabase,
  getChiTietByDotSupabase,
  createDotKiemKeSupabase,
  updateDotKiemKeSupabase,
  deleteDotKiemKeSupabase,
  changeTrangThaiDotSupabase,
  taoDanhSachKiemKeSupabase,
  updateChiTietKetQuaSupabase,
  themChiTietPhatHienSupabase,
  capNhatSoTheoKetQuaSupabase,
  hoanThanhDotSupabase,
  type GetDotKiemKeListParams,
  type TaoDanhSachKiemKeFilters,
  type ThemChiTietPhatHienPayload,
} from './kiem-ke-tai-san-supabase.service';

export type { GetDotKiemKeListParams, TaoDanhSachKiemKeFilters, ThemChiTietPhatHienPayload };

export async function getDotKiemKeList(params: GetDotKiemKeListParams = {}): Promise<DotKiemKe[]> {
  let list = await getDotKiemKeListSupabase(params);
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
  return getDotKiemKeByIdSupabase(id);
}

export async function getChiTietByDot(id_dot_kiem_ke: string): Promise<ChiTietKiemKe[]> {
  return getChiTietByDotSupabase(id_dot_kiem_ke);
}

export async function createDotKiemKe(data: DotKiemKeCreate): Promise<DotKiemKe> {
  return createDotKiemKeSupabase(data);
}

export async function updateDotKiemKe(id: string, data: Partial<DotKiemKeCreate>): Promise<DotKiemKe> {
  return updateDotKiemKeSupabase(id, data);
}

export async function deleteDotKiemKe(ids: string[]): Promise<void> {
  return deleteDotKiemKeSupabase(ids);
}

export async function changeTrangThaiDot(id: string, trang_thai: TrangThaiDotKiemKe): Promise<DotKiemKe> {
  return changeTrangThaiDotSupabase(id, trang_thai);
}

export async function taoDanhSachKiemKe(
  id_dot_kiem_ke: string,
  filters?: TaoDanhSachKiemKeFilters
): Promise<ChiTietKiemKe[]> {
  return taoDanhSachKiemKeSupabase(id_dot_kiem_ke, filters);
}

export async function updateChiTietKetQua(
  id_chi_tiet: string,
  data: ChiTietKiemKeUpdate,
  id_nguoi_kiem: string
): Promise<ChiTietKiemKe> {
  return updateChiTietKetQuaSupabase(id_chi_tiet, data, id_nguoi_kiem);
}

export async function themChiTietPhatHien(
  id_dot_kiem_ke: string,
  payload: ThemChiTietPhatHienPayload,
  id_nguoi_kiem: string
): Promise<ChiTietKiemKe> {
  return themChiTietPhatHienSupabase(id_dot_kiem_ke, payload, id_nguoi_kiem);
}

export async function capNhatSoTheoKetQua(id_chi_tiet: string): Promise<void> {
  return capNhatSoTheoKetQuaSupabase(id_chi_tiet);
}

export async function hoanThanhDot(id_dot_kiem_ke: string): Promise<DotKiemKe> {
  return hoanThanhDotSupabase(id_dot_kiem_ke);
}
