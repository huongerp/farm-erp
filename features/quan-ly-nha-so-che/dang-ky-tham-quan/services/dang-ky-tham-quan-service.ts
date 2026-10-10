import type { PaginatedTableResult } from '../../../../lib/db';
import type { DangKyThamQuan, MucDichThamQuan, TrangThaiDkTq } from '../core/types';
import type { DangKyThamQuanListServerQuery } from './dang-ky-tham-quan-list-query';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import {
  fetchAllDkTqForListQuery as fetchAllDb,
  getDkTqByIdDb,
  getDkTqPageDb,
  getDkTqTomTatDb,
} from './dang-ky-tham-quan-db.service';

export {
  luuDkTqDb as luuDkTq,
  deleteDkTqDb as deleteDkTq,
  deleteDkTqManyDb as deleteDkTqMany,
  checkInDb as checkIn,
  checkOutDb as checkOut,
  hoanTacCheckInDb as hoanTacCheckIn,
  hoanTacCheckOutDb as hoanTacCheckOut,
  huyDkTqDb as huyDkTq,
  khoiPhucDkTqDb as khoiPhucDkTq,
  capNhatAnhDb as capNhatAnh,
  getGoiYKhachDb as getGoiYKhach,
  type CheckInOutInput,
} from './dang-ky-tham-quan-db.service';

async function hoTenMap(): Promise<Map<string, string>> {
  const employees = await getEmployeesRef();
  return new Map(employees.map((e) => [String(e.id), e.ho_ten]));
}

const ten = (m: Map<string, string>, id: string | null) => (id ? (m.get(id) ?? null) : null);

async function enrich(items: DangKyThamQuan[]): Promise<DangKyThamQuan[]> {
  if (items.length === 0) return items;
  const m = await hoTenMap();
  return items.map((i) => ({
    ...i,
    ten_nguoi_tao: ten(m, i.id_nguoi_tao),
    ten_nguoi_tiep_don: ten(m, i.id_nguoi_tiep_don),
    ten_nguoi_check_in: ten(m, i.id_nguoi_check_in),
    ten_nguoi_check_out: ten(m, i.id_nguoi_check_out),
  }));
}

export async function getDkTqPage(query: DangKyThamQuanListServerQuery): Promise<PaginatedTableResult<DangKyThamQuan>> {
  const page = await getDkTqPageDb(query);
  return { ...page, data: await enrich(page.data) };
}

export async function fetchAllDkTqForListQuery(query: DangKyThamQuanListServerQuery): Promise<DangKyThamQuan[]> {
  return enrich(await fetchAllDb(query));
}

export async function getDkTqById(id: string): Promise<DangKyThamQuan | null> {
  const row = await getDkTqByIdDb(id);
  if (!row) return null;
  const [r] = await enrich([row]);
  return r;
}

/** Bản rút gọn toàn bộ phiếu: chip lọc + chi nhánh gợi ý khi thêm. */
export interface DkTqTomTat {
  id: string;
  ngay_dang_ky: string;
  id_chi_nhanh: string | null;
  trang_thai: TrangThaiDkTq;
  muc_dich: MucDichThamQuan[];
  id_nguoi_tao: string | null;
  tg_tao: string | null;
}

export async function getDkTqTomTat(viewAll: boolean, allowedBranchIds: string[]): Promise<DkTqTomTat[]> {
  const rows = await getDkTqTomTatDb(viewAll, allowedBranchIds);
  return rows.map((r) => ({
    id: String(r.id),
    ngay_dang_ky: r.ngay_dang_ky,
    id_chi_nhanh: r.id_chi_nhanh != null ? String(r.id_chi_nhanh) : null,
    trang_thai: r.trang_thai,
    muc_dich: r.muc_dich ?? [],
    id_nguoi_tao: r.id_nguoi_tao != null ? String(r.id_nguoi_tao) : null,
    tg_tao: r.tg_tao,
  }));
}
