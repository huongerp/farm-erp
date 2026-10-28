/**
 * Đánh giá đầu vào — DB: fp_farm_dgdv (+ _cot, _lo, _lo_ngay, _dong). Migration 052.
 * id bigint → String() ngay trong mapper; lỗi PostgREST format qua lib/db-errors.
 */
import { db, fetchAllRows, fetchTablePage, throwDbError, formatDbError, type PaginatedTableResult } from '../../../../lib/db';
import { applyPostgrestSearch } from '../../../../lib/postgrest-search';
import i18n from '../../../../lib/i18n';
import { DGDV_SORTABLE_DB_COLUMNS, DGDV_SORT_MAC_DINH, type DgdvListServerQuery } from './danh-gia-dau-vao-list-query';
import { TRANG_THAI_DGDV } from '../core/types';
import type {
  DgdvLoDayDu,
  DgdvPhieuDayDu,
  FarmDgdv,
  FarmDgdvCot,
  FarmDgdvDong,
  FarmDgdvLoNgay,
  TrangThaiDgdvPhieu,
  TuanIso,
} from '../core/types';
import type { DgdvFormValues } from '../core/schema';
import { gonTen, khoaTen } from '../core/chuan-hoa-ten';

const TABLE = 'fp_farm_dgdv';
const TABLE_COT = 'fp_farm_dgdv_cot';
const TABLE_LO = 'fp_farm_dgdv_lo';
const TABLE_LO_NGAY = 'fp_farm_dgdv_lo_ngay';
const TABLE_DONG = 'fp_farm_dgdv_dong';
const T_DM_LO = 'fp_var_lo_thu_hoach';

const PHIEU_COLUMNS = 'id,nam,tuan,id_chi_nhanh,ghi_chu,trang_thai,id_nguoi_tao,tg_tao,tg_cap_nhat';
const COT_COLUMNS = 'id,id_phieu,stt,chich_bap_tu,chich_bap_den,thu_hoach_tu,thu_hoach_den,id_mau_1,id_mau_2,xe_doi';
const DONG_COLUMNS = 'id,id_phieu_lo,id_cot,ngay,stt_dong,so_luong,danh_gia,so_luong_loi,ly_do_loi';
const LO_NGAY_COLUMNS = 'id,id_phieu_lo,ngay,dut_day';

/** Danh sách: phiếu + tên chi nhánh + số của bảng con (chỉ cột cần cộng) để ra Tổng thu / KSC cả tuần. */
const LIST_SELECT =
  `${PHIEU_COLUMNS},chi_nhanh:fp_var_chi_nhanh(ten_chi_nhanh),` +
  `${TABLE_LO}(${TABLE_DONG}(so_luong,so_luong_loi),${TABLE_LO_NGAY}(dut_day))`;

/** Phiếu đầy đủ: cột dây + lô (tên lô) + đứt dây + ô lưới của cả tuần — MỘT request. */
const FULL_SELECT =
  `${PHIEU_COLUMNS},chi_nhanh:fp_var_chi_nhanh(ten_chi_nhanh),` +
  `${TABLE_COT}(${COT_COLUMNS}),` +
  `${TABLE_LO}(id,id_phieu,id_lo,to_truong,ghi_chu,stt,lo:fp_var_lo_thu_hoach(ten_lo),` +
  `${TABLE_LO_NGAY}(${LO_NGAY_COLUMNS}),${TABLE_DONG}(${DONG_COLUMNS}))`;

type Id = number | string;

interface DbPhieuRow {
  id: Id;
  nam: number;
  tuan: number;
  id_chi_nhanh: Id;
  ghi_chu: string | null;
  trang_thai: string | null;
  id_nguoi_tao: Id | null;
  tg_tao: string;
  tg_cap_nhat: string;
  chi_nhanh?: { ten_chi_nhanh: string | null } | null;
}

interface DbListRow extends DbPhieuRow {
  fp_farm_dgdv_lo?: {
    fp_farm_dgdv_dong?: { so_luong: number | null; so_luong_loi: number | null }[];
    fp_farm_dgdv_lo_ngay?: { dut_day: number | null }[];
  }[];
}

