/**
 * Đăng ký nhận hàng — DB: fp_farm_dang_ky_nhan_hang (phiếu), fp_farm_dang_ky_nhan_hang_ct
 * (cây hàng xuất, mỗi cây 1 dòng), view v_farm_dang_ky_nhan_hang_tong_hh (tổng theo phiếu + hàng).
 */
import { db, fetchAllRows, fetchTablePage, throwDbError, type PaginatedTableResult } from '../../../../lib/db';
import { applyPostgrestSearch } from '../../../../lib/postgrest-search';
import i18n from '../../../../lib/i18n';
import type { DangKyNhanHang, DangKyNhanHangCt, NguonDongHang, TongHangHoaPhieu, TrangThaiDkNh } from '../core/types';
import type { PhieuXuatCuaXe, TinhTrangPhieuXuat, TrangThaiPhieuKho } from '../core/phieu-xuat';
import { BIEN_THE_SO_CHE } from '../../kho-bien-the/bien-the';
import { chuanHoaGio } from '../core/thoi-gian';
import type { DangKyNhanHangFormValues } from '../core/schema';
import {
  DKNH_SORTABLE_DB_COLUMNS,
  DKNH_SORT_MAC_DINH,
  type DangKyNhanHangListServerQuery,
} from './dang-ky-nhan-hang-list-query';

const TABLE = 'fp_farm_dang_ky_nhan_hang';
const TABLE_CT = 'fp_farm_dang_ky_nhan_hang_ct';
const VIEW_TONG = 'v_farm_dang_ky_nhan_hang_tong_hh';

const ROW_COLUMNS =
  'id,id_chi_nhanh,ngay_dang_ky,khach_hang,loai_hang_hoa,so_luong_dang_ky,so_xe,so_cont,ten_tai_xe,sdt_tai_xe,' +
  'gio_dang_ky_tu,gio_dang_ky_den,tg_vao_thuc_te,tg_ra_thuc_te,id_nguoi_check_in,id_nguoi_check_out,' +
  'trang_thai,ghi_chu,hinh_anh_urls,id_nguoi_tao,tg_tao,tg_cap_nhat,tinh_trang_phieu_xuat,' +
  'chi_nhanh:fp_var_chi_nhanh(ten_chi_nhanh)';

const CT_COLUMNS =
  'id,id_phieu,id_phieu_gscl,so_luong,nguon,ma_tem_quet,tg_quet,id_nguoi_quet,' +
  'gscl:fp_farm_giam_sat_chat_luong(so_phieu,ngay,ma_cay_hang,ket_luan,id_hang_hoa,so_thung_cay,' +
  'hang_hoa:fp_farm_danh_sach_hang_hoa(ma_hang_hoa,ten_hang_hoa,dvt))';

interface DbRow {
  id: number;
  id_chi_nhanh: number;
  ngay_dang_ky: string;
  khach_hang: string | null;
  loai_hang_hoa: string | null;
  so_luong_dang_ky: string | number | null;
  so_xe: string | null;
  so_cont: string | null;
  ten_tai_xe: string | null;
  sdt_tai_xe: string | null;
  gio_dang_ky_tu: string | null;
  gio_dang_ky_den: string | null;
  tg_vao_thuc_te: string | null;
  tg_ra_thuc_te: string | null;
  id_nguoi_check_in: number | null;
  id_nguoi_check_out: number | null;
  trang_thai: TrangThaiDkNh;
  ghi_chu: string | null;
  hinh_anh_urls: string[] | null;
  id_nguoi_tao: number | null;
  tg_tao: string;
  tg_cap_nhat: string;
  tinh_trang_phieu_xuat: TinhTrangPhieuXuat | null;
  chi_nhanh?: { ten_chi_nhanh: string | null } | null;
}

