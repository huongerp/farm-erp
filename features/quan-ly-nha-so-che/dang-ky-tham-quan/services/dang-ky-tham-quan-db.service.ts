/**
 * Đăng ký tham quan farm — DB: fp_farm_dang_ky_tham_quan (phiếu) + fp_farm_dang_ky_tham_quan_khach
 * (khách, embed cùng request). Tạo / sửa qua RPC `rpc_luu_dang_ky_tham_quan` (phiếu + khách một
 * transaction); đổi trạng thái có điều kiện `trang_thai = từ` chống hai người bấm cùng lúc.
 */
import { db, fetchAllRows, fetchTablePage, throwDbError, type PaginatedTableResult } from '../../../../lib/db';
import { applyPostgrestSearch, buildPostgrestSearchOr, dieuKienKyTheoNgay } from '../../../../lib/postgrest-search';
import i18n from '../../../../lib/i18n';
import { fromDateTimeLocalValue } from '../../dang-ky-nhan-hang/core/thoi-gian';
import type { DangKyThamQuan, KhachThamQuan, MucDichThamQuan, PhuongTien, TrangThaiDkTq } from '../core/types';
import type { DangKyThamQuanFormValues } from '../core/schema';
import { chuanHoaDanhSachKhach, nguoiDaiDienMacDinh } from '../core/khach';
import {
  DKTQ_SORTABLE_DB_COLUMNS,
  DKTQ_SORT_MAC_DINH,
  type DangKyThamQuanListServerQuery,
} from './dang-ky-tham-quan-list-query';

const TABLE = 'fp_farm_dang_ky_tham_quan';
const TABLE_KHACH = 'fp_farm_dang_ky_tham_quan_khach';

const KHACH_COLUMNS = 'stt,ho_ten,gioi_tinh,quoc_tich,so_dien_thoai,nguoi_gioi_thieu,khu_vuc_tham_quan,don_vi_lam_viec';
const ROW_COLUMNS =
  'id,id_chi_nhanh,ngay_dang_ky,tg_bat_dau,tg_ket_thuc,muc_dich,muc_dich_khac,phuong_tien,nguoi_dai_dien,' +
  'id_nguoi_tiep_don,tg_vao_thuc_te,tg_ra_thuc_te,id_nguoi_check_in,id_nguoi_check_out,trang_thai,ghi_chu,' +
  `hinh_anh_urls,id_nguoi_tao,tg_tao,tg_cap_nhat,chi_nhanh:fp_var_chi_nhanh(ten_chi_nhanh),khach:${TABLE_KHACH}(${KHACH_COLUMNS})`;

interface DbRow {
  id: number;
  id_chi_nhanh: number;
  ngay_dang_ky: string;
  tg_bat_dau: string;
  tg_ket_thuc: string | null;
  muc_dich: MucDichThamQuan[] | null;
  muc_dich_khac: string | null;
  phuong_tien: PhuongTien | null;
  nguoi_dai_dien: string | null;
  id_nguoi_tiep_don: number | null;
  tg_vao_thuc_te: string | null;
  tg_ra_thuc_te: string | null;
  id_nguoi_check_in: number | null;
  id_nguoi_check_out: number | null;
  trang_thai: TrangThaiDkTq;
  ghi_chu: string | null;
  hinh_anh_urls: string[] | null;
  id_nguoi_tao: number | null;
  tg_tao: string;
  tg_cap_nhat: string;
  chi_nhanh?: { ten_chi_nhanh: string | null } | null;
  khach?: KhachThamQuan[] | null;
}

const idStr = (v: number | null | undefined) => (v != null ? String(v) : null);

function toIntId(id: string): number {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error('Invalid id');
  return n;
}

