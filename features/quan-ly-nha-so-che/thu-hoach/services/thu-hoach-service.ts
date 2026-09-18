import type { ThuHoachKeHoachFormValues } from '../core/schema';
import type { FarmThuHoach } from '../core/types';
import type { PaginatedTableResult } from '../../../../lib/db';
import type { ThuHoachListServerQuery } from './thu-hoach-list-query';
import {
  getAllThuHoachSupabase,
  getThuHoachPageSupabase,
  getThuHoachTomTatSupabase,
  fetchAllThuHoachForListQuery as fetchAllThuHoachForListQuerySupabase,
  getThuHoachByIdSupabase,
  createThuHoachSupabase,
  updateThuHoachKeHoachSupabase,
  updateThuHoachThucTeSupabase,
  deleteThuHoachSupabase,
  deleteThuHoachManySupabase,
  appendThuHoachTraoDoiSupabase,
} from './thu-hoach-supabase.service';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';

async function enrichTenNguoiTao(items: FarmThuHoach[]): Promise<FarmThuHoach[]> {
  if (items.length === 0) return items;
  const employees = await getEmployeesRef();
  const hoTenById = new Map(employees.map((e) => [String(e.id), e.ho_ten]));
  return items.map((item) => ({
    ...item,
    ten_nguoi_tao:
      item.id_nguoi_tao != null && item.id_nguoi_tao !== ''
        ? (hoTenById.get(String(item.id_nguoi_tao)) ?? null)
        : null,
  }));
}

/** Một trang danh sách (lọc / sắp xếp / phân trang ở PostgREST). */
export async function getThuHoachPage(
  query: ThuHoachListServerQuery
): Promise<PaginatedTableResult<FarmThuHoach>> {
  const page = await getThuHoachPageSupabase(query);
  return { ...page, data: await enrichTenNguoiTao(page.data) };
}

/** Toàn bộ bản ghi khớp bộ lọc — chỉ gọi khi mở hộp thoại Xuất file. */
export async function fetchAllThuHoachForListQuery(
  query: ThuHoachListServerQuery
): Promise<FarmThuHoach[]> {
  return enrichTenNguoiTao(await fetchAllThuHoachForListQuerySupabase(query));
}

/** Bản rút gọn: chip lọc năm/tuần/chi nhánh và gợi ý chi nhánh khi thêm phiếu. */
export interface ThuHoachTomTat {
  id: string;
  nam: number;
  tuan: number;
  id_chi_nhanh: string | null;
  ten_chi_nhanh: string | null;
  id_nguoi_tao: string | null;
  tg_tao: string | null;
}

export async function getThuHoachTomTat(
  viewAll: boolean,
  allowedBranchIds: string[]
): Promise<ThuHoachTomTat[]> {
  const rows = await getThuHoachTomTatSupabase(viewAll, allowedBranchIds);
  return rows.map((r) => ({
    id: String(r.id),
    nam: r.nam,
    tuan: r.tuan,
    id_chi_nhanh: r.id_chi_nhanh != null ? String(r.id_chi_nhanh) : null,
    ten_chi_nhanh: r.ten_chi_nhanh ?? null,
    id_nguoi_tao: r.id_nguoi_tao != null ? String(r.id_nguoi_tao) : null,
    tg_tao: r.tg_tao ?? null,
  }));
}

export async function getAllThuHoach(): Promise<FarmThuHoach[]> {
  const rows = await getAllThuHoachSupabase();
  return enrichTenNguoiTao(rows);
}

export async function getThuHoachById(id: string): Promise<FarmThuHoach | null> {
  const row = await getThuHoachByIdSupabase(id);
  if (!row) return null;
  const [enriched] = await enrichTenNguoiTao([row]);
  return enriched;
}

export async function appendThuHoachTraoDoi(
  id: string,
  noiDung: string,
  tenNguoiGhi: string
): Promise<FarmThuHoach> {
  const row = await appendThuHoachTraoDoiSupabase(id, noiDung, tenNguoiGhi);
  const [enriched] = await enrichTenNguoiTao([row]);
  return enriched;
}

export const createThuHoach = (values: ThuHoachKeHoachFormValues, idNguoiTao: string | null) =>
  createThuHoachSupabase(values, idNguoiTao);
export const updateThuHoachKeHoach = updateThuHoachKeHoachSupabase;
export const updateThuHoachThucTe = updateThuHoachThucTeSupabase;
export const deleteThuHoach = deleteThuHoachSupabase;
export const deleteThuHoachMany = deleteThuHoachManySupabase;
