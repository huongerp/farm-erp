import type { DuBaoSlDongThungFormValues } from '../core/schema';
import type { FarmDuBaoSlDongThung, TrangThaiDuBaoSlDongThungPhieu } from '../core/types';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import {
  getAllDuBaoSlDongThungSupabase,
  getDuBaoSlDongThungByIdSupabase,
  createDuBaoSlDongThungSupabase,
  updateDuBaoSlDongThungSupabase,
  deleteDuBaoSlDongThungSupabase,
  deleteDuBaoSlDongThungManySupabase,
  updateDuBaoSlDongThungTrangThaiSupabase,
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

export async function updateDuBaoSlDongThungTrangThai(
  id: string,
  trang_thai: TrangThaiDuBaoSlDongThungPhieu
): Promise<FarmDuBaoSlDongThung> {
  const row = await updateDuBaoSlDongThungTrangThaiSupabase(id, trang_thai);
  const [enriched] = await enrichTenNguoiTao([row]);
  return enriched;
}
