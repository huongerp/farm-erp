import type { BaoCaoSoCheFormValues } from '../core/schema';
import type { FarmBaoCaoSoChe, TrangThaiBaoCaoSoChePhieu } from '../core/types';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import type { PaginatedTableResult } from '../../../../lib/db';
import type { BaoCaoSoCheListServerQuery } from './bao-cao-so-che-list-query';
import {
  getAllBaoCaoSoCheSupabase,
  getBaoCaoSoChePageSupabase,
  getBaoCaoSoCheTomTatSupabase,
  fetchAllBaoCaoSoCheForListQuery as fetchAllBaoCaoSoCheForListQuerySupabase,
  getBaoCaoSoCheByIdSupabase,
  createBaoCaoSoCheSupabase,
  updateBaoCaoSoCheSupabase,
  deleteBaoCaoSoCheSupabase,
  deleteBaoCaoSoCheManySupabase,
  updateBaoCaoSoCheTrangThaiSupabase,
  updateBaoCaoSoCheTrangThaiManySupabase,
} from './bao-cao-so-che-supabase.service';

async function enrichTenNguoiTao(items: FarmBaoCaoSoChe[]): Promise<FarmBaoCaoSoChe[]> {
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
export async function getBaoCaoSoChePage(
  query: BaoCaoSoCheListServerQuery
): Promise<PaginatedTableResult<FarmBaoCaoSoChe>> {
  const page = await getBaoCaoSoChePageSupabase(query);
  return { ...page, data: await enrichTenNguoiTao(page.data) };
}

/** Toàn bộ bản ghi khớp bộ lọc — chỉ gọi khi mở hộp thoại Xuất file. */
export async function fetchAllBaoCaoSoCheForListQuery(
  query: BaoCaoSoCheListServerQuery
): Promise<FarmBaoCaoSoChe[]> {
  return enrichTenNguoiTao(await fetchAllBaoCaoSoCheForListQuerySupabase(query));
}

/** Bản rút gọn của một phiếu — đủ cho chip lọc, gợi ý chi nhánh và chặn trùng. */
export interface BaoCaoSoCheTomTat {
  id: string;
  /** Đơn vị tính của phiếu (lấy từ dòng chi tiết đầu tiên có giá trị). */
  don_vi_tinh: string;
  ngay: string;
  id_chi_nhanh: string | null;
  ten_chi_nhanh: string | null;
  trang_thai: string | null;
  id_nguoi_tao: string | null;
  tg_tao: string | null;
}

/** Danh sách tóm tắt: chip lọc + số đếm, chi nhánh gợi ý, chặn trùng ngày×chi nhánh. */
export async function getBaoCaoSoCheTomTat(
  viewAll: boolean,
  allowedBranchIds: string[]
): Promise<BaoCaoSoCheTomTat[]> {
  const rows = await getBaoCaoSoCheTomTatSupabase(viewAll, allowedBranchIds);
  return rows.map((r) => ({
    id: String(r.id),
    ngay: typeof r.ngay === 'string' ? r.ngay.slice(0, 10) : String(r.ngay),
    id_chi_nhanh: r.id_chi_nhanh != null ? String(r.id_chi_nhanh) : null,
    ten_chi_nhanh: r.ten_chi_nhanh ?? null,
    trang_thai: r.trang_thai ?? null,
    id_nguoi_tao: r.id_nguoi_tao != null ? String(r.id_nguoi_tao) : null,
    tg_tao: r.tg_tao ?? null,
    don_vi_tinh:
      (r.fp_farm_bao_cao_so_che_ct ?? []).find((ct) => (ct.don_vi_tinh ?? '').trim() !== '')?.don_vi_tinh ?? '',
  }));
}

export async function getAllBaoCaoSoChe(): Promise<FarmBaoCaoSoChe[]> {
  const rows = await getAllBaoCaoSoCheSupabase();
  return enrichTenNguoiTao(rows);
}

export async function getBaoCaoSoCheById(id: string): Promise<FarmBaoCaoSoChe | null> {
  const row = await getBaoCaoSoCheByIdSupabase(id);
  if (!row) return null;
  const [enriched] = await enrichTenNguoiTao([row]);
  return enriched;
}

export async function createBaoCaoSoChe(
  values: BaoCaoSoCheFormValues,
  idNguoiTao: string | null
): Promise<FarmBaoCaoSoChe> {
  const row = await createBaoCaoSoCheSupabase(values, idNguoiTao);
  const [enriched] = await enrichTenNguoiTao([row]);
  return enriched;
}

export async function updateBaoCaoSoChe(id: string, values: BaoCaoSoCheFormValues): Promise<FarmBaoCaoSoChe> {
  const row = await updateBaoCaoSoCheSupabase(id, values);
  const [enriched] = await enrichTenNguoiTao([row]);
  return enriched;
}

export async function deleteBaoCaoSoChe(id: string): Promise<void> {
  await deleteBaoCaoSoCheSupabase(id);
}

export async function deleteBaoCaoSoCheMany(ids: string[]): Promise<void> {
  await deleteBaoCaoSoCheManySupabase(ids);
}

export async function updateBaoCaoSoCheTrangThaiMany(
  ids: string[],
  trang_thai: TrangThaiBaoCaoSoChePhieu
): Promise<void> {
  await updateBaoCaoSoCheTrangThaiManySupabase(ids, trang_thai);
}

export async function updateBaoCaoSoCheTrangThai(
  id: string,
  trang_thai: TrangThaiBaoCaoSoChePhieu
): Promise<FarmBaoCaoSoChe> {
  const row = await updateBaoCaoSoCheTrangThaiSupabase(id, trang_thai);
  const [enriched] = await enrichTenNguoiTao([row]);
  return enriched;
}
