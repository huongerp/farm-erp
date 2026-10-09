import type { CongViec } from '../core/types';
import {
  getCongViecList as getCongViecListDb,
  getCongViecById as getCongViecByIdDb,
  createCongViec as createCongViecDb,
  updateCongViec as updateCongViecDb,
  deleteCongViecList as deleteCongViecListDb,
  updateCongViecMany as updateCongViecManyDb,
  getBinhLuanByCongViecId as getBinhLuanByCongViecIdDb,
  createBinhLuan as createBinhLuanDb,
  importCongViecList as importCongViecListDb,
} from './cong-viec-db.service';
import type { CongViecFormValues } from '../core/schema';

export const getCongViecList = getCongViecListDb;
export const getCongViecById = getCongViecByIdDb;
export const createCongViec = (
  data: CongViecFormValues,
  id_nguoi_giao: number | string
) => createCongViecDb(data, id_nguoi_giao);
export const updateCongViec = updateCongViecDb;
export const deleteCongViecList = deleteCongViecListDb;
export const updateCongViecMany = updateCongViecManyDb;
export const getBinhLuanByCongViecId = getBinhLuanByCongViecIdDb;
export const createBinhLuan = createBinhLuanDb;
export const importCongViecList = (
  rows: Parameters<typeof importCongViecListDb>[0],
  id_nguoi_giao: number | string
) => importCongViecListDb(rows, id_nguoi_giao);

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
