/**
 * Phiếu checklist công đoạn — lớp service: tên người tạo / nhận (enrich) + re-export các hàm DB.
 * Đổi trạng thái CHỈ qua RPC rpc_cl_* (bọc bởi *PhieuDb bên dưới).
 */
import type { PaginatedTableResult } from '../../../../lib/db';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import type { PhieuChecklistListItem } from '../core/list-types';
import type { ChecklistBanGiaoListServerQuery } from './checklist-ban-giao-list-query';
import {
  fetchAllPhieuForListQueryDb,
  getPhieuByIdDb,
  getPhieuPageDb,
} from './checklist-ban-giao-db.service';

export {
  chuyenPhieuDb as chuyenPhieu,
  createPhieuDb as createPhieu,
  deletePhieuDb as deletePhieu,
  getDongByPhieuDb as getDongByPhieu,
  getLichSuByPhieuDb as getLichSuByPhieu,
  getMauChoChonDb as getMauChoChon,
  getPhieuTomTatDb as getPhieuTomTat,
  huyPhieuDb as huyPhieu,
  moLaiPhieuDb as moLaiPhieu,
  nhanPhieuDb as nhanPhieu,
  traLaiPhieuDb as traLaiPhieu,
  updateDongKiemTraDb as updateDongKiemTra,
  updateDongThucHienDb as updateDongThucHien,
  updatePhieuKetLuanDb as updatePhieuKetLuan,
  updatePhieuThongTinDb as updatePhieuThongTin,
  type LuuDongKiemTraInput,
  type LuuDongThucHienInput,
  type MauChoChon,
  type PhieuKetLuanInput,
  type PhieuThongTinInput,
  type PhieuTomTatRow,
} from './checklist-ban-giao-db.service';

async function hoTenMap(): Promise<Map<string, string>> {
  const employees = await getEmployeesRef();
  return new Map(employees.map((e) => [String(e.id), e.ho_ten]));
}

const ten = (m: Map<string, string>, id: string | null) => (id ? (m.get(id) ?? null) : null);

async function enrich(items: PhieuChecklistListItem[]): Promise<PhieuChecklistListItem[]> {
  if (items.length === 0) return items;
  const m = await hoTenMap();
  return items.map((i) => ({ ...i, ten_nguoi_tao: ten(m, i.id_nguoi_tao), ten_nguoi_nhan: ten(m, i.id_nguoi_nhan) }));
}

export async function getPhieuPage(
  query: ChecklistBanGiaoListServerQuery
): Promise<PaginatedTableResult<PhieuChecklistListItem>> {
  const page = await getPhieuPageDb(query);
  return { ...page, data: await enrich(page.data) };
}

export async function getPhieuById(id: string): Promise<PhieuChecklistListItem | null> {
  const row = await getPhieuByIdDb(id);
  if (!row) return null;
  const [r] = await enrich([row]);
  return r;
}

/** Toàn bộ phiếu theo bộ lọc (bấm Xuất file) — tên người đã điền. */
export async function fetchAllPhieuForListQuery(
  query: ChecklistBanGiaoListServerQuery
): Promise<PhieuChecklistListItem[]> {
  return enrich(await fetchAllPhieuForListQueryDb(query));
}