function rowToModel(row: DbRow): DangKyThamQuan {
  return {
    id: String(row.id),
    id_chi_nhanh: String(row.id_chi_nhanh),
    ten_chi_nhanh: row.chi_nhanh?.ten_chi_nhanh ?? null,
    ngay_dang_ky: row.ngay_dang_ky,
    tg_bat_dau: row.tg_bat_dau,
    tg_ket_thuc: row.tg_ket_thuc,
    muc_dich: row.muc_dich ?? [],
    muc_dich_khac: row.muc_dich_khac,
    phuong_tien: row.phuong_tien,
    nguoi_dai_dien: row.nguoi_dai_dien,
    id_nguoi_tiep_don: idStr(row.id_nguoi_tiep_don),
    ten_nguoi_tiep_don: null,
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
    khach: [...(row.khach ?? [])].sort((a, b) => a.stt - b.stt),
  };
}

const blank = (v: string | null | undefined) => {
  const s = (v ?? '').trim();
  return s === '' ? null : s;
};

/** Giá trị form → tham số RPC. */
export function formSangRpc(v: DangKyThamQuanFormValues): { p_phieu: Record<string, unknown>; p_khach: KhachThamQuan[] } {
  const khach = chuanHoaDanhSachKhach(v.khach);
  return {
    p_phieu: {
      id_chi_nhanh: toIntId(v.id_chi_nhanh),
      ngay_dang_ky: v.ngay_dang_ky,
      tg_bat_dau: fromDateTimeLocalValue(v.bat_dau),
      tg_ket_thuc: v.ket_thuc ? fromDateTimeLocalValue(v.ket_thuc) : null,
      muc_dich: v.muc_dich,
      muc_dich_khac: v.muc_dich.includes('khac') ? blank(v.muc_dich_khac) : null,
      phuong_tien: v.phuong_tien || null,
      nguoi_dai_dien: nguoiDaiDienMacDinh(khach, v.nguoi_dai_dien),
      id_nguoi_tiep_don: v.id_nguoi_tiep_don ? toIntId(v.id_nguoi_tiep_don) : null,
      ghi_chu: blank(v.ghi_chu),
      hinh_anh_urls: v.hinh_anh_urls ?? [],
    },
    p_khach: khach,
  };
}

/** Cột tham gia ô tìm kiếm ở server (bảng phiếu); khách tra riêng rồi gộp id. */
const DKTQ_SEARCH_SPEC = {
  text: ['nguoi_dai_dien', 'muc_dich_khac', 'ghi_chu'],
  numeric: ['id'],
  dates: ['ngay_dang_ky'],
};

/** id phiếu có khách khớp từ khoá (họ tên, SĐT, đơn vị, quốc tịch, người giới thiệu). */
async function idPhieuTheoKhach(tuKhoa: string): Promise<number[]> {
  const s = tuKhoa.trim();
  if (!s) return [];
  let q = db.from(TABLE_KHACH).select('id_phieu');
  q = applyPostgrestSearch(q, s, {
    text: ['ho_ten', 'so_dien_thoai', 'don_vi_lam_viec', 'quoc_tich', 'nguoi_gioi_thieu', 'khu_vuc_tham_quan'],
  });
  const { data, error } = await q.limit(500);
  if (error) throwDbError(error);
  return [...new Set(((data as { id_phieu: number }[] | null) ?? []).map((r) => r.id_phieu))];
}