interface DbCtRow {
  id: number;
  id_phieu: number;
  id_phieu_gscl: number;
  so_luong: string | number;
  nguon: NguonDongHang;
  ma_tem_quet: string | null;
  tg_quet: string;
  id_nguoi_quet: number | null;
  gscl?: {
    so_phieu: string | null;
    ngay: string | null;
    ma_cay_hang: string | null;
    ket_luan: 'dat' | 'khong_dat' | null;
    id_hang_hoa: number | null;
    so_thung_cay: string | number | null;
    hang_hoa?: { ma_hang_hoa: string | null; ten_hang_hoa: string | null; dvt: string | null } | null;
  } | null;
}

interface DbTongRow {
  id_phieu: number;
  id_hang_hoa: number;
  ma_hang_hoa: string | null;
  ten_hang_hoa: string | null;
  dvt: string | null;
  so_dong: number;
  tong_so_luong: string | number;
}

const idStr = (v: number | null | undefined) => (v != null ? String(v) : null);
const num = (v: string | number | null | undefined) => {
  const n = typeof v === 'number' ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

function toIntId(id: string): number {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error('Invalid id');
  return n;
}

function rowToModel(row: DbRow): DangKyNhanHang {
  return {
    id: String(row.id),
    id_chi_nhanh: String(row.id_chi_nhanh),
    ten_chi_nhanh: row.chi_nhanh?.ten_chi_nhanh ?? null,
    ngay_dang_ky: row.ngay_dang_ky,
    khach_hang: row.khach_hang,
    loai_hang_hoa: row.loai_hang_hoa,
    so_luong_dang_ky: row.so_luong_dang_ky != null ? num(row.so_luong_dang_ky) : null,
    so_xe: row.so_xe,
    so_cont: row.so_cont,
    ten_tai_xe: row.ten_tai_xe,
    sdt_tai_xe: row.sdt_tai_xe,
    gio_dang_ky_tu: chuanHoaGio(row.gio_dang_ky_tu),
    gio_dang_ky_den: chuanHoaGio(row.gio_dang_ky_den),
    tg_vao_thuc_te: row.tg_vao_thuc_te,
    tg_ra_thuc_te: row.tg_ra_thuc_te,
    id_nguoi_check_in: idStr(row.id_nguoi_check_in),
    id_nguoi_check_out: idStr(row.id_nguoi_check_out),
    ten_nguoi_check_in: null,
    ten_nguoi_check_out: null,
    trang_thai: row.trang_thai,
    ghi_chu: row.ghi_chu,
    hinh_anh_urls: row.hinh_anh_urls ?? [],
    id_nguoi_tao: idStr(row.id_nguoi_tao),
    ten_nguoi_tao: null,
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
    tinh_trang_phieu_xuat: row.tinh_trang_phieu_xuat ?? null,
    tong_so_luong: 0,
  };
}

function ctToModel(row: DbCtRow): DangKyNhanHangCt {
  const g = row.gscl;
  return {
    id: String(row.id),
    id_phieu: String(row.id_phieu),
    id_phieu_gscl: String(row.id_phieu_gscl),
    so_phieu_gscl: g?.so_phieu ?? null,
    ngay_gscl: g?.ngay ?? null,
    ma_cay_hang: g?.ma_cay_hang ?? null,
    ket_luan_gscl: g?.ket_luan ?? null,
    id_hang_hoa: idStr(g?.id_hang_hoa),
    ma_hang_hoa: g?.hang_hoa?.ma_hang_hoa ?? null,
    ten_hang_hoa: g?.hang_hoa?.ten_hang_hoa ?? null,
    dvt: g?.hang_hoa?.dvt ?? null,
    so_luong: num(row.so_luong),
    so_thung_qc: g?.so_thung_cay != null ? num(g.so_thung_cay) : null,
    nguon: row.nguon,
    ma_tem_quet: row.ma_tem_quet,
    tg_quet: row.tg_quet,
    id_nguoi_quet: idStr(row.id_nguoi_quet),
    ten_nguoi_quet: null,
    xe_khac: [],
  };
}

function tongToModel(row: DbTongRow): TongHangHoaPhieu {
  return {
    id_phieu: String(row.id_phieu),
    id_hang_hoa: String(row.id_hang_hoa),
    ma_hang_hoa: row.ma_hang_hoa,
    ten_hang_hoa: row.ten_hang_hoa,
    dvt: row.dvt,
    so_dong: Number(row.so_dong ?? 0),
    tong_so_luong: num(row.tong_so_luong),
  };
}

const blank = (v: string | null | undefined) => {
  const s = (v ?? '').trim();
  return s === '' ? null : s;
};

function formPayload(v: DangKyNhanHangFormValues): Record<string, unknown> {
  return {
    id_chi_nhanh: toIntId(v.id_chi_nhanh),
    ngay_dang_ky: v.ngay_dang_ky,
    khach_hang: blank(v.khach_hang),
    loai_hang_hoa: blank(v.loai_hang_hoa),
    so_luong_dang_ky: blank(v.so_luong_dang_ky) != null ? Number(blank(v.so_luong_dang_ky)) : null,
    so_xe: blank(v.so_xe)?.toUpperCase() ?? null,
    so_cont: blank(v.so_cont)?.toUpperCase() ?? null,
    ten_tai_xe: blank(v.ten_tai_xe),
    sdt_tai_xe: blank(v.sdt_tai_xe),
    gio_dang_ky_tu: blank(v.gio_dang_ky_tu),
    gio_dang_ky_den: blank(v.gio_dang_ky_den),
    ghi_chu: blank(v.ghi_chu),
    hinh_anh_urls: v.hinh_anh_urls ?? [],
  };
}

/** Cột tham gia ô tìm kiếm ở server. */
const DKNH_SEARCH_SPEC = {
  text: ['khach_hang', 'loai_hang_hoa', 'so_xe', 'so_cont', 'ten_tai_xe', 'sdt_tai_xe', 'ghi_chu'],
  numeric: ['id'],
  dates: ['ngay_dang_ky'],
};

/** Lọc + sắp xếp dùng chung cho trang danh sách, xuất file và tab Thống kê. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyDkNhListQuery(q: any, query: DangKyNhanHangListServerQuery): any {
  let sel = q;
  if (!query.viewAll) {
    const ids = query.allowedBranchIds.map(Number).filter(Number.isFinite);
    sel = ids.length === 0 ? sel.eq('id', -1) : sel.in('id_chi_nhanh', ids);
  }
  if (query.idChiNhanh.length > 0) {
    sel = sel.in('id_chi_nhanh', query.idChiNhanh.map(Number).filter(Number.isFinite));
  }
  if (query.trangThai.length > 0) sel = sel.in('trang_thai', query.trangThai);
  if (query.tinhTrangPhieuXuat.length > 0) sel = sel.in('tinh_trang_phieu_xuat', query.tinhTrangPhieuXuat);
  if (query.ngayFrom) sel = sel.gte('ngay_dang_ky', query.ngayFrom);
  if (query.ngayTo) sel = sel.lte('ngay_dang_ky', query.ngayTo);

  sel = applyPostgrestSearch(sel, query.searchTerm, DKNH_SEARCH_SPEC);

  const dbSortable = query.sortColumn != null && DKNH_SORTABLE_DB_COLUMNS.has(query.sortColumn);
  const sortCol = dbSortable ? query.sortColumn! : DKNH_SORT_MAC_DINH.column;
  const ascending = dbSortable ? query.sortDirection !== 'desc' : DKNH_SORT_MAC_DINH.ascending;
  sel = sel.order(sortCol, { ascending, nullsFirst: false });
  if (sortCol === 'ngay_dang_ky') sel = sel.order('gio_dang_ky_tu', { ascending, nullsFirst: false });
  return sel.order('id', { ascending: false });
}

/** Tổng hàng hoá theo phiếu (view) — cho danh sách, chi tiết và thống kê. */
export async function getTongHangHoaTheoPhieuDb(idPhieu: string[]): Promise<TongHangHoaPhieu[]> {
  const ids = idPhieu.map(Number).filter(Number.isFinite);
  if (ids.length === 0) return [];
  const out: TongHangHoaPhieu[] = [];
  // Chia lô để URL `in.(...)` không quá dài khi thống kê cả năm.
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const rows = await fetchAllRows<DbTongRow>((from, to) =>
      db.from(VIEW_TONG).select('*').in('id_phieu', chunk).order('id_phieu').range(from, to)
    );
    out.push(...rows.map(tongToModel));
  }
  return out;
}

