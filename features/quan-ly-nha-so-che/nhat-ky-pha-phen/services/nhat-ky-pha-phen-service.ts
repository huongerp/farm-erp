import type { PaginatedTableResult } from '../../../../lib/db';
import type { NhatKyPhaPhen } from '../core/types';
import type { NhatKyPhaPhenListServerQuery } from './nhat-ky-pha-phen-list-query';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import {
  fetchAllNkppForListQuery as fetchAllDb,
  getNkppByIdDb,
  getNkppPageDb,
  getNkppTomTatDb,
} from './nhat-ky-pha-phen-db.service';

export {
  luuNkppDb as luuNkpp,
  deleteNkppDb as deleteNkpp,
  deleteNkppManyDb as deleteNkppMany,
  getHoListDb as getHoList,
  getHoDangDungTheoChiNhanhDb as getHoDangDungTheoChiNhanh,
  luuHoDb as luuHo,
  doiTrangThaiHoDb as doiTrangThaiHo,
  getNkppChiTietPageDb as getNkppChiTietPage,
  fetchAllNkppChiTietForListQuery,
} from './nhat-ky-pha-phen-db.service';

/** Điền tên người tạo (id_nguoi_tao có 2 FK tới nhân viên nên không embed). */
async function enrich(items: NhatKyPhaPhen[]): Promise<NhatKyPhaPhen[]> {
  if (items.length === 0) return items;
  const employees = await getEmployeesRef();
  const m = new Map(employees.map((e) => [String(e.id), e.ho_ten]));
  return items.map((i) => ({ ...i, ten_nguoi_tao: i.id_nguoi_tao ? (m.get(i.id_nguoi_tao) ?? null) : null }));
}

export async function getNkppPage(query: NhatKyPhaPhenListServerQuery): Promise<PaginatedTableResult<NhatKyPhaPhen>> {
  const page = await getNkppPageDb(query);
  return { ...page, data: await enrich(page.data) };
}

export async function fetchAllNkppForListQuery(query: NhatKyPhaPhenListServerQuery): Promise<NhatKyPhaPhen[]> {
  return enrich(await fetchAllDb(query));
}

export async function getNkppById(id: string): Promise<NhatKyPhaPhen | null> {
  const row = await getNkppByIdDb(id);
  if (!row) return null;
  const [r] = await enrich([row]);
  return r;
}

/** Bản rút gọn toàn bộ nhật ký: chip lọc. */
export interface NkppTomTat {
  id: string;
  ngay: string;
  id_chi_nhanh: string | null;
}

export async function getNkppTomTat(viewAll: boolean, allowedBranchIds: string[]): Promise<NkppTomTat[]> {
  const rows = await getNkppTomTatDb(viewAll, allowedBranchIds);
  return rows.map((r) => ({
    id: String(r.id),
    ngay: r.ngay,
    id_chi_nhanh: r.id_chi_nhanh != null ? String(r.id_chi_nhanh) : null,
  }));
}
