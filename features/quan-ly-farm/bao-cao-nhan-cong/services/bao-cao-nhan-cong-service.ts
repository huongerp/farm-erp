import type { BaoCaoNhanCongFormValues } from '../core/schema';
import type { FarmBaoCaoNhanCong } from '../core/types';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import {
  getAllBaoCaoNhanCongSupabase,
  getBaoCaoNhanCongByIdSupabase,
  createBaoCaoNhanCongSupabase,
  updateBaoCaoNhanCongSupabase,
  deleteBaoCaoNhanCongSupabase,
  deleteBaoCaoNhanCongManySupabase,
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
