import type { BaoCaoSoCheFormValues } from '../core/schema';
import type { FarmBaoCaoSoChe, TrangThaiBaoCaoSoChePhieu } from '../core/types';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import {
  getAllBaoCaoSoCheSupabase,
  getBaoCaoSoCheByIdSupabase,
  createBaoCaoSoCheSupabase,
  updateBaoCaoSoCheSupabase,
  deleteBaoCaoSoCheSupabase,
  deleteBaoCaoSoCheManySupabase,
  updateBaoCaoSoCheTrangThaiSupabase,
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

export async function updateBaoCaoSoCheTrangThai(
  id: string,
  trang_thai: TrangThaiBaoCaoSoChePhieu
): Promise<FarmBaoCaoSoChe> {
  const row = await updateBaoCaoSoCheTrangThaiSupabase(id, trang_thai);
  const [enriched] = await enrichTenNguoiTao([row]);
  return enriched;
}