async function ganTongSoLuong(items: DangKyNhanHang[]): Promise<DangKyNhanHang[]> {
  if (items.length === 0) return items;
  const tong = await getTongHangHoaTheoPhieuDb(items.map((i) => i.id));
  const theoPhieu = new Map<string, number>();
  for (const t of tong) theoPhieu.set(t.id_phieu, (theoPhieu.get(t.id_phieu) ?? 0) + t.tong_so_luong);
  return items.map((i) => ({ ...i, tong_so_luong: theoPhieu.get(i.id) ?? 0 }));
}

export async function getDkNhPageDb(
  query: DangKyNhanHangListServerQuery
): Promise<PaginatedTableResult<DangKyNhanHang>> {
  const result = await fetchTablePage<DbRow>(query.page, query.pageSize, async (from, to) => {
    const res = await applyDkNhListQuery(db.from(TABLE).select(ROW_COLUMNS, { count: 'exact' }), query).range(
      from,
      to
    );
    return { data: (res.data as DbRow[] | null) ?? null, error: res.error, count: res.count };
  });
  return { ...result, data: await ganTongSoLuong(result.data.map(rowToModel)) };
}

/** Toàn bộ phiếu khớp bộ lọc — chỉ khi Xuất file hoặc tab Thống kê (lọc theo khoảng ngày). */
export async function fetchAllDkNhForListQuery(query: DangKyNhanHangListServerQuery): Promise<DangKyNhanHang[]> {
  const rows = await fetchAllRows<DbRow>((from, to) =>
    applyDkNhListQuery(db.from(TABLE).select(ROW_COLUMNS), query).range(from, to)
  );
  return ganTongSoLuong(rows.map(rowToModel));
}

