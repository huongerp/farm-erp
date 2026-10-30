/**
 * Đánh giá đầu vào — DB: fp_farm_dgdv (+ _cot, _lo, _lo_ngay, _dong). Migration 052, 057.
 * 1 phiếu = 1 chuyến (ngay, id_chi_nhanh, chuyen); nam / tuan (tuần farm) do DB tự tính — app không gửi.
 * Danh sách đọc view `v_fp_farm_dgdv_tong_chuyen` (đã có tổng) để lọc / sắp xếp ở PostgREST.
 * id bigint → String() ngay trong mapper; lỗi PostgREST format qua lib/db-errors.
 */
import { db, fetchAllRows, fetchTablePage, throwDbError, formatDbError, type PaginatedTableResult } from '../../../../lib/db';
import { applyPostgrestSearch } from '../../../../lib/postgrest-search';
import i18n from '../../../../lib/i18n';
import { formatYmdToDisplay } from '../../../../lib/utils';
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
} from '../core/types';
import type { DgdvFormValues } from '../core/schema';
import { gonTen, khoaTen } from '../core/chuan-hoa-ten';
import { cacNgayCuaTuanFarm, docKhoaTuanFarm } from '../core/tuan';
import { LOC_KSC } from '../core/tong-hop';
import type { DongImportRpc } from '../utils/import-dong';

const TABLE = 'fp_farm_dgdv';
const VIEW_LIST = 'v_fp_farm_dgdv_tong_chuyen';
const TABLE_COT = 'fp_farm_dgdv_cot';
const TABLE_LO = 'fp_farm_dgdv_lo';
const TABLE_LO_NGAY = 'fp_farm_dgdv_lo_ngay';
const TABLE_DONG = 'fp_farm_dgdv_dong';
const T_DM_LO = 'fp_var_lo_thu_hoach';

const PHIEU_COLUMNS = 'id,ngay,chuyen,nam,tuan,id_chi_nhanh,ghi_chu,trang_thai,id_nguoi_tao,tg_tao,tg_cap_nhat';
const COT_COLUMNS =
  'id,id_phieu,stt,th_nam,th_tuan,chich_bap_tu,chich_bap_den,thu_hoach_tu,thu_hoach_den,id_mau_1,id_mau_2,xe_doi';
const DONG_COLUMNS = 'id,id_phieu_lo,id_cot,ngay,stt_dong,so_luong,danh_gia,so_luong_huy,ly_do_huy';
const LO_NGAY_COLUMNS = 'id,id_phieu_lo,ngay,dut_day';

/** Danh sách: view đã có tên chi nhánh + tổng SL / đứt dây / tổng thu / KSC của chuyến. */
const LIST_SELECT = `${PHIEU_COLUMNS},ten_chi_nhanh,tong_so_luong,tong_dut_day,tong_thu,ksc`;

/** Phiếu đầy đủ: cột dây + lô (tên lô) + đứt dây + ô lưới của chuyến — MỘT request. */
const FULL_SELECT =
  `${PHIEU_COLUMNS},chi_nhanh:fp_var_chi_nhanh(ten_chi_nhanh),` +
  `${TABLE_COT}(${COT_COLUMNS}),` +
  `${TABLE_LO}(id,id_phieu,id_lo,to_truong,ghi_chu,stt,lo:fp_var_lo_thu_hoach(ten_lo),` +
  `${TABLE_LO_NGAY}(${LO_NGAY_COLUMNS}),${TABLE_DONG}(${DONG_COLUMNS}))`;

type Id = number | string;

interface DbPhieuRow {
  id: Id;
  ngay: string;
  chuyen: number | string;
  nam: number;
  tuan: number;
  id_chi_nhanh: Id;
  ghi_chu: string | null;
  trang_thai: string | null;
  id_nguoi_tao: Id | null;
  tg_tao: string;
  tg_cap_nhat: string;
  chi_nhanh?: { ten_chi_nhanh: string | null } | null;
  /** cột phẳng của view danh sách */
  ten_chi_nhanh?: string | null;
}

/** Dòng view v_fp_farm_dgdv_tong_chuyen (bigint có thể về dạng chuỗi). */
interface DbListRow extends DbPhieuRow {
  tong_so_luong: number | string | null;
  tong_dut_day: number | string | null;
  tong_thu: number | string | null;
  ksc: number | string | null;
}

