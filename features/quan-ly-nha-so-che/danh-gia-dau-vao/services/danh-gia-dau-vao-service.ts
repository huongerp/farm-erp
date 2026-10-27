/** Đánh giá đầu vào — ghép tên nhân viên (người tạo, tổ trưởng) từ danh sách nhân viên rút gọn (cache). */
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import type { PaginatedTableResult } from '../../../../lib/db';
import type { DgdvPhieuDayDu, FarmDgdv, TuanIso, VarLoThuHoach } from '../core/types';
import type { DgdvListServerQuery } from './danh-gia-dau-vao-list-query';
import {
  fetchAllDgdvForListQueryDb,
  getDgdvByIdDb,
  getDgdvPageDb,
  getDgdvTheoTuanDb,
  type DgdvListRow,
} from './danh-gia-dau-vao-db.service';
import { getLoThuHoachDb } from './danh-muc-dgdv.service';

async function mapTenNhanVien(): Promise<Map<string, string>> {
  const employees = await getEmployeesRef();
  return new Map(employees.map((e) => [String(e.id), e.ho_ten]));
}

const tenTheoId = (m: Map<string, string>, id: string | null) => (id ? (m.get(id) ?? null) : null);

async function enrichNguoiTao<T extends FarmDgdv>(items: T[]): Promise<T[]> {
  if (items.length === 0) return items;
  const m = await mapTenNhanVien();
  return items.map((it) => ({ ...it, ten_nguoi_tao: tenTheoId(m, it.id_nguoi_tao) }));
}

async function enrichPhieu(items: DgdvPhieuDayDu[]): Promise<DgdvPhieuDayDu[]> {
  if (items.length === 0) return items;
  const m = await mapTenNhanVien();
  return items.map((p) => ({
    ...p,
    ten_nguoi_tao: tenTheoId(m, p.id_nguoi_tao),
    lo: p.lo.map((l) => ({ ...l, ten_to_truong: tenTheoId(m, l.id_to_truong) })),
  }));
}

export async function getDgdvPage(query: DgdvListServerQuery): Promise<PaginatedTableResult<DgdvListRow>> {
  const page = await getDgdvPageDb(query);
  return { ...page, data: await enrichNguoiTao(page.data) };
}

export async function fetchAllDgdvForListQuery(query: DgdvListServerQuery): Promise<DgdvListRow[]> {
  return enrichNguoiTao(await fetchAllDgdvForListQueryDb(query));
}

export async function getDgdvById(id: string): Promise<DgdvPhieuDayDu | null> {
  const p = await getDgdvByIdDb(id);
  if (!p) return null;
  const [kq] = await enrichPhieu([p]);
  return kq;
}

export async function getDgdvTheoTuan(
  dsTuan: TuanIso[],
  idChiNhanh: string | null,
  viewAll: boolean,
  allowedBranchIds: string[]
): Promise<DgdvPhieuDayDu[]> {
  return enrichPhieu(await getDgdvTheoTuanDb(dsTuan, idChiNhanh, viewAll, allowedBranchIds));
}

export async function getLoThuHoach(): Promise<VarLoThuHoach[]> {
  const rows = await getLoThuHoachDb();
  if (rows.length === 0) return rows;
  const m = await mapTenNhanVien();
  return rows.map((r) => ({ ...r, ten_to_truong: tenTheoId(m, r.id_to_truong) }));
}