export interface DkNhTomTatRow {
  id: number;
  ngay_dang_ky: string;
  id_chi_nhanh: number | null;
  trang_thai: TrangThaiDkNh;
  tinh_trang_phieu_xuat: TinhTrangPhieuXuat | null;
  khach_hang: string | null;
  loai_hang_hoa: string | null;
  id_nguoi_tao: number | null;
  tg_tao: string | null;
}

/** Vài cột của toàn bộ phiếu — chip lọc (đếm trên toàn bộ), gợi ý khách hàng / loại hàng / chi nhánh. */
export async function getDkNhTomTatDb(viewAll: boolean, allowedBranchIds: string[]): Promise<DkNhTomTatRow[]> {
  return fetchAllRows<DkNhTomTatRow>((from, to) => {
    let sel = db
      .from(TABLE)
      .select('id,ngay_dang_ky,id_chi_nhanh,trang_thai,tinh_trang_phieu_xuat,khach_hang,loai_hang_hoa,id_nguoi_tao,tg_tao');
    if (!viewAll) {
      const ids = allowedBranchIds.map(Number).filter(Number.isFinite);
      sel = ids.length === 0 ? sel.eq('id', -1) : sel.in('id_chi_nhanh', ids);
    }
    return sel.order('ngay_dang_ky', { ascending: false }).order('id', { ascending: false }).range(from, to);
  });
}

export async function getDkNhByIdDb(id: string): Promise<DangKyNhanHang | null> {
  const { data, error } = await db.from(TABLE).select(ROW_COLUMNS).eq('id', toIntId(id)).maybeSingle();
  if (error) throwDbError(error);
  if (!data) return null;
  const [row] = await ganTongSoLuong([rowToModel(data as unknown as DbRow)]);
  return row;
}

export async function createDkNhDb(values: DangKyNhanHangFormValues, idNguoiTao: string | null): Promise<DangKyNhanHang> {
  const payload = { ...formPayload(values), id_nguoi_tao: idNguoiTao ? toIntId(idNguoiTao) : null };
  const { data, error } = await db.from(TABLE).insert(payload).select(ROW_COLUMNS).single();
  if (error) throwDbError(error);
  return rowToModel(data as unknown as DbRow);
}