interface DbCotRow {
  id: Id;
  id_phieu: Id;
  stt: number;
  chich_bap_tu: string | null;
  chich_bap_den: string | null;
  thu_hoach_tu: string | null;
  thu_hoach_den: string | null;
  id_mau_1: Id;
  id_mau_2: Id | null;
  xe_doi: boolean | null;
}

interface DbDongRow {
  id: Id;
  id_phieu_lo: Id;
  id_cot: Id;
  ngay: string;
  stt_dong: number;
  so_luong: number | null;
  danh_gia: string | null;
  so_luong_loi: number | null;
  ly_do_loi: string | null;
}

interface DbLoNgayRow {
  id: Id;
  id_phieu_lo: Id;
  ngay: string;
  dut_day: number | null;
}

interface DbLoRow {
  id: Id;
  id_phieu: Id;
  id_lo: Id;
  to_truong: string | null;
  ghi_chu: string | null;
  stt: number;
  lo?: { ten_lo: string | null } | null;
  fp_farm_dgdv_lo_ngay?: DbLoNgayRow[];
  fp_farm_dgdv_dong?: DbDongRow[];
}

interface DbFullRow extends DbPhieuRow {
  fp_farm_dgdv_cot?: DbCotRow[];
  fp_farm_dgdv_lo?: DbLoRow[];
}

/** Dòng danh sách: phiếu + Tổng thu / KSC cả tuần (cộng như fn_dgdv_tong_ngay, gộp 7 ngày). */
export interface DgdvListRow extends FarmDgdv {
  tong_thu_tuan: number;
  ksc_tuan: number;
}

const str = (v: Id | null | undefined): string | null => (v == null || v === '' ? null : String(v));
const so = (v: number | string | null | undefined): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const ymd = (v: string) => (typeof v === 'string' ? v.slice(0, 10) : String(v));
const toInt8 = (id: string | null | undefined): number | null => {
  if (id == null || id === '') return null;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
};
const toInt8s = (ids: string[]) => ids.map(Number).filter(Number.isFinite);

function trangThai(v: string | null | undefined): TrangThaiDgdvPhieu {
  return v === TRANG_THAI_DGDV.KHOA ? TRANG_THAI_DGDV.KHOA : TRANG_THAI_DGDV.MO;
}

function mapPhieu(r: DbPhieuRow): FarmDgdv {
  return {
    id: String(r.id),
    nam: so(r.nam),
    tuan: so(r.tuan),
    id_chi_nhanh: String(r.id_chi_nhanh),
    ten_chi_nhanh: r.chi_nhanh?.ten_chi_nhanh ?? null,
    ghi_chu: r.ghi_chu ?? null,
    trang_thai: trangThai(r.trang_thai),
    id_nguoi_tao: str(r.id_nguoi_tao),
    ten_nguoi_tao: null,
    tg_tao: r.tg_tao,
    tg_cap_nhat: r.tg_cap_nhat,
  };
}

function mapListRow(r: DbListRow): DgdvListRow {
  let tongThu = 0;
  let ksc = 0;
  for (const lo of r.fp_farm_dgdv_lo ?? []) {
    for (const d of lo.fp_farm_dgdv_dong ?? []) {
      tongThu += so(d.so_luong);
      ksc += so(d.so_luong_loi);
    }
    for (const n of lo.fp_farm_dgdv_lo_ngay ?? []) tongThu += so(n.dut_day);
  }
  return { ...mapPhieu(r), tong_thu_tuan: tongThu, ksc_tuan: ksc };
}

