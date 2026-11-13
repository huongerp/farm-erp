import type { PaginatedTableResult } from '../../../../lib/db';
import type { NhatKyPhunCui } from '../core/types';
import type { NhatKyPhunCuiListServerQuery } from './nhat-ky-phun-cui-list-query';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import {
  fetchAllNhatKyForListQuery as fetchAllDb,
  getNhatKyByIdDb,
  getNhatKyPageDb,
  getNhatKyTomTatDb,
} from './nhat-ky-phun-cui-db.service';

export {
  luuNhatKyDb as luuNhatKy,
  deleteNhatKyDb as deleteNhatKy,
  deleteNhatKyManyDb as deleteNhatKyMany,
  getDinhMucDb as getDinhMuc,
  luuDinhMucDb as luuDinhMuc,
  doiDangDungDinhMucDb as doiDangDungDinhMuc,
} from './nhat-ky-phun-cui-db.service';

async function hoTenMap(): Promise<Map<string, string>> {
  const employees = await getEmployeesRef();
  return new Map(employees.map((e) => [String(e.id), e.ho_ten]));
}

const ten = (m: Map<string, string>, id: string | null) => (id ? (m.get(id) ?? null) : null);

async function enrich(items: NhatKyPhunCui[]): Promise<NhatKyPhunCui[]> {
  if (items.length === 0) return items;
  const m = await hoTenMap();
  return items.map((i) => ({
    ...i,
    ten_nhan_vien_phu_trach: ten(m, i.id_nhan_vien_phu_trach),
    ten_nguoi_tao: ten(m, i.id_nguoi_tao),
  }));
}

export async function getNhatKyPage(query: NhatKyPhunCuiListServerQuery): Promise<PaginatedTableResult<NhatKyPhunCui>> {
  const page = await getNhatKyPageDb(query);
  return { ...page, data: await enrich(page.data) };
}

export async function fetchAllNhatKyForListQuery(query: NhatKyPhunCuiListServerQuery): Promise<NhatKyPhunCui[]> {
  return enrich(await fetchAllDb(query));
}

export async function getNhatKyById(id: string): Promise<NhatKyPhunCui | null> {
  const row = await getNhatKyByIdDb(id);
  if (!row) return null;
  const [r] = await enrich([row]);
  return r;
}

/** Bản rút gọn toàn bộ nhật ký: chip lọc đếm trên toàn bộ dữ liệu. */
export interface NhatKyTomTat {
  id: string;
  ngay: string;
  id_chi_nhanh: string | null;
}

export async function getNhatKyTomTat(viewAll: boolean, allowedBranchIds: string[]): Promise<NhatKyTomTat[]> {
  const rows = await getNhatKyTomTatDb(viewAll, allowedBranchIds);
  return rows.map((r) => ({
    id: String(r.id),
    ngay: r.ngay,
    id_chi_nhanh: r.id_chi_nhanh != null ? String(r.id_chi_nhanh) : null,
  }));
}