export async function updateDkNhDb(id: string, values: DangKyNhanHangFormValues): Promise<DangKyNhanHang> {
  const { data, error } = await db.from(TABLE).update(formPayload(values)).eq('id', toIntId(id)).select(ROW_COLUMNS).single();
  if (error) throwDbError(error);
  return rowToModel(data as unknown as DbRow);
}

export async function deleteDkNhDb(id: string): Promise<void> {
  const { error } = await db.from(TABLE).delete().eq('id', toIntId(id));
  if (error) throwDbError(error);
}

export async function deleteDkNhManyDb(ids: string[]): Promise<void> {
  const nums = ids.map(Number).filter(Number.isFinite);
  if (nums.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', nums);
  if (error) throwDbError(error);
}

/**
 * Đổi trạng thái có điều kiện `trang_thai = tuTrangThai` — hai người bấm cùng lúc thì
 * người sau nhận lỗi "phiếu đã đổi trạng thái" thay vì ghi đè giờ của người trước.
 */
async function chuyenTrangThai(
  id: string,
  tuTrangThai: TrangThaiDkNh,
  patch: Record<string, unknown>
): Promise<DangKyNhanHang> {
  const { data, error } = await db
    .from(TABLE)
    .update(patch)
    .eq('id', toIntId(id))
    .eq('trang_thai', tuTrangThai)
    .select(ROW_COLUMNS);
  if (error) throwDbError(error);
  const rows = (data as unknown as DbRow[] | null) ?? [];
  if (rows.length === 0) throw new Error(i18n.t('dangKyNhanHang.service.trangThaiDaDoi'));
  return rowToModel(rows[0]);
}

async function docAnhVaGhiChu(id: string): Promise<{ hinh_anh_urls: string[]; ghi_chu: string | null }> {
  const { data, error } = await db.from(TABLE).select('hinh_anh_urls,ghi_chu').eq('id', toIntId(id)).maybeSingle();
  if (error) throwDbError(error);
  if (!data) throw new Error(i18n.t('dangKyNhanHang.service.notFound'));
  const r = data as { hinh_anh_urls: string[] | null; ghi_chu: string | null };
  return { hinh_anh_urls: r.hinh_anh_urls ?? [], ghi_chu: r.ghi_chu };
}

export interface CheckInOutInput {
  id: string;
  /** ISO */
  thoiDiem: string;
  idNguoi: string | null;
  /** Ảnh thêm vào (nối sau ảnh cũ). */
  hinhAnhUrls?: string[];
  /** Nối thêm một dòng vào ghi chú phiếu. */
  ghiChu?: string;
}

async function patchAnhGhiChu(input: CheckInOutInput, nhan: string): Promise<Record<string, unknown>> {
  const moi = (input.hinhAnhUrls ?? []).filter(Boolean);
  const note = (input.ghiChu ?? '').trim();
  if (moi.length === 0 && !note) return {};
  const cur = await docAnhVaGhiChu(input.id);
  const patch: Record<string, unknown> = {};
  if (moi.length) patch.hinh_anh_urls = [...cur.hinh_anh_urls, ...moi.filter((u) => !cur.hinh_anh_urls.includes(u))];
  if (note) patch.ghi_chu = cur.ghi_chu?.trim() ? `${cur.ghi_chu.trim()}\n${nhan}: ${note}` : `${nhan}: ${note}`;
  return patch;
}

export async function checkInDb(input: CheckInOutInput): Promise<DangKyNhanHang> {
  const extra = await patchAnhGhiChu(input, 'Check in');
  return chuyenTrangThai(input.id, 'cho_vao', {
    ...extra,
    trang_thai: 'da_vao',
    tg_vao_thuc_te: input.thoiDiem,
    id_nguoi_check_in: input.idNguoi ? toIntId(input.idNguoi) : null,
  });
}

export async function checkOutDb(input: CheckInOutInput): Promise<DangKyNhanHang> {
  const extra = await patchAnhGhiChu(input, 'Check out');
  return chuyenTrangThai(input.id, 'da_vao', {
    ...extra,
    trang_thai: 'da_ra',
    tg_ra_thuc_te: input.thoiDiem,
    id_nguoi_check_out: input.idNguoi ? toIntId(input.idNguoi) : null,
  });
}

export function hoanTacCheckInDb(id: string): Promise<DangKyNhanHang> {
  return chuyenTrangThai(id, 'da_vao', { trang_thai: 'cho_vao', tg_vao_thuc_te: null, id_nguoi_check_in: null });
}

export function hoanTacCheckOutDb(id: string): Promise<DangKyNhanHang> {
  return chuyenTrangThai(id, 'da_ra', { trang_thai: 'da_vao', tg_ra_thuc_te: null, id_nguoi_check_out: null });
}

export function huyDkNhDb(id: string): Promise<DangKyNhanHang> {
  return chuyenTrangThai(id, 'cho_vao', { trang_thai: 'huy' });
}

export function khoiPhucDkNhDb(id: string): Promise<DangKyNhanHang> {
  return chuyenTrangThai(id, 'huy', { trang_thai: 'cho_vao' });
}

/** Ghi lại toàn bộ danh sách ảnh (dialog Hình ảnh: thêm / xoá / đổi thứ tự). */
export async function capNhatAnhDb(id: string, urls: string[]): Promise<DangKyNhanHang> {
  const { data, error } = await db.from(TABLE).update({ hinh_anh_urls: urls }).eq('id', toIntId(id)).select(ROW_COLUMNS).single();
  if (error) throwDbError(error);
  return rowToModel(data as unknown as DbRow);
}

// ── Hàng hoá xuất ─────────────────────────────────────────────────────────────

export async function getChiTietDb(idPhieu: string): Promise<DangKyNhanHangCt[]> {
  const rows = await fetchAllRows<DbCtRow>((from, to) =>
    db
      .from(TABLE_CT)
      .select(CT_COLUMNS)
      .eq('id_phieu', toIntId(idPhieu))
      .order('tg_quet', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to)
  );
  return rows.map(ctToModel);
}

export interface ThemDongHangInput {
  id_phieu: string;
  id_phieu_gscl: string;
  /** Số thùng của cây hàng (chụp lại so_thung_cay của phiếu QC). */
  so_luong: number;
  nguon: NguonDongHang;
  ma_tem_quet: string | null;
  id_nguoi_quet: string | null;
}

/**
 * Ghi một cây hàng lên xe. Trả `false` khi cây hàng đã có trên xe này (unique
 * (id_phieu, id_phieu_gscl) — hai người quét cùng lúc).
 */
export async function themDongHangDb(row: ThemDongHangInput): Promise<boolean> {
  const { error } = await db.from(TABLE_CT).insert({
    id_phieu: toIntId(row.id_phieu),
    id_phieu_gscl: toIntId(row.id_phieu_gscl),
    so_luong: row.so_luong,
    nguon: row.nguon,
    ma_tem_quet: row.ma_tem_quet,
    id_nguoi_quet: row.id_nguoi_quet ? toIntId(row.id_nguoi_quet) : null,
  });
  if (error) {
    if (error.code === '23505') return false;
    throwDbError(error);
  }
  return true;
}

/** Sửa số thùng thực xếp lên xe của một dòng cây hàng (CHECK so_luong > 0 ở DB). */
export async function capNhatSoLuongDongDb(id: string, soLuong: number): Promise<void> {
  const { error } = await db.from(TABLE_CT).update({ so_luong: soLuong }).eq('id', toIntId(id));
  if (error) throwDbError(error);
}

export async function xoaDongHangDb(ids: string[]): Promise<void> {
  const nums = ids.map(Number).filter(Number.isFinite);
  if (nums.length === 0) return;
  const { error } = await db.from(TABLE_CT).delete().in('id', nums);
  if (error) throwDbError(error);
}

/** Xoá dòng ghi nhận gần nhất của phiếu (quét nhầm). Trả về false khi phiếu chưa có dòng nào. */
export async function hoanTacDongCuoiDb(idPhieu: string): Promise<boolean> {
  const { data, error } = await db
    .from(TABLE_CT)
    .select('id')
    .eq('id_phieu', toIntId(idPhieu))
    .order('tg_quet', { ascending: false })
    .order('id', { ascending: false })
    .limit(1);
  if (error) throwDbError(error);
  const row = (data as { id: number }[] | null)?.[0];
  if (!row) return false;
  await xoaDongHangDb([String(row.id)]);
  return true;
}

// ── Phiếu xuất kho thành phẩm (migration 042) ─────────────────────────────────

const PK = BIEN_THE_SO_CHE.bang.phieuKho;

interface DbPhieuXuatRow {
  id: number;
  so_phieu: string;
  ngay: string;
  trang_thai: TrangThaiPhieuKho;
  kho_id: number;
  ten_kho: string | null;
  trang_thai_sua: 'cho_cap' | 'da_cap' | null;
  id_nguoi_xin_sua: number | null;
  dong: { id_hang_hoa: number; ten_hang_hoa: string | null; so_luong: string | number }[] | null;
}

/** Phiếu xuất còn hiệu lực (≠ Không duyệt) gắn với xe — kèm dòng để so lệch với cây hàng. */
export async function getPhieuXuatCuaXeDb(idDknh: string): Promise<PhieuXuatCuaXe | null> {
  const { data, error } = await db
    .from(PK)
    .select(
      `id,so_phieu,ngay,trang_thai,kho_id,ten_kho,trang_thai_sua,id_nguoi_xin_sua,` +
        `dong:${BIEN_THE_SO_CHE.bang.phieuKhoChiTiet}(id_hang_hoa,ten_hang_hoa,so_luong)`
    )
    .eq('id_dang_ky_nhan_hang', toIntId(idDknh))
    .neq('trang_thai', 'Không duyệt')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throwDbError(error);
  if (!data) return null;
  const r = data as unknown as DbPhieuXuatRow;
  return {
    id: String(r.id),
    so_phieu: r.so_phieu,
    ngay: r.ngay,
    trang_thai: r.trang_thai,
    kho_id: String(r.kho_id),
    ten_kho: r.ten_kho,
    trang_thai_sua: r.trang_thai_sua,
    id_nguoi_xin_sua: idStr(r.id_nguoi_xin_sua),
    dong: (r.dong ?? []).map((d) => ({ id_hang_hoa: String(d.id_hang_hoa), ten_hang_hoa: d.ten_hang_hoa, so_luong: num(d.so_luong) })),
  };
}

/** Tạo phiếu xuất từ cây hàng trên xe, hoặc ghi lại dòng nếu xe đã có phiếu (rpc_dknh_tao_phieu_xuat). Trả id phiếu kho. */
export async function taoPhieuXuatDb(idDknh: string, khoId: string): Promise<string> {
  const { data, error } = await db.rpc('rpc_dknh_tao_phieu_xuat', {
    p_id_dknh: toIntId(idDknh),
    p_kho_id: toIntId(khoId),
  });
  if (error) throwDbError(error);
  return String(data);
}

export interface XeCuaPhieuKho {
  id: string;
  ngay_dang_ky: string;
  so_xe: string | null;
  so_cont: string | null;
  khach_hang: string | null;
}

/** Ngược lại: phiếu kho Sơ chế sinh từ xe nào (chi tiết phiếu kho hiện "Nguồn"). */
export async function getXeCuaPhieuKhoDb(idPhieuKho: string): Promise<XeCuaPhieuKho | null> {
  const { data, error } = await db
    .from(PK)
    .select('xe:fp_farm_dang_ky_nhan_hang(id,ngay_dang_ky,so_xe,so_cont,khach_hang)')
    .eq('id', toIntId(idPhieuKho))
    .not('id_dang_ky_nhan_hang', 'is', null)
    .maybeSingle();
  if (error) throwDbError(error);
  const xe = (data as { xe: (Omit<XeCuaPhieuKho, 'id'> & { id: number }) | null } | null)?.xe;
  return xe ? { ...xe, id: String(xe.id) } : null;
}