/** Lọc + sắp xếp dùng chung cho trang danh sách và xuất file. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyDkTqListQuery(q: any, query: DangKyThamQuanListServerQuery, idTheoKhach: number[]): any {
  let sel = q;
  if (!query.viewAll) {
    const ids = query.allowedBranchIds.map(Number).filter(Number.isFinite);
    sel = ids.length === 0 ? sel.eq('id', -1) : sel.in('id_chi_nhanh', ids);
  }
  if (query.idChiNhanh.length > 0) {
    sel = sel.in('id_chi_nhanh', query.idChiNhanh.map(Number).filter(Number.isFinite));
  }
  if (query.trangThai.length > 0) sel = sel.in('trang_thai', query.trangThai);
  if (query.mucDich.length > 0) sel = sel.overlaps('muc_dich', query.mucDich);
  const ky = dieuKienKyTheoNgay(query.nam, query.thang, 'ngay_dang_ky');
  if (ky.length) sel = sel.or(ky.join(','));

  // Khớp cột phiếu HOẶC có khách khớp: ghép `id.in.(…)` vào cùng nhóm or của ô tìm kiếm.
  const dk = buildPostgrestSearchOr(query.searchTerm, DKTQ_SEARCH_SPEC);
  if (dk.length > 0) {
    if (idTheoKhach.length > 0) dk.push(`id.in.(${idTheoKhach.join(',')})`);
    sel = sel.or(dk.join(','));
  }

  const dbSortable = query.sortColumn != null && DKTQ_SORTABLE_DB_COLUMNS.has(query.sortColumn);
  const sortCol = dbSortable ? query.sortColumn! : DKTQ_SORT_MAC_DINH.column;
  const ascending = dbSortable ? query.sortDirection !== 'desc' : DKTQ_SORT_MAC_DINH.ascending;
  return sel.order(sortCol, { ascending, nullsFirst: false }).order('id', { ascending: false });
}

export async function getDkTqPageDb(query: DangKyThamQuanListServerQuery): Promise<PaginatedTableResult<DangKyThamQuan>> {
  const idTheoKhach = await idPhieuTheoKhach(query.searchTerm);
  const result = await fetchTablePage<DbRow>(query.page, query.pageSize, async (from, to) => {
    const res = await applyDkTqListQuery(db.from(TABLE).select(ROW_COLUMNS, { count: 'exact' }), query, idTheoKhach).range(
      from,
      to
    );
    return { data: (res.data as DbRow[] | null) ?? null, error: res.error, count: res.count };
  });
  return { ...result, data: result.data.map(rowToModel) };
}

/** Toàn bộ phiếu khớp bộ lọc — chỉ khi Xuất file. */
export async function fetchAllDkTqForListQuery(query: DangKyThamQuanListServerQuery): Promise<DangKyThamQuan[]> {
  const idTheoKhach = await idPhieuTheoKhach(query.searchTerm);
  const rows = await fetchAllRows<DbRow>((from, to) =>
    applyDkTqListQuery(db.from(TABLE).select(ROW_COLUMNS), query, idTheoKhach).range(from, to)
  );
  return rows.map(rowToModel);
}

export interface DkTqTomTatRow {
  id: number;
  ngay_dang_ky: string;
  id_chi_nhanh: number | null;
  trang_thai: TrangThaiDkTq;
  muc_dich: MucDichThamQuan[] | null;
  id_nguoi_tao: number | null;
  tg_tao: string | null;
}

/** Vài cột của toàn bộ phiếu — chip lọc (đếm trên toàn bộ), chi nhánh gợi ý khi thêm. */
export async function getDkTqTomTatDb(viewAll: boolean, allowedBranchIds: string[]): Promise<DkTqTomTatRow[]> {
  return fetchAllRows<DkTqTomTatRow>((from, to) => {
    let sel = db.from(TABLE).select('id,ngay_dang_ky,id_chi_nhanh,trang_thai,muc_dich,id_nguoi_tao,tg_tao');
    if (!viewAll) {
      const ids = allowedBranchIds.map(Number).filter(Number.isFinite);
      sel = ids.length === 0 ? sel.eq('id', -1) : sel.in('id_chi_nhanh', ids);
    }
    return sel.order('ngay_dang_ky', { ascending: false }).order('id', { ascending: false }).range(from, to);
  });
}

