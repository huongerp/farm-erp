/**
 * Phiếu checklist công đoạn — DB: fp_farm_cl_phieu, fp_farm_cl_phieu_dong, fp_farm_cl_phieu_lich_su
 * (migration 073). Đổi trạng thái CHỈ qua RPC rpc_cl_chuyen / rpc_cl_nhan / rpc_cl_tra_lai /
 * rpc_cl_huy / rpc_cl_mo_lai — trigger DB chặn `.update({ trang_thai })`.
 */
import { db, fetchAllRows, fetchTablePage, throwDbError, type PaginatedTableResult } from '../../../../lib/db';
import { applyPostgrestSearch } from '../../../../lib/postgrest-search';
import i18n from '../../../../lib/i18n';
import type { DongPhieuChecklist, KetLuanVanHanh, KetQuaCl, LichSuPhieuChecklist, TrangThaiCl } from '../core/types';
import type { PhieuChecklistListItem } from '../core/list-types';
import type { TaoPhieuFormValues } from '../core/schema';
import { CL_BG_SORT_MAC_DINH, CL_BG_SORTABLE_DB_COLUMNS, type ChecklistBanGiaoListServerQuery } from './checklist-ban-giao-list-query';

const TABLE = 'fp_farm_cl_phieu';
const TABLE_DONG = 'fp_farm_cl_phieu_dong';
const TABLE_LS = 'fp_farm_cl_phieu_lich_su';
const TABLE_MAU = 'fp_farm_cl_mau';

const PHIEU_COLUMNS =
  'id,so_phieu,id_mau,ten_mau,ma_mau,ten_ben_thuc_hien,ten_ben_kiem_tra,chuc_vu_thuc_hien_ids,chuc_vu_kiem_tra_ids,' +
  'co_ket_luan_van_hanh,ngay,ca,khu_vuc,day_chuyen,id_chi_nhanh,ghi_chu,trang_thai,so_lan_tra_lai,ly_do_tra_lai,' +
  'id_nguoi_chuyen,tg_chuyen,id_nguoi_nhan,tg_nhan,ket_luan,y_kien,id_nguoi_tao,tg_tao,tg_cap_nhat';

const DONG_COLUMNS =
  'id,id_phieu,id_hang_muc,ten_muc,thu_tu_muc,stt,doi_tuong,tieu_chuan,phuong_phap,quan_trong,ma_ts,so_luong,' +
  'tan_suat_bao_duong,kq_thuc_hien,tinh_trang_khac_phuc,nguoi_xu_ly,ghi_chu,kq_kiem_tra,ghi_chu_kiem_tra,qlx_tung_khong_dat,gs_tung_khong_dat';

const LS_COLUMNS = 'id,id_phieu,hanh_dong,tu_trang_thai,den_trang_thai,ly_do,id_nguoi,ten_nguoi,tg';

interface DbPhieuRow {
  id: number;
  so_phieu: string | null;
  id_mau: number;
  ten_mau: string | null;
  ma_mau: string | null;
  ten_ben_thuc_hien: string | null;
  ten_ben_kiem_tra: string | null;
  chuc_vu_thuc_hien_ids: unknown;
  chuc_vu_kiem_tra_ids: unknown;
  co_ket_luan_van_hanh: boolean | null;
  ngay: string;
  ca: string | null;
  khu_vuc: string | null;
  day_chuyen: string | null;
  id_chi_nhanh: number | null;
  ghi_chu: string | null;
  trang_thai: TrangThaiCl;
  so_lan_tra_lai: number;
  ly_do_tra_lai: string | null;
  id_nguoi_chuyen: number | null;
  tg_chuyen: string | null;
  id_nguoi_nhan: number | null;
  tg_nhan: string | null;
  ket_luan: KetLuanVanHanh | null;
  y_kien: string | null;
  id_nguoi_tao: number | null;
  tg_tao: string;
  tg_cap_nhat: string;
  dong?: { kq_thuc_hien: KetQuaCl | null }[] | null;
}