export function mapCot(r: DbCotRow): FarmDgdvCot {
  return {
    id: String(r.id),
    id_phieu: String(r.id_phieu),
    stt: so(r.stt),
    chich_bap_tu: r.chich_bap_tu ? ymd(r.chich_bap_tu) : null,
    chich_bap_den: r.chich_bap_den ? ymd(r.chich_bap_den) : null,
    thu_hoach_tu: r.thu_hoach_tu ? ymd(r.thu_hoach_tu) : null,
    thu_hoach_den: r.thu_hoach_den ? ymd(r.thu_hoach_den) : null,
    id_mau_1: String(r.id_mau_1),
    id_mau_2: str(r.id_mau_2),
    xe_doi: !!r.xe_doi,
  };
}

export function mapDong(r: DbDongRow): FarmDgdvDong {
  return {
    id: String(r.id),
    id_phieu_lo: String(r.id_phieu_lo),
    id_cot: String(r.id_cot),
    ngay: ymd(r.ngay),
    stt_dong: so(r.stt_dong),
    so_luong: so(r.so_luong),
    danh_gia: r.danh_gia ?? null,
    so_luong_loi: so(r.so_luong_loi),
    ly_do_loi: r.ly_do_loi ?? null,
  };
}

export function mapLoNgay(r: DbLoNgayRow): FarmDgdvLoNgay {
  return { id: String(r.id), id_phieu_lo: String(r.id_phieu_lo), ngay: ymd(r.ngay), dut_day: so(r.dut_day) };
}

function mapLo(r: DbLoRow): DgdvLoDayDu {
  return {
    id: String(r.id),
    id_phieu: String(r.id_phieu),
    id_lo: String(r.id_lo),
    to_truong: r.to_truong ?? null,
    ghi_chu: r.ghi_chu ?? null,
    stt: so(r.stt),
    ten_lo: r.lo?.ten_lo ?? null,
    lo_ngay: (r.fp_farm_dgdv_lo_ngay ?? []).map(mapLoNgay),
    dong: (r.fp_farm_dgdv_dong ?? []).map(mapDong),
  };
}

function mapFull(r: DbFullRow): DgdvPhieuDayDu {
  return {
    ...mapPhieu(r),
    cot: (r.fp_farm_dgdv_cot ?? []).map(mapCot),
    lo: (r.fp_farm_dgdv_lo ?? []).map(mapLo),
  };
}

// ---- Danh sách -------------------------------------------------------------------