/** Giá trị đã nhập ở bảng khách (quốc tịch, khu vực, đơn vị, người giới thiệu) — gợi ý ô nhập. */
export async function getGoiYKhachDb(): Promise<Pick<KhachThamQuan, 'quoc_tich' | 'khu_vuc_tham_quan' | 'don_vi_lam_viec' | 'nguoi_gioi_thieu'>[]> {
  return fetchAllRows((from, to) =>
    db
      .from(TABLE_KHACH)
      .select('quoc_tich,khu_vuc_tham_quan,don_vi_lam_viec,nguoi_gioi_thieu')
      .order('id', { ascending: false })
      .range(from, to)
  );
}

export async function getDkTqByIdDb(id: string): Promise<DangKyThamQuan | null> {
  const { data, error } = await db.from(TABLE).select(ROW_COLUMNS).eq('id', toIntId(id)).maybeSingle();
  if (error) throwDbError(error);
  return data ? rowToModel(data as unknown as DbRow) : null;
}

/** Tạo (id = null) hoặc sửa phiếu + thay toàn bộ khách — một transaction ở DB. */
export async function luuDkTqDb(id: string | null, values: DangKyThamQuanFormValues): Promise<string> {
  const { p_phieu, p_khach } = formSangRpc(values);
  const { data, error } = await db.rpc('rpc_luu_dang_ky_tham_quan', {
    p_id: id ? toIntId(id) : null,
    p_phieu,
    p_khach,
  });
  if (error) throwDbError(error);
  return String(data);
}

export async function deleteDkTqDb(id: string): Promise<void> {
  const { error } = await db.from(TABLE).delete().eq('id', toIntId(id));
  if (error) throwDbError(error);
}

export async function deleteDkTqManyDb(ids: string[]): Promise<void> {
  const nums = ids.map(Number).filter(Number.isFinite);
  if (nums.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', nums);
  if (error) throwDbError(error);
}

async function chuyenTrangThai(id: string, tuTrangThai: TrangThaiDkTq, patch: Record<string, unknown>): Promise<void> {
  const { data, error } = await db
    .from(TABLE)
    .update(patch)
    .eq('id', toIntId(id))
    .eq('trang_thai', tuTrangThai)
    .select('id');
  if (error) throwDbError(error);
  if (((data as unknown[] | null) ?? []).length === 0) throw new Error(i18n.t('dangKyThamQuan.service.trangThaiDaDoi'));
}

export interface CheckInOutInput {
  id: string;
  /** ISO */
  thoiDiem: string;
  idNguoi: string | null;
}

export const checkInDb = (input: CheckInOutInput) =>
  chuyenTrangThai(input.id, 'cho_vao', {
    trang_thai: 'da_vao',
    tg_vao_thuc_te: input.thoiDiem,
    id_nguoi_check_in: input.idNguoi ? toIntId(input.idNguoi) : null,
  });

export const checkOutDb = (input: CheckInOutInput) =>
  chuyenTrangThai(input.id, 'da_vao', {
    trang_thai: 'da_ra',
    tg_ra_thuc_te: input.thoiDiem,
    id_nguoi_check_out: input.idNguoi ? toIntId(input.idNguoi) : null,
  });

export const hoanTacCheckInDb = (id: string) =>
  chuyenTrangThai(id, 'da_vao', { trang_thai: 'cho_vao', tg_vao_thuc_te: null, id_nguoi_check_in: null });

export const hoanTacCheckOutDb = (id: string) =>
  chuyenTrangThai(id, 'da_ra', { trang_thai: 'da_vao', tg_ra_thuc_te: null, id_nguoi_check_out: null });

export const huyDkTqDb = (id: string) => chuyenTrangThai(id, 'cho_vao', { trang_thai: 'huy' });

export const khoiPhucDkTqDb = (id: string) => chuyenTrangThai(id, 'huy', { trang_thai: 'cho_vao' });

/** Ghi lại toàn bộ danh sách ảnh (dialog Hình ảnh). */
export async function capNhatAnhDb(id: string, urls: string[]): Promise<void> {
  const { error } = await db.from(TABLE).update({ hinh_anh_urls: urls }).eq('id', toIntId(id));
  if (error) throwDbError(error);
}
