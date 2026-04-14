import type { ThuHoachKeHoachFormValues, ThuHoachThucTeFormValues } from '../core/schema';
import type { FarmThuHoach } from '../core/types';
import {
  getAllThuHoachSupabase,
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