interface DbDongRow {
  id: number;
  id_phieu: number;
  id_hang_muc: number | null;
  ten_muc: string | null;
  thu_tu_muc: number;
  stt: number;
  doi_tuong: string;
  tieu_chuan: string | null;
  phuong_phap: string | null;
  quan_trong: boolean;
  ma_ts: string | null;
  so_luong: string | null;
  tan_suat_bao_duong: string | null;
  kq_thuc_hien: KetQuaCl | null;
  tinh_trang_khac_phuc: string | null;
  nguoi_xu_ly: string | null;
  ghi_chu: string | null;
  kq_kiem_tra: KetQuaCl | null;
  ghi_chu_kiem_tra: string | null;
  qlx_tung_khong_dat: boolean | null;
  gs_tung_khong_dat: boolean | null;
}

interface DbLichSuRow {
  id: number;
  id_phieu: number;
  hanh_dong: string;
  tu_trang_thai: TrangThaiCl | null;
  den_trang_thai: TrangThaiCl | null;
  ly_do: string | null;
  id_nguoi: number | null;
  ten_nguoi: string | null;
  tg: string;
}

const idStr = (v: number | null | undefined) => (v != null ? String(v) : null);
const idArr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);

function toIntId(id: string): number {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error('Invalid id');
  return n;
}

const nums = (ids: string[]) => ids.map(Number).filter(Number.isFinite);

const blank = (v: string | null | undefined) => {
  const s = (v ?? '').trim();
  return s === '' ? null : s;
};

function rowToModel(row: DbPhieuRow): PhieuChecklistListItem {
  const dong = row.dong ?? [];
  return {
    id: String(row.id),
    so_phieu: row.so_phieu ?? `CL-${row.id}`,
    id_mau: String(row.id_mau),
    ten_mau: row.ten_mau ?? '',
    ma_mau: row.ma_mau,
    ten_ben_thuc_hien: row.ten_ben_thuc_hien ?? '',
    ten_ben_kiem_tra: row.ten_ben_kiem_tra ?? '',
    chuc_vu_thuc_hien_ids: idArr(row.chuc_vu_thuc_hien_ids),
    chuc_vu_kiem_tra_ids: idArr(row.chuc_vu_kiem_tra_ids),
    co_ket_luan_van_hanh: row.co_ket_luan_van_hanh ?? false,
    ngay: row.ngay,
    ca: row.ca,
    khu_vuc: row.khu_vuc,
    day_chuyen: row.day_chuyen,
    id_chi_nhanh: idStr(row.id_chi_nhanh),
    ghi_chu: row.ghi_chu,
    trang_thai: row.trang_thai,
    so_lan_tra_lai: row.so_lan_tra_lai,
    ly_do_tra_lai: row.ly_do_tra_lai,
    id_nguoi_chuyen: idStr(row.id_nguoi_chuyen),
    tg_chuyen: row.tg_chuyen,
    id_nguoi_nhan: idStr(row.id_nguoi_nhan),
    tg_nhan: row.tg_nhan,
    ket_luan: row.ket_luan,
    y_kien: row.y_kien,
    id_nguoi_tao: idStr(row.id_nguoi_tao),
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
    ten_nguoi_tao: null,
    ten_nguoi_nhan: null,
    kqThucHien: {
      dat: dong.filter((d) => d.kq_thuc_hien === 'dat').length,
      khongDat: dong.filter((d) => d.kq_thuc_hien === 'khong_dat').length,
    },
  };
}

function dongToModel(row: DbDongRow): DongPhieuChecklist {
  return {
    id: String(row.id),
    id_phieu: String(row.id_phieu),
    id_hang_muc: idStr(row.id_hang_muc),
    ten_muc: row.ten_muc,
    thu_tu_muc: row.thu_tu_muc,
    stt: row.stt,
    doi_tuong: row.doi_tuong,
    tieu_chuan: row.tieu_chuan,
    phuong_phap: row.phuong_phap,
    quan_trong: row.quan_trong,
    ma_ts: row.ma_ts,
    so_luong: row.so_luong,
    tan_suat_bao_duong: row.tan_suat_bao_duong,
    kq_thuc_hien: row.kq_thuc_hien,
    tinh_trang_khac_phuc: row.tinh_trang_khac_phuc,
    nguoi_xu_ly: row.nguoi_xu_ly,
    ghi_chu: row.ghi_chu,
    kq_kiem_tra: row.kq_kiem_tra,
    ghi_chu_kiem_tra: row.ghi_chu_kiem_tra,
    qlx_tung_khong_dat: row.qlx_tung_khong_dat === true,
    gs_tung_khong_dat: row.gs_tung_khong_dat === true,
  };
}

