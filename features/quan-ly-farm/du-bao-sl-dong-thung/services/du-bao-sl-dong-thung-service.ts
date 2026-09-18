import type { DuBaoSlDongThungFormValues } from '../core/schema';
import type { FarmDuBaoSlDongThung, TrangThaiDuBaoSlDongThungPhieu } from '../core/types';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import type { PaginatedTableResult } from '../../../../lib/db';
import type { DuBaoSlDongThungListServerQuery } from './du-bao-sl-dong-thung-list-query';
import {
  getAllDuBaoSlDongThungSupabase,
  getDuBaoSlDongThungPageSupabase,
  getDuBaoSlDongThungTomTatSupabase,
  fetchAllDuBaoSlDongThungForListQuery as fetchAllDuBaoSlDongThungForListQuerySupabase,
  getDuBaoSlDongThungByIdSupabase,
  createDuBaoSlDongThungSupabase,
  updateDuBaoSlDongThungSupabase,
  deleteDuBaoSlDongThungSupabase,
  deleteDuBaoSlDongThungManySupabase,
  updateDuBaoSlDongThungTrangThaiSupabase,
  updateDuBaoSlDongThungTrangThaiManySupabase,
} from './du-bao-sl-dong-thung-supabase.service';

async function enrichTenNguoiTao(items: FarmDuBaoSlDongThung[]): Promise<FarmDuBaoSlDongThung[]> {
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
export async function getDuBaoSlDongThungPage(
  query: DuBaoSlDongThungListServerQuery
): Promise<PaginatedTableResult<FarmDuBaoSlDongThung>> {
  const page = await getDuBaoSlDongThungPageSupabase(query);
  return { ...page, data: await enrichTenNguoiTao(page.data) };
}

/** Toàn bộ bản ghi khớp bộ lọc — chỉ gọi khi mở hộp thoại Xuất file. */
export async function fetchAllDuBaoSlDongThungForListQuery(
  query: DuBaoSlDongThungListServerQuery
): Promise<FarmDuBaoSlDongThung[]> {
  return enrichTenNguoiTao(await fetchAllDuBaoSlDongThungForListQuerySupabase(query));
}

/** Bản rút gọn của một phiếu — đủ cho chip lọc, gợi ý chi nhánh và chặn trùng. */
export interface DuBaoSlDongThungTomTat {
  id: string;
  ngay: string;
  id_chi_nhanh: string | null;
  ten_chi_nhanh: string | null;
  trang_thai: string | null;
  id_nguoi_tao: string | null;
  tg_tao: string | null;
}

/** Danh sách tóm tắt: chip lọc + số đếm, chi nhánh gợi ý, chặn trùng ngày×chi nhánh. */
export async function getDuBaoSlDongThungTomTat(
  viewAll: boolean,
  allowedBranchIds: string[]
): Promise<DuBaoSlDongThungTomTat[]> {
  const rows = await getDuBaoSlDongThungTomTatSupabase(viewAll, allowedBranchIds);
  return rows.map((r) => ({
    id: String(r.id),
    ngay: typeof r.ngay === 'string' ? r.ngay.slice(0, 10) : String(r.ngay),
    id_chi_nhanh: r.id_chi_nhanh != null ? String(r.id_chi_nhanh) : null,
    ten_chi_nhanh: r.ten_chi_nhanh ?? null,
    trang_thai: r.trang_thai ?? null,
    id_nguoi_tao: r.id_nguoi_tao != null ? String(r.id_nguoi_tao) : null,
    tg_tao: r.tg_tao ?? null,
  }));
}

export async function getAllDuBaoSlDongThung(): Promise<FarmDuBaoSlDongThung[]> {
  const rows = await getAllDuBaoSlDongThungSupabase();
  return enrichTenNguoiTao(rows);
}

export async function getDuBaoSlDongThungById(id: string): Promise<FarmDuBaoSlDongThung | null> {
  const row = await getDuBaoSlDongThungByIdSupabase(id);
  if (!row) return null;
  const [enriched] = await enrichTenNguoiTao([row]);
  return enriched;
}

export async function createDuBaoSlDongThung(
  values: DuBaoSlDongThungFormValues,
  idNguoiTao: string | null
): Promise<FarmDuBaoSlDongThung> {
  const row = await createDuBaoSlDongThungSupabase(values, idNguoiTao);
  const [enriched] = await enrichTenNguoiTao([row]);
  return enriched;
}

export async function updateDuBaoSlDongThung(id: string, values: DuBaoSlDongThungFormValues): Promise<FarmDuBaoSlDongThung> {
  const row = await updateDuBaoSlDongThungSupabase(id, values);
  const [enriched] = await enrichTenNguoiTao([row]);
  return enriched;
}

export async function deleteDuBaoSlDongThung(id: string): Promise<void> {
  await deleteDuBaoSlDongThungSupabase(id);
}

export async function deleteDuBaoSlDongThungMany(ids: string[]): Promise<void> {
  await deleteDuBaoSlDongThungManySupabase(ids);
}

export async function updateDuBaoSlDongThungTrangThaiMany(
  ids: string[],
  trang_thai: TrangThaiDuBaoSlDongThungPhieu
): Promise<void> {
  await updateDuBaoSlDongThungTrangThaiManySupabase(ids, trang_thai);
}

export async function updateDuBaoSlDongThungTrangThai(
  id: string,
  trang_thai: TrangThaiDuBaoSlDongThungPhieu
): Promise<FarmDuBaoSlDongThung> {
  const row = await updateDuBaoSlDongThungTrangThaiSupabase(id, trang_thai);
  const [enriched] = await enrichTenNguoiTao([row]);
  return enriched;
}
