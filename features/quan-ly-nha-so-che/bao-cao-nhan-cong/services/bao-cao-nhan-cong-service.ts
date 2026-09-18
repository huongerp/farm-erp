import type { BaoCaoNhanCongFormValues } from '../core/schema';
import type { FarmBaoCaoNhanCong, TrangThaiBaoCaoNhanCongPhieu } from '../core/types';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import type { PaginatedTableResult } from '../../../../lib/db';
import type { BaoCaoNhanCongListServerQuery } from './bao-cao-nhan-cong-list-query';
import {
  getAllBaoCaoNhanCongSupabase,
  getBaoCaoNhanCongPageSupabase,
  getBaoCaoNhanCongTomTatSupabase,
  fetchAllBaoCaoNhanCongForListQuery as fetchAllBaoCaoNhanCongForListQuerySupabase,
  type BaoCaoNhanCongTomTatRow,
  getBaoCaoNhanCongByIdSupabase,
  createBaoCaoNhanCongSupabase,
  updateBaoCaoNhanCongSupabase,
  deleteBaoCaoNhanCongSupabase,
  deleteBaoCaoNhanCongManySupabase,
  updateBaoCaoNhanCongTrangThaiSupabase,
  updateBaoCaoNhanCongTrangThaiManySupabase,
} from './bao-cao-nhan-cong-supabase.service';

async function enrichTenNguoiTao(items: FarmBaoCaoNhanCong[]): Promise<FarmBaoCaoNhanCong[]> {
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

export async function getAllBaoCaoNhanCong(): Promise<FarmBaoCaoNhanCong[]> {
  const rows = await getAllBaoCaoNhanCongSupabase();
  return enrichTenNguoiTao(rows);
}

/** Một trang danh sách (lọc / sắp xếp / phân trang ở PostgREST). */
export async function getBaoCaoNhanCongPage(
  query: BaoCaoNhanCongListServerQuery
): Promise<PaginatedTableResult<FarmBaoCaoNhanCong>> {
  const page = await getBaoCaoNhanCongPageSupabase(query);
  return { ...page, data: await enrichTenNguoiTao(page.data) };
}

/** Danh sách tóm tắt: chip lọc + số đếm, chi nhánh gợi ý, chặn trùng ngày×chi nhánh. */
export async function getBaoCaoNhanCongTomTat(
  viewAll: boolean,
  allowedBranchIds: string[]
): Promise<BaoCaoNhanCongTomTat[]> {
  const rows = await getBaoCaoNhanCongTomTatSupabase(viewAll, allowedBranchIds);
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

/** Bản rút gọn của một phiếu — đủ cho chip lọc, gợi ý chi nhánh và chặn trùng. */
export interface BaoCaoNhanCongTomTat {
  id: string;
  ngay: string;
  id_chi_nhanh: string | null;
  ten_chi_nhanh: string | null;
  trang_thai: string | null;
  id_nguoi_tao: string | null;
  tg_tao: string | null;
}

/** Toàn bộ bản ghi khớp bộ lọc — chỉ gọi khi mở hộp thoại Xuất file. */
export async function fetchAllBaoCaoNhanCongForListQuery(
  query: BaoCaoNhanCongListServerQuery
): Promise<FarmBaoCaoNhanCong[]> {
  return enrichTenNguoiTao(await fetchAllBaoCaoNhanCongForListQuerySupabase(query));
}

export type { BaoCaoNhanCongTomTatRow };

export async function getBaoCaoNhanCongById(id: string): Promise<FarmBaoCaoNhanCong | null> {
  const row = await getBaoCaoNhanCongByIdSupabase(id);
  if (!row) return null;
  const [enriched] = await enrichTenNguoiTao([row]);
  return enriched;
}

export async function createBaoCaoNhanCong(
  values: BaoCaoNhanCongFormValues,
  idNguoiTao: string | null
): Promise<FarmBaoCaoNhanCong> {
  const row = await createBaoCaoNhanCongSupabase(values, idNguoiTao);
  const [enriched] = await enrichTenNguoiTao([row]);
  return enriched;
}

export async function updateBaoCaoNhanCong(
  id: string,
  values: BaoCaoNhanCongFormValues
): Promise<FarmBaoCaoNhanCong> {
  const row = await updateBaoCaoNhanCongSupabase(id, values);
  const [enriched] = await enrichTenNguoiTao([row]);
  return enriched;
}

export async function deleteBaoCaoNhanCong(id: string): Promise<void> {
  await deleteBaoCaoNhanCongSupabase(id);
}

export async function deleteBaoCaoNhanCongMany(ids: string[]): Promise<void> {
  await deleteBaoCaoNhanCongManySupabase(ids);
}

export async function updateBaoCaoNhanCongTrangThaiMany(
  ids: string[],
  trang_thai: TrangThaiBaoCaoNhanCongPhieu
): Promise<void> {
  await updateBaoCaoNhanCongTrangThaiManySupabase(ids, trang_thai);
}

export async function updateBaoCaoNhanCongTrangThai(
  id: string,
  trang_thai: TrangThaiBaoCaoNhanCongPhieu
): Promise<FarmBaoCaoNhanCong> {
  const row = await updateBaoCaoNhanCongTrangThaiSupabase(id, trang_thai);
  const [enriched] = await enrichTenNguoiTao([row]);
  return enriched;
}