interface DbCotRow {
  id: Id;
  id_phieu: Id;
  stt: number;
  th_nam: number;
  th_tuan: number;
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
  so_luong_huy: number | null;
  ly_do_huy: string | null;
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

/** Dòng danh sách: phiếu chuyến + tổng của chuyến (view, cộng như fn_dgdv_tong_ngay nhưng chỉ một chuyến). */
export interface DgdvListRow extends FarmDgdv {
  tong_so_luong: number;
  tong_dut_day: number;
  /** = tong_so_luong + tong_dut_day */
  tong_thu: number;
  /** Σ số lượng lỗi */
  ksc: number;
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
    ngay: ymd(r.ngay),
    chuyen: so(r.chuyen),
    nam: so(r.nam),
    tuan: so(r.tuan),
    id_chi_nhanh: String(r.id_chi_nhanh),
    ten_chi_nhanh: r.ten_chi_nhanh ?? r.chi_nhanh?.ten_chi_nhanh ?? null,
    ghi_chu: r.ghi_chu ?? null,
    trang_thai: trangThai(r.trang_thai),
    id_nguoi_tao: str(r.id_nguoi_tao),
    ten_nguoi_tao: null,
    tg_tao: r.tg_tao,
    tg_cap_nhat: r.tg_cap_nhat,
  };
}

function mapListRow(r: DbListRow): DgdvListRow {
  return {
    ...mapPhieu(r),
    tong_so_luong: so(r.tong_so_luong),
    tong_dut_day: so(r.tong_dut_day),
    tong_thu: so(r.tong_thu),
    ksc: so(r.ksc),
  };
}