/** Cột tham gia ô tìm kiếm ở server (bảng không có cột tên chi nhánh — lọc chi nhánh bằng chip). */
const DGDV_SEARCH_SPEC = {
  text: ['ghi_chu', 'trang_thai'],
  numeric: ['id', 'nam', 'tuan'],
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function locPhamVi(q: any, viewAll: boolean, allowedBranchIds: string[]): any {
  if (viewAll) return q;
  const ids = toInt8s(allowedBranchIds);
  return ids.length === 0 ? q.eq('id', -1) : q.in('id_chi_nhanh', ids);
}

/** Lọc + sắp xếp dùng chung cho trang danh sách và lượt tải xuất file. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyDgdvListQuery(q: any, query: DgdvListServerQuery): any {
  let sel = locPhamVi(q, query.viewAll, query.allowedBranchIds);
  if (query.idChiNhanh.length > 0) sel = sel.in('id_chi_nhanh', toInt8s(query.idChiNhanh));
  if (query.trangThai.length > 0) sel = sel.in('trang_thai', query.trangThai);
  if (query.nam.length > 0) sel = sel.in('nam', toInt8s(query.nam));
  if (query.tuan.length > 0) sel = sel.in('tuan', toInt8s(query.tuan));

  sel = applyPostgrestSearch(sel, query.searchTerm, DGDV_SEARCH_SPEC);

  const dbSortable = query.sortColumn != null && DGDV_SORTABLE_DB_COLUMNS.has(query.sortColumn);
  const sortCol = dbSortable ? query.sortColumn! : DGDV_SORT_MAC_DINH.column;
  const ascending = dbSortable ? query.sortDirection !== 'desc' : DGDV_SORT_MAC_DINH.ascending;

  if (sortCol === 'nam_tuan') sel = sel.order('nam', { ascending }).order('tuan', { ascending });
  else sel = sel.order(sortCol, { ascending });
  return sel.order('id', { ascending: false });
}

export async function getDgdvPageDb(query: DgdvListServerQuery): Promise<PaginatedTableResult<DgdvListRow>> {
  const result = await fetchTablePage<DbListRow>(query.page, query.pageSize, async (from, to) => {
    const res = await applyDgdvListQuery(db.from(TABLE).select(LIST_SELECT, { count: 'exact' }), query).range(from, to);
    return { data: (res.data as DbListRow[] | null) ?? null, error: res.error, count: res.count };
  });
  return { ...result, data: result.data.map(mapListRow) };
}

/** Toàn bộ phiếu khớp bộ lọc — CHỈ dùng khi bấm Xuất file. */
export async function fetchAllDgdvForListQueryDb(query: DgdvListServerQuery): Promise<DgdvListRow[]> {
  const rows = await fetchAllRows<DbListRow>((from, to) =>
    applyDgdvListQuery(db.from(TABLE).select(LIST_SELECT), query).range(from, to)
  );
  return rows.map(mapListRow);
}

export interface DgdvTomTat {
  id: string;
  nam: number;
  tuan: number;
  id_chi_nhanh: string;
  trang_thai: TrangThaiDgdvPhieu;
  id_nguoi_tao: string | null;
  tg_tao: string;
}

/** Tóm tắt toàn bộ phiếu trong phạm vi — chip lọc + số đếm, gợi ý chi nhánh, chặn trùng tuần. */
export async function getDgdvTomTatDb(viewAll: boolean, allowedBranchIds: string[]): Promise<DgdvTomTat[]> {
  const rows = await fetchAllRows<DbPhieuRow>((from, to) =>
    locPhamVi(db.from(TABLE).select('id,nam,tuan,id_chi_nhanh,trang_thai,id_nguoi_tao,tg_tao'), viewAll, allowedBranchIds)
      .order('nam', { ascending: false })
      .order('tuan', { ascending: false })
      .range(from, to)
  );
  return rows.map((r) => ({
    id: String(r.id),
    nam: so(r.nam),
    tuan: so(r.tuan),
    id_chi_nhanh: String(r.id_chi_nhanh),
    trang_thai: trangThai(r.trang_thai),
    id_nguoi_tao: str(r.id_nguoi_tao),
    tg_tao: r.tg_tao,
  }));
}

// ---- Phiếu đầy đủ ------------------------------------------------------------------

export async function getDgdvByIdDb(id: string): Promise<DgdvPhieuDayDu | null> {
  const numId = toInt8(id);
  if (numId == null) return null;
  const { data, error } = await db.from(TABLE).select(FULL_SELECT).eq('id', numId).maybeSingle();
  if (error) throwDbError(error, { resource: `${TABLE}.byId` });
  return data ? mapFull(data as unknown as DbFullRow) : null;
}

/**
 * Phiếu đầy đủ của các tuần (bảng đánh giá theo khoảng ngày) — một chi nhánh, hoặc mọi chi nhánh
 * trong phạm vi khi `idChiNhanh` rỗng.
 */
export async function getDgdvTheoTuanDb(
  dsTuan: TuanIso[],
  idChiNhanh: string | null,
  viewAll: boolean,
  allowedBranchIds: string[]
): Promise<DgdvPhieuDayDu[]> {
  if (dsTuan.length === 0) return [];
  // Chi nhánh lấy từ URL trang in: ngoài phạm vi xem thì coi như không có phiếu.
  if (idChiNhanh && !viewAll && !allowedBranchIds.map(String).includes(idChiNhanh)) return [];
  let sel = db.from(TABLE).select(FULL_SELECT);
  sel = idChiNhanh ? sel.eq('id_chi_nhanh', toInt8(idChiNhanh) ?? -1) : locPhamVi(sel, viewAll, allowedBranchIds);
  sel = sel.or(dsTuan.map((t) => `and(nam.eq.${t.nam},tuan.eq.${t.tuan})`).join(','));
  const { data, error } = await sel.order('nam').order('tuan').order('id_chi_nhanh');
  if (error) throwDbError(error, { resource: `${TABLE}.theoTuan` });
  return ((data ?? []) as unknown as DbFullRow[]).map(mapFull);
}

// ---- Thêm / sửa phiếu ----------------------------------------------------------------

/** Lỗi rõ ràng khi (năm, tuần, chi nhánh) đã có phiếu khác — DB cũng chặn bằng UNIQUE. */
async function kiemTraTrungTuan(nam: number, tuan: number, idChiNhanh: number, boQuaId: number | null): Promise<void> {
  let sel = db.from(TABLE).select('id').eq('nam', nam).eq('tuan', tuan).eq('id_chi_nhanh', idChiNhanh);
  if (boQuaId != null) sel = sel.neq('id', boQuaId);
  const { data, error } = await sel.limit(1);
  if (error) throwDbError(error, { resource: `${TABLE}.trungTuan` });
  if ((data ?? []).length > 0) throw new Error(i18n.t('danhGiaDauVao.toast.trungTuan', { tuan, nam }));
}

function cotBody(c: DgdvFormValues['cot'][number], idPhieu: number, stt: number) {
  return {
    id_phieu: idPhieu,
    stt,
    chich_bap_tu: c.chich_bap_tu,
    chich_bap_den: c.chich_bap_den,
    thu_hoach_tu: c.thu_hoach_tu,
    thu_hoach_den: c.thu_hoach_den,
    id_mau_1: toInt8(c.id_mau_1),
    id_mau_2: toInt8(c.id_mau_2),
    xe_doi: !!c.xe_doi,
  };
}

type LoCoId = DgdvFormValues['lo'][number] & { id_lo: number };

function loBody(l: LoCoId, idPhieu: number, stt: number) {
  return {
    id_phieu: idPhieu,
    id_lo: l.id_lo,
    to_truong: gonTen(l.to_truong),
    ghi_chu: l.ghi_chu?.trim() || null,
    stt,
  };
}

/**
 * Lô trong form là TÊN (chọn lô có sẵn hoặc gõ mới). Tra tên → id trong danh mục lô của chi nhánh
 * (không phân biệt hoa thường); tên chưa có thì tạo lô mới (tổ trưởng của dòng làm mặc định).
 */
async function ganIdLo(idChiNhanh: number, dsLo: DgdvFormValues['lo']): Promise<LoCoId[]> {
  if (dsLo.length === 0) return [];
  const { data, error } = await db.from(T_DM_LO).select('id,ten_lo').eq('id_chi_nhanh', idChiNhanh);
  if (error) throwDbError(error, { resource: T_DM_LO });
  const idTheoTen = new Map(((data ?? []) as { id: Id; ten_lo: string }[]).map((r) => [khoaTen(r.ten_lo), Number(r.id)]));

  const thieu = new Map<string, { ten_lo: string; id_chi_nhanh: number; to_truong: string | null }>();
  for (const l of dsLo) {
    const k = khoaTen(l.ten_lo);
    if (!idTheoTen.has(k) && !thieu.has(k)) {
      thieu.set(k, { ten_lo: gonTen(l.ten_lo) ?? l.ten_lo, id_chi_nhanh: idChiNhanh, to_truong: gonTen(l.to_truong) });
    }
  }
  if (thieu.size > 0) {
    const { data: moi, error: e2 } = await db.from(T_DM_LO).insert([...thieu.values()]).select('id,ten_lo');
    if (e2) throwDbError(e2, { resource: T_DM_LO });
    for (const r of (moi ?? []) as { id: Id; ten_lo: string }[]) idTheoTen.set(khoaTen(r.ten_lo), Number(r.id));
  }
  return dsLo.map((l) => ({ ...l, id_lo: idTheoTen.get(khoaTen(l.ten_lo)) ?? -1 }));
}

/**
 * Khớp bảng con theo `id`: xoá dòng đã lưu không còn trong form → cập nhật dòng có id → chèn dòng
 * mới. Xoá trước để lô vừa bỏ rồi thêm lại không vướng UNIQUE (id_phieu, id_lo).
 */
async function khopBangCon<T extends { id?: string }>(
  bang: string,
  idPhieu: number,
  rows: T[],
  body: (r: T, idPhieu: number, stt: number) => Record<string, unknown>
): Promise<void> {
  const { data: cu, error: e0 } = await db.from(bang).select('id').eq('id_phieu', idPhieu);
  if (e0) throwDbError(e0, { resource: `${bang}.list` });
  const idsCu = new Set(((cu ?? []) as { id: Id }[]).map((r) => String(r.id)));
  const giu = new Set(rows.map((r) => r.id).filter((id): id is string => !!id && idsCu.has(id)));

  const xoa = [...idsCu].filter((id) => !giu.has(id));
  if (xoa.length > 0) {
    const { error } = await db.from(bang).delete().in('id', toInt8s(xoa));
    if (error) throwDbError(error, { resource: `${bang}.delete` });
  }

  const sua = rows.flatMap((r, i) => (r.id && giu.has(r.id) ? [{ id: toInt8(r.id), ...body(r, idPhieu, i + 1) }] : []));
  if (sua.length > 0) {
    const { error } = await db.from(bang).upsert(sua, { onConflict: 'id' });
    if (error) throwDbError(error, { resource: `${bang}.update` });
  }

  const moi = rows.flatMap((r, i) => (r.id && giu.has(r.id) ? [] : [body(r, idPhieu, i + 1)]));
  if (moi.length > 0) {
    const { error } = await db.from(bang).insert(moi);
    if (error) throwDbError(error, { resource: `${bang}.insert` });
  }
}

/** Tạo phiếu + cột dây + lô. Bảng con lỗi thì xoá phiếu vừa tạo (cascade) để không để phiếu dở. */
export async function createDgdvDb(values: DgdvFormValues): Promise<string> {
  const idChiNhanh = toInt8(values.id_chi_nhanh);
  if (idChiNhanh == null) throw new Error(i18n.t('danhGiaDauVao.validation.branchRequired'));
  await kiemTraTrungTuan(values.nam, values.tuan, idChiNhanh, null);

  const { data, error } = await db
    .from(TABLE)
    .insert({
      nam: values.nam,
      tuan: values.tuan,
      id_chi_nhanh: idChiNhanh,
      ghi_chu: values.ghi_chu?.trim() || null,
      trang_thai: TRANG_THAI_DGDV.MO,
    })
    .select('id')
    .single();
  if (error) throw new Error(formatDbError(error, { resource: TABLE }));
  const idPhieu = Number((data as { id: Id }).id);

  try {
    await khopBangCon(TABLE_COT, idPhieu, values.cot, cotBody);
    await khopBangCon(TABLE_LO, idPhieu, await ganIdLo(idChiNhanh, values.lo), loBody);
  } catch (err) {
    await db.from(TABLE).delete().eq('id', idPhieu);
    throw err;
  }
  return String(idPhieu);
}

export async function updateDgdvDb(id: string, values: DgdvFormValues): Promise<void> {
  const idPhieu = toInt8(id);
  const idChiNhanh = toInt8(values.id_chi_nhanh);
  if (idPhieu == null || idChiNhanh == null) throw new Error('Invalid id');
  await kiemTraTrungTuan(values.nam, values.tuan, idChiNhanh, idPhieu);

  const { error } = await db
    .from(TABLE)
    .update({
      nam: values.nam,
      tuan: values.tuan,
      id_chi_nhanh: idChiNhanh,
      ghi_chu: values.ghi_chu?.trim() || null,
    })
    .eq('id', idPhieu);
  if (error) throw new Error(formatDbError(error, { resource: TABLE }));

  await khopBangCon(TABLE_COT, idPhieu, values.cot, cotBody);
  await khopBangCon(TABLE_LO, idPhieu, await ganIdLo(idChiNhanh, values.lo), loBody);
}

export async function deleteDgdvManyDb(ids: string[]): Promise<void> {
  const numIds = toInt8s(ids);
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', numIds);
  if (error) throwDbError(error, { resource: `${TABLE}.delete` });
}

export async function updateDgdvTrangThaiManyDb(ids: string[], trang_thai: TrangThaiDgdvPhieu): Promise<void> {
  const numIds = toInt8s(ids);
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE).update({ trang_thai: trangThai(trang_thai) }).in('id', numIds);
  if (error) throwDbError(error, { resource: `${TABLE}.updateTrangThai` });
}

