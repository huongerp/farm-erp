import type { CongViec } from '../core/types';
import {
  getCongViecList as getCongViecListSupabase,
  getCongViecById as getCongViecByIdSupabase,
  createCongViec as createCongViecSupabase,
  updateCongViec as updateCongViecSupabase,
  deleteCongViecList as deleteCongViecListSupabase,
  getBinhLuanByCongViecId as getBinhLuanByCongViecIdSupabase,
  createBinhLuan as createBinhLuanSupabase,
  importCongViecList as importCongViecListSupabase,
} from './cong-viec-supabase.service';
import type { CongViecFormValues } from '../core/schema';

export const getCongViecList = getCongViecListSupabase;
export const getCongViecById = getCongViecByIdSupabase;
export const createCongViec = (
  data: CongViecFormValues,
  id_nguoi_giao: number | string
) => createCongViecSupabase(data, id_nguoi_giao);
export const updateCongViec = updateCongViecSupabase;
export const deleteCongViecList = deleteCongViecListSupabase;
export const getBinhLuanByCongViecId = getBinhLuanByCongViecIdSupabase;
export const createBinhLuan = createBinhLuanSupabase;
export const importCongViecList = (
  rows: Parameters<typeof importCongViecListSupabase>[0],
  id_nguoi_giao: number | string
) => importCongViecListSupabase(rows, id_nguoi_giao);

/** Flatten tree by parent: root first, then children at level 2, etc. */
export function flattenCongViecWithLevel(
  items: CongViec[],
  parentId: number | null = null,
  level = 1
): { item: CongViec; level: number }[] {
  const result: { item: CongViec; level: number }[] = [];
  const children = items.filter((i) => (i.id_cha ?? null) === parentId);
  for (const item of children) {
    result.push({ item, level });
    result.push(...flattenCongViecWithLevel(items, item.id, level + 1));
  }
  return result;
}