export function mapCot(r: DbCotRow): FarmDgdvCot {
  return {
    id: String(r.id),
    id_phieu: String(r.id_phieu),
    stt: so(r.stt),
    th_nam: so(r.th_nam),
    th_tuan: so(r.th_tuan),
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
    so_luong_huy: so(r.so_luong_huy),
    ly_do_huy: r.ly_do_huy ?? null,
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

/** Cột tham gia ô tìm kiếm ở server (view có sẵn tên chi nhánh). */
const DGDV_SEARCH_SPEC = {
  text: ['ghi_chu', 'trang_thai', 'ten_chi_nhanh'],
  numeric: ['id', 'nam', 'tuan', 'chuyen'],
  dates: ['ngay'],
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
  const chuyen = (query.chuyen ?? []).map(Number).filter(Number.isInteger);
  if (chuyen.length > 0) sel = sel.in('chuyen', chuyen);
  if ((query.idNguoiTao ?? []).length > 0) sel = sel.in('id_nguoi_tao', toInt8s(query.idNguoiTao!));
  const ksc = query.ksc ?? [];
  if (ksc.length === 1) sel = ksc[0] === LOC_KSC.CO ? sel.gt('ksc', 0) : sel.eq('ksc', 0);
  if (query.tuNgay) sel = sel.gte('ngay', query.tuNgay);
  if (query.denNgay) sel = sel.lte('ngay', query.denNgay);
  // Tuần farm (nhiều tuần, có thể khác năm) → ngày thuộc các tuần đó; tránh or(and(nam,tuan)) lồng nhau.
  const ngayCuaTuan = query.tuanFarm.flatMap((k) => {
    const t = docKhoaTuanFarm(k);
    return t ? cacNgayCuaTuanFarm(t.nam, t.tuan) : [];
  });
  if (query.tuanFarm.length > 0) sel = sel.in('ngay', ngayCuaTuan.length > 0 ? ngayCuaTuan : ['1900-01-01']);

  sel = applyPostgrestSearch(sel, query.searchTerm, DGDV_SEARCH_SPEC);

  const dbSortable = query.sortColumn != null && DGDV_SORTABLE_DB_COLUMNS.has(query.sortColumn);
  const sortCol = dbSortable ? query.sortColumn! : DGDV_SORT_MAC_DINH.column;
  const ascending = dbSortable ? query.sortDirection !== 'desc' : DGDV_SORT_MAC_DINH.ascending;

  // Ngày → ngay, chuyen; Chuyến → chuyen, ngay; Tuần → nam, tuan rồi ngay, chuyen.
  if (sortCol === 'tuan') sel = sel.order('nam', { ascending }).order('tuan', { ascending });
  if (sortCol === 'chuyen') sel = sel.order('chuyen', { ascending }).order('ngay', { ascending });
  else if (sortCol === 'ngay' || sortCol === 'tuan') sel = sel.order('ngay', { ascending }).order('chuyen', { ascending });
  else sel = sel.order(sortCol, { ascending });
  return sel.order('id', { ascending: false });
}

export async function getDgdvPageDb(query: DgdvListServerQuery): Promise<PaginatedTableResult<DgdvListRow>> {
  const result = await fetchTablePage<DbListRow>(query.page, query.pageSize, async (from, to) => {
    const res = await applyDgdvListQuery(db.from(VIEW_LIST).select(LIST_SELECT, { count: 'exact' }), query).range(from, to);
    return { data: (res.data as DbListRow[] | null) ?? null, error: res.error, count: res.count };
  });
  return { ...result, data: result.data.map(mapListRow) };
}

/** Toàn bộ phiếu khớp bộ lọc — CHỈ dùng khi bấm Xuất file. */
export async function fetchAllDgdvForListQueryDb(query: DgdvListServerQuery): Promise<DgdvListRow[]> {
  const rows = await fetchAllRows<DbListRow>((from, to) =>
    applyDgdvListQuery(db.from(VIEW_LIST).select(LIST_SELECT), query).range(from, to)
  );
  return rows.map(mapListRow);
}

export interface DgdvTomTat {
  id: string;
  ngay: string;
  chuyen: number;
  /** tuần farm của ngày */
  nam: number;
  tuan: number;
  id_chi_nhanh: string;
  trang_thai: TrangThaiDgdvPhieu;
  id_nguoi_tao: string | null;
  tg_tao: string;
}

/** Tóm tắt toàn bộ phiếu trong phạm vi — chip lọc + số đếm, gợi ý chi nhánh, chặn trùng chuyến. */
export async function getDgdvTomTatDb(viewAll: boolean, allowedBranchIds: string[]): Promise<DgdvTomTat[]> {
  const rows = await fetchAllRows<DbPhieuRow>((from, to) =>
    locPhamVi(
      db.from(TABLE).select('id,ngay,chuyen,nam,tuan,id_chi_nhanh,trang_thai,id_nguoi_tao,tg_tao'),
      viewAll,
      allowedBranchIds
    )
      .order('ngay', { ascending: false })
      .order('chuyen', { ascending: false })
      .range(from, to)
  );
  return rows.map((r) => ({
    id: String(r.id),
    ngay: ymd(r.ngay),
    chuyen: so(r.chuyen),
    nam: so(r.nam),
    tuan: so(r.tuan),
    id_chi_nhanh: String(r.id_chi_nhanh),
    trang_thai: trangThai(r.trang_thai),
    id_nguoi_tao: str(r.id_nguoi_tao),
    tg_tao: r.tg_tao,
  }));
}

/** Số chuyến kế tiếp của (ngày, chi nhánh) = chuyến lớn nhất đang có + 1 (chưa có phiếu → 1). */
export async function layChuyenKeTiep(ngay: string, idChiNhanh: string): Promise<number> {
  const cn = toInt8(idChiNhanh);
  if (cn == null || !ngay) return 1;
  const { data, error } = await db
    .from(TABLE)
    .select('chuyen')
    .eq('ngay', ngay)
    .eq('id_chi_nhanh', cn)
    .order('chuyen', { ascending: false })
    .limit(1);
  if (error) throwDbError(error, { resource: `${TABLE}.chuyenKeTiep` });
  const max = so((data as { chuyen: number | string }[] | null)?.[0]?.chuyen);
  return max + 1;
}

// ---- Phiếu đầy đủ ------------------------------------------------------------------

export async function getDgdvByIdDb(id: string): Promise<DgdvPhieuDayDu | null> {
  const numId = toInt8(id);
  if (numId == null) return null;
  const { data, error } = await db.from(TABLE).select(FULL_SELECT).eq('id', numId).maybeSingle();
  if (error) throwDbError(error, { resource: `${TABLE}.byId` });
  return data ? mapFull(data as unknown as DbFullRow) : null;
}

/** Phiếu đầy đủ theo danh sách id (xuất chi tiết theo bộ lọc) — chia lô để URL `in.(…)` không quá dài. */
export async function getDgdvDayDuTheoIdsDb(ids: string[]): Promise<DgdvPhieuDayDu[]> {
  const numIds = toInt8s(ids);
  const ds: DgdvPhieuDayDu[] = [];
  for (let i = 0; i < numIds.length; i += 100) {
    const { data, error } = await db.from(TABLE).select(FULL_SELECT).in('id', numIds.slice(i, i + 100));
    if (error) throwDbError(error, { resource: `${TABLE}.theoIds` });
    ds.push(...((data ?? []) as unknown as DbFullRow[]).map(mapFull));
  }
  return ds;
}

/** Chép khung: cột dây + lô (tên lô), không kéo ô số. */
const KHUNG_SELECT =
  `${PHIEU_COLUMNS},${TABLE_COT}(${COT_COLUMNS}),` +
  `${TABLE_LO}(id,id_phieu,id_lo,to_truong,ghi_chu,stt,lo:fp_var_lo_thu_hoach(ten_lo))`;

/**
 * Phiếu gần nhất TRƯỚC chuyến (ngày, chuyến) của chi nhánh: cùng ngày chuyến nhỏ hơn, không có thì ngày
 * trước đó (chuyến lớn nhất). Chỉ có khung dây + lô (để chép sang phiếu mới). `boQuaId` = phiếu đang sửa.
 */
export async function getPhieuChuyenTruocDb(
  ngay: string,
  chuyen: number,
  idChiNhanh: string,
  boQuaId: string | null
): Promise<DgdvPhieuDayDu | null> {
  const cn = toInt8(idChiNhanh);
  if (cn == null || !ngay) return null;
  let sel = db
    .from(TABLE)
    .select(KHUNG_SELECT)
    .eq('id_chi_nhanh', cn)
    .or(`ngay.lt.${ngay},and(ngay.eq.${ngay},chuyen.lt.${Math.max(1, Math.trunc(chuyen) || 1)})`);
  const bo = toInt8(boQuaId);
  if (bo != null) sel = sel.neq('id', bo);
  const { data, error } = await sel
    .order('ngay', { ascending: false })
    .order('chuyen', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throwDbError(error, { resource: `${TABLE}.chuyenTruoc` });
  return data ? mapFull(data as unknown as DbFullRow) : null;
}

/**
 * Phiếu đầy đủ (mọi chuyến) có ngày trong khoảng [tu, den] — bảng đánh giá theo khoảng ngày; một chi
 * nhánh, hoặc mọi chi nhánh trong phạm vi khi `idChiNhanh` rỗng.
 */
export async function getDgdvTheoKhoangNgayDb(
  tu: string,
  den: string,
  idChiNhanh: string | null,
  viewAll: boolean,
  allowedBranchIds: string[]
): Promise<DgdvPhieuDayDu[]> {
  if (!tu || !den || den < tu) return [];
  // Chi nhánh lấy từ URL trang in: ngoài phạm vi xem thì coi như không có phiếu.
  if (idChiNhanh && !viewAll && !allowedBranchIds.map(String).includes(idChiNhanh)) return [];
  let sel = db.from(TABLE).select(FULL_SELECT).gte('ngay', tu).lte('ngay', den);
  sel = idChiNhanh ? sel.eq('id_chi_nhanh', toInt8(idChiNhanh) ?? -1) : locPhamVi(sel, viewAll, allowedBranchIds);
  const { data, error } = await sel.order('ngay').order('id_chi_nhanh').order('chuyen');
  if (error) throwDbError(error, { resource: `${TABLE}.theoKhoangNgay` });
  return ((data ?? []) as unknown as DbFullRow[]).map(mapFull);
}

// ---- Thêm / sửa phiếu ----------------------------------------------------------------

/** Lỗi rõ ràng khi (ngày, chi nhánh, chuyến) đã có phiếu khác — DB cũng chặn bằng UNIQUE. */
async function kiemTraTrungChuyen(ngay: string, chuyen: number, idChiNhanh: number, boQuaId: number | null): Promise<void> {
  let sel = db.from(TABLE).select('id').eq('ngay', ngay).eq('chuyen', chuyen).eq('id_chi_nhanh', idChiNhanh);
  if (boQuaId != null) sel = sel.neq('id', boQuaId);
  const { data, error } = await sel.limit(1);
  if (error) throwDbError(error, { resource: `${TABLE}.trungChuyen` });
  if ((data ?? []).length > 0) {
    throw new Error(i18n.t('danhGiaDauVao.toast.trungChuyen', { chuyen, ngay: formatYmdToDisplay(ngay) }));
  }
}

/**
 * Lỗi ghi đầu phiếu: đụng UNIQUE (ngay, id_chi_nhanh, chuyen) — hai người lưu cùng lúc, hoặc import chen
 * vào sau bước kiểm trùng — thì báo đúng câu «trùng chuyến» kèm mã; lỗi khác qua lib/db-errors.
 */
function loiGhiPhieu(error: unknown, values: Pick<DgdvFormValues, 'ngay' | 'chuyen'>): Error {
  const e = error as { code?: string; message?: string; details?: string | null };
  const chu = `${e?.message ?? ''} ${e?.details ?? ''}`;
  const trung = e?.code === '23505' && /fp_farm_dgdv_ngay_cn_chuyen_key|\(ngay, id_chi_nhanh, chuyen\)/.test(chu);
  if (!trung) return new Error(formatDbError(error, { resource: TABLE }));
  return new Error(
    `[23505] ${i18n.t('danhGiaDauVao.toast.trungChuyen', { chuyen: values.chuyen, ngay: formatYmdToDisplay(values.ngay) })}`
  );
}

/** Dây chỉ ghi tuần thu hoạch — 4 cột ngày do trigger DB tự điền (migration 057). */
function cotBody(c: DgdvFormValues['cot'][number], idPhieu: number, stt: number) {
  return {
    id_phieu: idPhieu,
    stt,
    th_nam: c.th_nam,
    th_tuan: c.th_tuan,
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
  await kiemTraTrungChuyen(values.ngay, values.chuyen, idChiNhanh, null);

  const { data, error } = await db
    .from(TABLE)
    .insert({
      ngay: values.ngay,
      chuyen: values.chuyen,
      id_chi_nhanh: idChiNhanh,
      ghi_chu: values.ghi_chu?.trim() || null,
      trang_thai: TRANG_THAI_DGDV.MO,
    })
    .select('id')
    .single();
  if (error) throw loiGhiPhieu(error, values);
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
  await kiemTraTrungChuyen(values.ngay, values.chuyen, idChiNhanh, idPhieu);

  // Đổi ngày: trigger DB dời ngày mọi ô / đứt dây của phiếu theo (migration 057).
  const { error } = await db
    .from(TABLE)
    .update({
      ngay: values.ngay,
      chuyen: values.chuyen,
      id_chi_nhanh: idChiNhanh,
      ghi_chu: values.ghi_chu?.trim() || null,
    })
    .eq('id', idPhieu);
  if (error) throw loiGhiPhieu(error, values);

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
  so_luong_huy: number;
  ly_do_huy: string | null;
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
        so_luong_huy: o.so_luong_huy,
        ly_do_huy: o.ly_do_huy,
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

// ---- Import Excel dòng chi tiết ---------------------------------------------------------

export interface DgdvImportKetQua {
  errors: { row: number; msg: string }[];
  so_dong: number;
  so_phieu_moi: number;
  so_lo_moi: number;
  so_day_moi: number;
}

/** Ghi các dòng đã parse qua RPC `rpc_dgdv_import` (migration 057, theo chuyến) — một transaction, lỗi là không ghi gì. */
export async function importDongDgdvDb(
  rows: DongImportRpc[],
  thayThe: boolean,
  idPhieu: string | null
): Promise<DgdvImportKetQua> {
  const { data, error } = await db.rpc('rpc_dgdv_import', {
    p_rows: rows,
    p_thay_the: thayThe,
    p_id_phieu: toInt8(idPhieu),
  });
  if (error) throwDbError(error, { resource: 'rpc_dgdv_import' });
  return data as DgdvImportKetQua;
}