// ---- Ô lưới (tự lưu) ------------------------------------------------------------------

export interface DgdvOInput {
  id_phieu_lo: string;
  id_cot: string;
  ngay: string;
  stt_dong: number;
  so_luong: number;
  danh_gia: string | null;
  so_luong_loi: number;
  ly_do_loi: string | null;
}

/** Ghi một ô (upsert theo khoá ô). Trả dòng đã lưu. */
export async function upsertDongDb(o: DgdvOInput): Promise<FarmDgdvDong> {
  const { data, error } = await db
    .from(TABLE_DONG)
    .upsert(
      {
        id_phieu_lo: toInt8(o.id_phieu_lo),
        id_cot: toInt8(o.id_cot),
        ngay: o.ngay,
        stt_dong: o.stt_dong,
        so_luong: o.so_luong,
        danh_gia: o.danh_gia,
        so_luong_loi: o.so_luong_loi,
        ly_do_loi: o.ly_do_loi,
      },
      { onConflict: 'id_phieu_lo,ngay,stt_dong,id_cot' }
    )
    .select(DONG_COLUMNS)
    .single();
  if (error) throwDbError(error, { resource: TABLE_DONG });
  return mapDong(data as DbDongRow);
}

/** Xoá một ô theo khoá ô (ô trống hết). */
export async function deleteDongDb(o: Pick<DgdvOInput, 'id_phieu_lo' | 'id_cot' | 'ngay' | 'stt_dong'>): Promise<void> {
  const { error } = await db
    .from(TABLE_DONG)
    .delete()
    .eq('id_phieu_lo', toInt8(o.id_phieu_lo) ?? -1)
    .eq('id_cot', toInt8(o.id_cot) ?? -1)
    .eq('ngay', o.ngay)
    .eq('stt_dong', o.stt_dong);
  if (error) throwDbError(error, { resource: `${TABLE_DONG}.delete` });
}

