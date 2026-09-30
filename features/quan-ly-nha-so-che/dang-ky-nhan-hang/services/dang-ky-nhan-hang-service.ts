import type { PaginatedTableResult } from '../../../../lib/db';
import type { DangKyNhanHang, DangKyNhanHangCt, TrangThaiDkNh } from '../core/types';
import type { DangKyNhanHangListServerQuery } from './dang-ky-nhan-hang-list-query';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import {
  getDkNhPageDb,
  fetchAllDkNhForListQuery as fetchAllDkNhForListQueryDb,
  getDkNhTomTatDb,
  getDkNhByIdDb,
  getChiTietDb,
} from './dang-ky-nhan-hang-db.service';

export {
  createDkNhDb as createDkNh,
  updateDkNhDb as updateDkNh,
  deleteDkNhDb as deleteDkNh,
  deleteDkNhManyDb as deleteDkNhMany,
  checkInDb as checkIn,
  checkOutDb as checkOut,
  hoanTacCheckInDb as hoanTacCheckIn,
  hoanTacCheckOutDb as hoanTacCheckOut,
  huyDkNhDb as huyDkNh,
  khoiPhucDkNhDb as khoiPhucDkNh,
  capNhatAnhDb as capNhatAnh,
  themDongHangDb as themDongHang,
  xoaDongHangDb as xoaDongHang,
  hoanTacDongCuoiDb as hoanTacDongCuoi,
  getTongHangHoaTheoPhieuDb as getTongHangHoaTheoPhieu,
  getTongMotHangDb as getTongMotHang,
  type CheckInOutInput,
  type ThemDongHangInput,
} from './dang-ky-nhan-hang-db.service';

async function hoTenMap(): Promise<Map<string, string>> {
  const employees = await getEmployeesRef();
  return new Map(employees.map((e) => [String(e.id), e.ho_ten]));
}

const ten = (m: Map<string, string>, id: string | null) => (id ? (m.get(id) ?? null) : null);

async function enrich(items: DangKyNhanHang[]): Promise<DangKyNhanHang[]> {
  if (items.length === 0) return items;
  const m = await hoTenMap();
  return items.map((i) => ({
    ...i,
    ten_nguoi_tao: ten(m, i.id_nguoi_tao),
    ten_nguoi_check_in: ten(m, i.id_nguoi_check_in),
    ten_nguoi_check_out: ten(m, i.id_nguoi_check_out),
  }));
}

/** Một trang danh sách (lọc / sắp xếp / phân trang ở PostgREST). */
export async function getDkNhPage(
  query: DangKyNhanHangListServerQuery
): Promise<PaginatedTableResult<DangKyNhanHang>> {
  const page = await getDkNhPageDb(query);
  return { ...page, data: await enrich(page.data) };
}

/** Toàn bộ phiếu khớp bộ lọc — Xuất file / tab Thống kê. */
export async function fetchAllDkNhForListQuery(query: DangKyNhanHangListServerQuery): Promise<DangKyNhanHang[]> {
  return enrich(await fetchAllDkNhForListQueryDb(query));
}

export async function getDkNhById(id: string): Promise<DangKyNhanHang | null> {
  const row = await getDkNhByIdDb(id);
  if (!row) return null;
  const [r] = await enrich([row]);
  return r;
}

export async function getChiTiet(idPhieu: string): Promise<DangKyNhanHangCt[]> {
  const rows = await getChiTietDb(idPhieu);
  if (rows.length === 0) return rows;
  const m = await hoTenMap();
  return rows.map((r) => ({ ...r, ten_nguoi_quet: ten(m, r.id_nguoi_quet) }));
}

/** Bản rút gọn: chip lọc năm/tháng/trạng thái/chi nhánh + gợi ý khi thêm phiếu. */
export interface DkNhTomTat {
  id: string;
  ngay_dang_ky: string;
  id_chi_nhanh: string | null;
  ten_chi_nhanh: string | null;
  trang_thai: TrangThaiDkNh;
  khach_hang: string | null;
  loai_hang_hoa: string | null;
  id_nguoi_tao: string | null;
  tg_tao: string | null;
}

export async function getDkNhTomTat(viewAll: boolean, allowedBranchIds: string[]): Promise<DkNhTomTat[]> {
  const rows = await getDkNhTomTatDb(viewAll, allowedBranchIds);
  return rows.map((r) => ({
    id: String(r.id),
    ngay_dang_ky: r.ngay_dang_ky,
    id_chi_nhanh: r.id_chi_nhanh != null ? String(r.id_chi_nhanh) : null,
    ten_chi_nhanh: null,
    trang_thai: r.trang_thai,
    khach_hang: r.khach_hang,
    loai_hang_hoa: r.loai_hang_hoa,
    id_nguoi_tao: r.id_nguoi_tao != null ? String(r.id_nguoi_tao) : null,
    tg_tao: r.tg_tao,
  }));
}