function lsToModel(row: DbLichSuRow): LichSuPhieuChecklist {
  return {
    id: String(row.id),
    id_phieu: String(row.id_phieu),
    hanh_dong: row.hanh_dong as LichSuPhieuChecklist['hanh_dong'],
    tu_trang_thai: row.tu_trang_thai,
    den_trang_thai: row.den_trang_thai,
    ly_do: row.ly_do,
    id_nguoi: idStr(row.id_nguoi),
    ten_nguoi: row.ten_nguoi,
    tg: row.tg,
  };
}

/** Cột tham gia ô tìm kiếm ở server. */
const CL_BG_SEARCH_SPEC = {
  text: ['so_phieu', 'ca', 'khu_vuc', 'day_chuyen', 'ghi_chu', 'ten_mau', 'ma_mau'],
  numeric: ['id', 'so_lan_tra_lai'],
  dates: ['ngay'],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyListQuery(q: any, query: ChecklistBanGiaoListServerQuery): any {
  let sel = q;
  if (query.trangThai.length > 0) sel = sel.in('trang_thai', query.trangThai);
  if (query.idMau.length > 0) sel = sel.in('id_mau', nums(query.idMau));
  if (query.ngayFrom) sel = sel.gte('ngay', query.ngayFrom);
  if (query.ngayTo) sel = sel.lte('ngay', query.ngayTo);
  if (query.chiChoToiKiemTra && query.chucVuId) {
    sel = sel.contains('chuc_vu_kiem_tra_ids', [query.chucVuId]);
  }

  sel = applyPostgrestSearch(sel, query.searchTerm, CL_BG_SEARCH_SPEC);

  const dbSortable = query.sortColumn != null && CL_BG_SORTABLE_DB_COLUMNS.has(query.sortColumn);
  const sortCol = dbSortable ? query.sortColumn! : CL_BG_SORT_MAC_DINH.column;
  const ascending = dbSortable ? query.sortDirection !== 'desc' : CL_BG_SORT_MAC_DINH.ascending;
  return sel.order(sortCol, { ascending, nullsFirst: false }).order('id', { ascending: false });
}

const LIST_SELECT = `${PHIEU_COLUMNS},dong:${TABLE_DONG}(kq_thuc_hien)`;

export async function getPhieuPageDb(query: ChecklistBanGiaoListServerQuery): Promise<PaginatedTableResult<PhieuChecklistListItem>> {
  const result = await fetchTablePage<DbPhieuRow>(query.page, query.pageSize, async (from, to) => {
    const res = await applyListQuery(db.from(TABLE).select(LIST_SELECT, { count: 'exact' }), query).range(from, to);
    return { data: (res.data as DbPhieuRow[] | null) ?? null, error: res.error, count: res.count };
  });
  return { ...result, data: result.data.map(rowToModel) };
}

/** Toàn bộ phiếu theo bộ lọc (bấm Xuất file) — tên người chưa enrich. */
export async function fetchAllPhieuForListQueryDb(query: ChecklistBanGiaoListServerQuery): Promise<PhieuChecklistListItem[]> {
  const rows = await fetchAllRows<DbPhieuRow>((from, to) =>
    applyListQuery(db.from(TABLE).select(LIST_SELECT), query).range(from, to)
  );
  return rows.map(rowToModel);
}

export interface PhieuTomTatRow {
  id: number;
  id_mau: number;
  trang_thai: TrangThaiCl;
  so_lan_tra_lai: number;
}

/** Vài cột của toàn bộ phiếu — chip lọc mẫu / trạng thái (đếm trên toàn bộ). */
export async function getPhieuTomTatDb(): Promise<PhieuTomTatRow[]> {
  return fetchAllRows<PhieuTomTatRow>((from, to) =>
    db.from(TABLE).select('id,id_mau,trang_thai,so_lan_tra_lai').range(from, to)
  );
}

export async function getPhieuByIdDb(id: string): Promise<PhieuChecklistListItem | null> {
  const { data, error } = await db.from(TABLE).select(LIST_SELECT).eq('id', toIntId(id)).maybeSingle();
  if (error) throwDbError(error);
  return data ? rowToModel(data as unknown as DbPhieuRow) : null;
}

export async function getDongByPhieuDb(idPhieu: string): Promise<DongPhieuChecklist[]> {
  const { data, error } = await db
    .from(TABLE_DONG)
    .select(DONG_COLUMNS)
    .eq('id_phieu', toIntId(idPhieu))
    .order('thu_tu_muc', { ascending: true })
    .order('stt', { ascending: true });
  if (error) throwDbError(error);
  return ((data as unknown as DbDongRow[] | null) ?? []).map(dongToModel);
}

export async function getLichSuByPhieuDb(idPhieu: string): Promise<LichSuPhieuChecklist[]> {
  const { data, error } = await db
    .from(TABLE_LS)
    .select(LS_COLUMNS)
    .eq('id_phieu', toIntId(idPhieu))
    .order('tg', { ascending: true })
    .order('id', { ascending: true });
  if (error) throwDbError(error);
  return ((data as unknown as DbLichSuRow[] | null) ?? []).map(lsToModel);
}

// ── Tạo / sửa phiếu ────────────────────────────────────────────────────────────

function taoPhieuPayload(v: TaoPhieuFormValues): Record<string, unknown> {
  return {
    id_mau: toIntId(v.id_mau),
    ngay: v.ngay,
    ca: blank(v.ca),
    khu_vuc: blank(v.khu_vuc),
    day_chuyen: blank(v.day_chuyen),
    id_chi_nhanh: v.id_chi_nhanh ? toIntId(v.id_chi_nhanh) : null,
    ghi_chu: blank(v.ghi_chu),
  };
}

/** Trigger tự điền ảnh chụp mẫu + số phiếu + sinh dòng từ hạng mục. */
export async function createPhieuDb(values: TaoPhieuFormValues): Promise<PhieuChecklistListItem> {
  const { data, error } = await db.from(TABLE).insert(taoPhieuPayload(values)).select('id').single();
  if (error) throwDbError(error);
  const row = await getPhieuByIdDb(String((data as { id: number }).id));
  if (!row) throw new Error(i18n.t('checklistBanGiao.service.notFound'));
  return row;
}

export interface PhieuThongTinInput {
  ngay: string;
  ca: string | null;
  khu_vuc: string | null;
  day_chuyen: string | null;
  id_chi_nhanh: string | null;
  ghi_chu: string | null;
}

export async function updatePhieuThongTinDb(id: string, v: PhieuThongTinInput): Promise<void> {
  const { error } = await db
    .from(TABLE)
    .update({
      ngay: v.ngay,
      ca: blank(v.ca),
      khu_vuc: blank(v.khu_vuc),
      day_chuyen: blank(v.day_chuyen),
      id_chi_nhanh: v.id_chi_nhanh ? toIntId(v.id_chi_nhanh) : null,
      ghi_chu: blank(v.ghi_chu),
    })
    .eq('id', toIntId(id));
  if (error) throwDbError(error);
}

export interface PhieuKetLuanInput {
  ket_luan: KetLuanVanHanh | null;
  y_kien: string | null;
}

export async function updatePhieuKetLuanDb(id: string, v: PhieuKetLuanInput): Promise<void> {
  const { error } = await db
    .from(TABLE)
    .update({ ket_luan: v.ket_luan, y_kien: blank(v.y_kien) })
    .eq('id', toIntId(id));
  if (error) throwDbError(error);
}

export async function deletePhieuDb(id: string): Promise<void> {
  const { error } = await db.from(TABLE).delete().eq('id', toIntId(id));
  if (error) throwDbError(error);
}

// ── Kết quả dòng ────────────────────────────────────────────────────────────────

export interface LuuDongThucHienInput {
  idDong: string;
  idPhieu: string;
  kq_thuc_hien: KetQuaCl | null;
  tinh_trang_khac_phuc: string | null;
  nguoi_xu_ly: string | null;
  ghi_chu: string | null;
}

/** Tích cột khâu làm (khâu trước) — trigger khoá dòng kiểm quyền / trạng thái. */
export async function updateDongThucHienDb(v: LuuDongThucHienInput): Promise<void> {
  const { error } = await db
    .from(TABLE_DONG)
    .update({
      kq_thuc_hien: v.kq_thuc_hien,
      tinh_trang_khac_phuc: blank(v.tinh_trang_khac_phuc),
      nguoi_xu_ly: blank(v.nguoi_xu_ly),
      ghi_chu: blank(v.ghi_chu),
    })
    .eq('id', toIntId(v.idDong))
    .eq('id_phieu', toIntId(v.idPhieu));
  if (error) throwDbError(error);
}

export interface LuuDongKiemTraInput {
  idDong: string;
  idPhieu: string;
  kq_kiem_tra: KetQuaCl | null;
  ghi_chu_kiem_tra: string | null;
}

/** Tích cột kiểm tra lại (khâu sau). */
export async function updateDongKiemTraDb(v: LuuDongKiemTraInput): Promise<void> {
  const { error } = await db
    .from(TABLE_DONG)
    .update({ kq_kiem_tra: v.kq_kiem_tra, ghi_chu_kiem_tra: blank(v.ghi_chu_kiem_tra) })
    .eq('id', toIntId(v.idDong))
    .eq('id_phieu', toIntId(v.idPhieu));
  if (error) throwDbError(error);
}

// ── RPC đổi trạng thái ──────────────────────────────────────────────────────────

async function rpcDoiTrangThai(name: string, args: Record<string, unknown>): Promise<void> {
  const { error } = await db.rpc(name, args);
  if (error) throwDbError(error);
}

export async function chuyenPhieuDb(id: string): Promise<void> {
  await rpcDoiTrangThai('rpc_cl_chuyen', { p_id: toIntId(id) });
}

export async function nhanPhieuDb(id: string): Promise<void> {
  await rpcDoiTrangThai('rpc_cl_nhan', { p_id: toIntId(id) });
}

export async function traLaiPhieuDb(id: string, lyDo: string): Promise<void> {
  await rpcDoiTrangThai('rpc_cl_tra_lai', { p_id: toIntId(id), p_ly_do: lyDo.trim() });
}

export async function huyPhieuDb(id: string, lyDo?: string): Promise<void> {
  await rpcDoiTrangThai('rpc_cl_huy', { p_id: toIntId(id), p_ly_do: (lyDo ?? '').trim() });
}

export async function moLaiPhieuDb(id: string, lyDo: string): Promise<void> {
  await rpcDoiTrangThai('rpc_cl_mo_lai', { p_id: toIntId(id), p_ly_do: lyDo.trim() });
}

// ── Mẫu cho chọn (chỉ đọc) ─────────────────────────────────────────────────────

export interface MauChoChon {
  id: string;
  ma: string | null;
  ten: string;
  co_khau_sau: boolean;
}

/** Mẫu đang dùng để tạo phiếu (loai ban_giao). */
export async function getMauChoChonDb(): Promise<MauChoChon[]> {
  const { data, error } = await db
    .from(TABLE_MAU)
    .select('id,ma,ten,chuc_vu_kiem_tra_ids')
    .eq('dang_dung', true)
    .eq('loai', 'ban_giao')
    .order('thu_tu', { ascending: true })
    .order('id', { ascending: true });
  if (error) throwDbError(error);
  type Row = { id: number; ma: string | null; ten: string; chuc_vu_kiem_tra_ids: unknown };
  return ((data as Row[] | null) ?? []).map((r) => ({
    id: String(r.id),
    ma: r.ma,
    ten: r.ten,
    co_khau_sau: idArr(r.chuc_vu_kiem_tra_ids).length > 0,
  }));
}