/** Đứt dây của lô × ngày: 0 → xoá dòng, khác 0 → upsert. Trả dòng đã lưu (null khi xoá). */
export async function luuDutDayDb(idPhieuLo: string, ngay: string, dutDay: number): Promise<FarmDgdvLoNgay | null> {
  if (dutDay <= 0) {
    const { error } = await db
      .from(TABLE_LO_NGAY)
      .delete()
      .eq('id_phieu_lo', toInt8(idPhieuLo) ?? -1)
      .eq('ngay', ngay);
    if (error) throwDbError(error, { resource: `${TABLE_LO_NGAY}.delete` });
    return null;
  }
  const { data, error } = await db
    .from(TABLE_LO_NGAY)
    .upsert({ id_phieu_lo: toInt8(idPhieuLo), ngay, dut_day: dutDay }, { onConflict: 'id_phieu_lo,ngay' })
    .select(LO_NGAY_COLUMNS)
    .single();
  if (error) throwDbError(error, { resource: TABLE_LO_NGAY });
  return mapLoNgay(data as DbLoNgayRow);
}

/** Ghi chú của lô trong phiếu (cột «Ghi chú» cuối lưới — dùng chung cả tuần). */
export async function luuGhiChuLoDb(idPhieuLo: string, ghiChu: string | null): Promise<void> {
  const { error } = await db
    .from(TABLE_LO)
    .update({ ghi_chu: ghiChu?.trim() || null })
    .eq('id', toInt8(idPhieuLo) ?? -1);
  if (error) throwDbError(error, { resource: `${TABLE_LO}.ghiChu` });
}
