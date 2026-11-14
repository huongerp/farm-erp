/**
 * Nhật ký pha thuốc phun cùi — DB: fp_farm_ptc_nhat_ky (phiếu theo NSC × ngày) + fp_farm_ptc_nhat_ky_lan
 * (các lần pha, embed cùng request) + fp_farm_ptc_dinh_muc (định mức thuốc theo NSC).
 * Lưu phiếu KHÔNG qua RPC: tạo = insert cha rồi insert con (lỗi con → xoá cha); sửa = update cha,
 * xoá con, insert lại (lỗi chèn lại → khôi phục dòng cũ).
 */
import { db, fetchAllRows, fetchTablePage, throwDbError, type PaginatedTableResult } from '../../../../lib/db';
import { applyPostgrestSearch, buildPostgrestSearchOr, dieuKienKyTheoNgay } from '../../../../lib/postgrest-search';
import i18n from '../../../../lib/i18n';
import { formatYmdToDisplay } from '../../../../lib/utils';
import { chuanHoaDonVi } from '../core/constants';
import { dongChiTietTuDb, type DbLanChiTiet } from '../core/chi-tiet';
import { tinhLuongThuoc } from '../core/luong-thuoc';
import { laDongTrong, type DinhMucFormValues, type NhatKyFormValues } from '../core/schema';
import { parseSo } from '../core/so';
import type { DinhMucThuoc, LanPha, NhatKyPhunCui, NhatKyPhunCuiLanRow } from '../core/types';
import {
  NKPC_CHI_TIET_SORT_DB,
  NKPC_SORTABLE_DB_COLUMNS,
  NKPC_SORT_MAC_DINH,
  type NhatKyPhunCuiListServerQuery,
  type NkpcChiTietListServerQuery,
} from './nhat-ky-phun-cui-list-query';

const TABLE = 'fp_farm_ptc_nhat_ky';
const TABLE_LAN = 'fp_farm_ptc_nhat_ky_lan';
const TABLE_DM = 'fp_farm_ptc_dinh_muc';
const TABLE_HH = 'fp_farm_danh_sach_hang_hoa';

const HH_EMBED = `hh:${TABLE_HH}!id_hang_hoa(ma_hang_hoa,ten_hang_hoa,dvt)`;
const LAN_COLUMNS = `id,thu_tu,gio,id_hang_hoa,nong_do,don_vi,luong_nuoc_lit,luong_thuoc,ghi_chu,${HH_EMBED}`;
const ROW_COLUMNS =
  'id,ngay,id_chi_nhanh,id_nhan_vien_phu_trach,ghi_chu,id_nguoi_tao,tg_tao,tg_cap_nhat,' +
  `cn:fp_var_chi_nhanh!id_chi_nhanh(ten_chi_nhanh),lan:${TABLE_LAN}(${LAN_COLUMNS})`;
const DM_COLUMNS =
  `id,id_chi_nhanh,id_hang_hoa,nong_do,don_vi,dang_dung,ghi_chu,thu_tu,${HH_EMBED},` +
  'cn:fp_var_chi_nhanh!id_chi_nhanh(ten_chi_nhanh)';

type HhEmbed = { ma_hang_hoa: string | null; ten_hang_hoa: string | null; dvt: string | null } | null;
type Numeric = number | string | null;

interface LanRow {
  id: number;
  thu_tu: number;
  gio: string | null;
  id_hang_hoa: number;
  nong_do: Numeric;
  don_vi: string | null;
  luong_nuoc_lit: Numeric;
  luong_thuoc: Numeric;
  ghi_chu: string | null;
  hh?: HhEmbed;
}

interface DbRow {
  id: number;
  ngay: string;
  id_chi_nhanh: number;
  id_nhan_vien_phu_trach: number | null;
  ghi_chu: string | null;
  id_nguoi_tao: number | null;
  tg_tao: string;
  tg_cap_nhat: string;
  cn?: { ten_chi_nhanh: string | null } | null;
  lan?: LanRow[] | null;
}

interface DmRow {
  id: number;
  id_chi_nhanh: number;
  id_hang_hoa: number;
  nong_do: Numeric;
  don_vi: string | null;
  dang_dung: boolean | null;
  ghi_chu: string | null;
  thu_tu: number | null;
  hh?: HhEmbed;
  cn?: { ten_chi_nhanh: string | null } | null;
}

const idStr = (v: number | null | undefined) => (v != null ? String(v) : null);

/** Numeric PostgREST có thể về chuỗi → ép số; null giữ null. */
const num = (v: Numeric | undefined): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function toIntId(id: string): number {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error('Invalid id');
  return n;
}

const blank = (v: string | null | undefined) => {
  const s = (v ?? '').trim();
  return s === '' ? null : s;
};

/** Mã lỗi Postgres từ lỗi PostgREST (trước khi qua throwDbError). */
const laTrungKhoa = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';

function lanToModel(r: LanRow): LanPha {
  return {
    id: String(r.id),
    thu_tu: r.thu_tu,
    gio: r.gio ? r.gio.slice(0, 5) : null,
    id_hang_hoa: String(r.id_hang_hoa),
    ma_hang_hoa: r.hh?.ma_hang_hoa ?? null,
    ten_hang_hoa: r.hh?.ten_hang_hoa ?? null,
    dvt: r.hh?.dvt ?? null,
    nong_do: num(r.nong_do),
    don_vi: chuanHoaDonVi(r.don_vi),
    luong_nuoc_lit: num(r.luong_nuoc_lit),
    luong_thuoc: num(r.luong_thuoc),
    ghi_chu: r.ghi_chu,
  };
}

function rowToModel(row: DbRow): NhatKyPhunCui {
  return {
    id: String(row.id),
    ngay: row.ngay,
    id_chi_nhanh: String(row.id_chi_nhanh),
    ten_chi_nhanh: row.cn?.ten_chi_nhanh ?? null,
    id_nhan_vien_phu_trach: idStr(row.id_nhan_vien_phu_trach),
    ten_nhan_vien_phu_trach: null,
    ghi_chu: row.ghi_chu,
    id_nguoi_tao: idStr(row.id_nguoi_tao),
    ten_nguoi_tao: null,
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
    lan: [...(row.lan ?? [])].sort((a, b) => a.thu_tu - b.thu_tu || a.id - b.id).map(lanToModel),
  };
}

function dmToModel(r: DmRow): DinhMucThuoc {
  return {
    id: String(r.id),
    id_chi_nhanh: String(r.id_chi_nhanh),
    ten_chi_nhanh: r.cn?.ten_chi_nhanh ?? null,
    id_hang_hoa: String(r.id_hang_hoa),
    ma_hang_hoa: r.hh?.ma_hang_hoa ?? null,
    ten_hang_hoa: r.hh?.ten_hang_hoa ?? null,
    dvt: r.hh?.dvt ?? null,
    nong_do: num(r.nong_do) ?? 0,
    don_vi: chuanHoaDonVi(r.don_vi),
    dang_dung: r.dang_dung !== false,
    ghi_chu: r.ghi_chu,
    thu_tu: r.thu_tu ?? 0,
  };
}

/** Phạm vi chi nhánh: người không xem tất cả chỉ thấy NSC được phân (rỗng → không thấy gì). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apPhamVi(sel: any, viewAll: boolean, allowedBranchIds: string[]): any {
  if (viewAll) return sel;
  const ids = allowedBranchIds.map(Number).filter(Number.isFinite);
  return ids.length === 0 ? sel.eq('id', -1) : sel.in('id_chi_nhanh', ids);
}

const NKPC_SEARCH_SPEC = {
  text: ['ghi_chu'],
  numeric: ['id'],
  dates: ['ngay'],
};

/** id nhật ký có lần pha dùng thuốc khớp từ khoá (tên / mã hàng hoá). */
async function idNhatKyTheoThuoc(tuKhoa: string): Promise<number[]> {
  const s = tuKhoa.trim();
  if (!s) return [];
  const hh = await applyPostgrestSearch(db.from(TABLE_HH).select('id'), s, {
    text: ['ten_hang_hoa', 'ma_hang_hoa'],
  }).limit(200);
  if (hh.error) throwDbError(hh.error);
  const hhIds = ((hh.data as { id: number }[] | null) ?? []).map((r) => r.id);
  if (hhIds.length === 0) return [];
  const { data, error } = await db.from(TABLE_LAN).select('id_nhat_ky').in('id_hang_hoa', hhIds).limit(500);
  if (error) throwDbError(error);
  return [...new Set(((data as { id_nhat_ky: number }[] | null) ?? []).map((r) => r.id_nhat_ky))];
}

/** Lọc + sắp xếp dùng chung cho trang danh sách và xuất file. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyNhatKyListQuery(q: any, query: NhatKyPhunCuiListServerQuery, idTheoThuoc: number[]): any {
  let sel = apPhamVi(q, query.viewAll, query.allowedBranchIds);
  if (query.idChiNhanh.length > 0) {
    sel = sel.in('id_chi_nhanh', query.idChiNhanh.map(Number).filter(Number.isFinite));
  }
  const ky = dieuKienKyTheoNgay([], query.thang, 'ngay');
  if (ky.length) sel = sel.or(ky.join(','));

  const dk = buildPostgrestSearchOr(query.searchTerm, NKPC_SEARCH_SPEC);
  if (dk.length > 0) {
    if (idTheoThuoc.length > 0) dk.push(`id.in.(${idTheoThuoc.join(',')})`);
    sel = sel.or(dk.join(','));
  }

  const dbSortable = query.sortColumn != null && NKPC_SORTABLE_DB_COLUMNS.has(query.sortColumn);
  const sortCol = dbSortable ? query.sortColumn! : NKPC_SORT_MAC_DINH.column;
  const ascending = dbSortable ? query.sortDirection !== 'desc' : NKPC_SORT_MAC_DINH.ascending;
  return sel.order(sortCol, { ascending, nullsFirst: false }).order('id', { ascending: false });
}

export async function getNhatKyPageDb(query: NhatKyPhunCuiListServerQuery): Promise<PaginatedTableResult<NhatKyPhunCui>> {
  const idTheoThuoc = await idNhatKyTheoThuoc(query.searchTerm);
  const result = await fetchTablePage<DbRow>(query.page, query.pageSize, async (from, to) => {
    const res = await applyNhatKyListQuery(db.from(TABLE).select(ROW_COLUMNS, { count: 'exact' }), query, idTheoThuoc).range(
      from,
      to
    );
    return { data: (res.data as DbRow[] | null) ?? null, error: res.error, count: res.count };
  });
  return { ...result, data: result.data.map(rowToModel) };
}

/** Toàn bộ nhật ký khớp bộ lọc — chỉ khi Xuất file. */
export async function fetchAllNhatKyForListQuery(query: NhatKyPhunCuiListServerQuery): Promise<NhatKyPhunCui[]> {
  const idTheoThuoc = await idNhatKyTheoThuoc(query.searchTerm);
  const rows = await fetchAllRows<DbRow>((from, to) =>
    applyNhatKyListQuery(db.from(TABLE).select(ROW_COLUMNS), query, idTheoThuoc).range(from, to)
  );
  return rows.map(rowToModel);
}

// ---------- Tab Chi tiết: từng lần pha ----------

const CHI_TIET_COLUMNS =
  `id,id_nhat_ky,thu_tu,gio,id_hang_hoa,nong_do,don_vi,luong_nuoc_lit,luong_thuoc,ghi_chu,${HH_EMBED},` +
  `nk:${TABLE}!inner(ngay,id_chi_nhanh,` +
  'cn:fp_var_chi_nhanh!id_chi_nhanh(ten_chi_nhanh),' +
  'nv:fp_var_nhan_vien!id_nhan_vien_phu_trach(ho_va_ten))';

/** Lọc theo cột của phiếu cha (`nk`, embed !inner nên lọc luôn dòng con) + sắp xếp. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyNkpcChiTietQuery(q: any, query: NkpcChiTietListServerQuery): any {
  let sel = q;
  if (!query.viewAll) {
    const ids = query.allowedBranchIds.map(Number).filter(Number.isFinite);
    sel = ids.length === 0 ? sel.eq('id', -1) : sel.in('nk.id_chi_nhanh', ids);
  }
  if (query.idChiNhanh.length > 0) {
    sel = sel.in('nk.id_chi_nhanh', query.idChiNhanh.map(Number).filter(Number.isFinite));
  }
  const ky = dieuKienKyTheoNgay([], query.thang, 'ngay');
  if (ky.length) sel = sel.or(ky.join(','), { referencedTable: 'nk' });

  const sortDb = query.sortColumn != null && query.sortDirection ? NKPC_CHI_TIET_SORT_DB[query.sortColumn] : undefined;
  if (sortDb) sel = sel.order(sortDb, { ascending: query.sortDirection !== 'desc', nullsFirst: false });
  // Mặc định: ngày mới nhất, cùng phiếu thì lần 1 → n.
  return sel
    .order('nk(ngay)', { ascending: false })
    .order('id_nhat_ky', { ascending: false })
    .order('thu_tu', { ascending: true });
}

export async function getNkpcChiTietPageDb(
  query: NkpcChiTietListServerQuery
): Promise<PaginatedTableResult<NhatKyPhunCuiLanRow>> {
  const result = await fetchTablePage<DbLanChiTiet>(query.page, query.pageSize, async (from, to) => {
    const res = await applyNkpcChiTietQuery(
      db.from(TABLE_LAN).select(CHI_TIET_COLUMNS, { count: 'exact' }),
      query
    ).range(from, to);
    return { data: (res.data as DbLanChiTiet[] | null) ?? null, error: res.error, count: res.count };
  });
  return { ...result, data: result.data.map(dongChiTietTuDb) };
}

/** Toàn bộ lần pha khớp bộ lọc — chỉ khi Xuất file. */
export async function fetchAllNkpcChiTietForListQuery(query: NkpcChiTietListServerQuery): Promise<NhatKyPhunCuiLanRow[]> {
  const rows = await fetchAllRows<DbLanChiTiet>((from, to) =>
    applyNkpcChiTietQuery(db.from(TABLE_LAN).select(CHI_TIET_COLUMNS), query).range(from, to)
  );
  return rows.map(dongChiTietTuDb);
}

export interface NhatKyTomTatRow {
  id: number;
  ngay: string;
  id_chi_nhanh: number | null;
}

/** Vài cột của toàn bộ nhật ký — chip lọc (đếm trên toàn bộ dữ liệu, không phải trang đang xem). */
export async function getNhatKyTomTatDb(viewAll: boolean, allowedBranchIds: string[]): Promise<NhatKyTomTatRow[]> {
  return fetchAllRows<NhatKyTomTatRow>((from, to) =>
    apPhamVi(db.from(TABLE).select('id,ngay,id_chi_nhanh'), viewAll, allowedBranchIds)
      .order('ngay', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to)
  );
}

export async function getNhatKyByIdDb(id: string): Promise<NhatKyPhunCui | null> {
  const { data, error } = await db.from(TABLE).select(ROW_COLUMNS).eq('id', toIntId(id)).maybeSingle();
  if (error) throwDbError(error);
  return data ? rowToModel(data as unknown as DbRow) : null;
}

/** Dòng lần pha form → bản ghi gửi DB (bỏ dòng trống; lượng thuốc tính lại, không tin client). */
export function lanTuForm(idNhatKy: number, values: NhatKyFormValues): Record<string, unknown>[] {
  return values.lan
    .filter((l) => !laDongTrong(l))
    .map((l, i) => {
      const nongDo = parseSo(l.nong_do);
      const nuoc = parseSo(l.luong_nuoc_lit);
      return {
        id_nhat_ky: idNhatKy,
        thu_tu: i + 1,
        gio: blank(l.gio),
        id_hang_hoa: toIntId(l.id_hang_hoa),
        nong_do: nongDo,
        don_vi: l.don_vi,
        luong_nuoc_lit: nuoc,
        luong_thuoc: tinhLuongThuoc(nongDo, nuoc),
        ghi_chu: blank(l.ghi_chu),
      };
    });
}

function chaTuForm(values: NhatKyFormValues): Record<string, unknown> {
  return {
    ngay: values.ngay,
    id_chi_nhanh: toIntId(values.id_chi_nhanh),
    id_nhan_vien_phu_trach: values.id_nhan_vien_phu_trach ? toIntId(values.id_nhan_vien_phu_trach) : null,
    ghi_chu: blank(values.ghi_chu),
  };
}

function loiTrungNgay(ngay: string): Error {
  return new Error(i18n.t('nkpc.service.trungNgay', { ngay: formatYmdToDisplay(ngay) }));
}

/** Tạo (id = null) hoặc sửa nhật ký + thay toàn bộ lần pha. Trả id nhật ký. */
export async function luuNhatKyDb(id: string | null, values: NhatKyFormValues): Promise<string> {
  const cha = chaTuForm(values);

  if (!id) {
    const { data, error } = await db.from(TABLE).insert(cha).select('id').single();
    if (error) {
      if (laTrungKhoa(error)) throw loiTrungNgay(values.ngay);
      throwDbError(error);
    }
    const idMoi = (data as { id: number }).id;
    const con = lanTuForm(idMoi, values);
    if (con.length > 0) {
      const { error: errCon } = await db.from(TABLE_LAN).insert(con);
      if (errCon) {
        await db.from(TABLE).delete().eq('id', idMoi); // không để lại nhật ký rỗng
        throwDbError(errCon);
      }
    }
    return String(idMoi);
  }

  const idSo = toIntId(id);
  const { error: errCha } = await db
    .from(TABLE)
    .update({ ...cha, tg_cap_nhat: new Date().toISOString() })
    .eq('id', idSo);
  if (errCha) {
    if (laTrungKhoa(errCha)) throw loiTrungNgay(values.ngay);
    throwDbError(errCha);
  }

  // Giữ bản cũ của các dòng con để khôi phục nếu chèn lại thất bại (không có transaction phía client).
  const cu = await db
    .from(TABLE_LAN)
    .select('thu_tu,gio,id_hang_hoa,nong_do,don_vi,luong_nuoc_lit,luong_thuoc,ghi_chu')
    .eq('id_nhat_ky', idSo);
  if (cu.error) throwDbError(cu.error);

  const { error: errXoa } = await db.from(TABLE_LAN).delete().eq('id_nhat_ky', idSo);
  if (errXoa) throwDbError(errXoa);

  const con = lanTuForm(idSo, values);
  if (con.length > 0) {
    const { error: errCon } = await db.from(TABLE_LAN).insert(con);
    if (errCon) {
      const cuRows = ((cu.data as Record<string, unknown>[] | null) ?? []).map((r) => ({ ...r, id_nhat_ky: idSo }));
      if (cuRows.length > 0) await db.from(TABLE_LAN).insert(cuRows);
      throwDbError(errCon);
    }
  }
  return id;
}

export async function deleteNhatKyDb(id: string): Promise<void> {
  const { error } = await db.from(TABLE).delete().eq('id', toIntId(id));
  if (error) throwDbError(error);
}

export async function deleteNhatKyManyDb(ids: string[]): Promise<void> {
  const nums = ids.map(Number).filter(Number.isFinite);
  if (nums.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', nums);
  if (error) throwDbError(error);
}

// ── Định mức thuốc theo NSC ───────────────────────────────────────────────

/** Định mức của một NSC (idChiNhanh) hoặc mọi NSC trong phạm vi xem (null). */
export async function getDinhMucDb(
  idChiNhanh: string | null,
  viewAll: boolean,
  allowedBranchIds: string[]
): Promise<DinhMucThuoc[]> {
  const rows = await fetchAllRows<DmRow>((from, to) => {
    let sel = apPhamVi(db.from(TABLE_DM).select(DM_COLUMNS), viewAll, allowedBranchIds);
    if (idChiNhanh) sel = sel.eq('id_chi_nhanh', toIntId(idChiNhanh));
    return sel.order('id_chi_nhanh', { ascending: true }).order('thu_tu', { ascending: true }).order('id').range(from, to);
  });
  return rows.map(dmToModel);
}

function loiTrungDinhMuc(): Error {
  return new Error(i18n.t('nkpc.service.trungDinhMuc'));
}

export async function luuDinhMucDb(id: string | null, v: DinhMucFormValues): Promise<void> {
  const payload = {
    id_chi_nhanh: toIntId(v.id_chi_nhanh),
    id_hang_hoa: toIntId(v.id_hang_hoa),
    nong_do: parseSo(v.nong_do),
    don_vi: v.don_vi,
    dang_dung: v.dang_dung,
    ghi_chu: blank(v.ghi_chu),
  };
  const res = id
    ? await db
        .from(TABLE_DM)
        .update({ ...payload, tg_cap_nhat: new Date().toISOString() })
        .eq('id', toIntId(id))
    : await db.from(TABLE_DM).insert(payload);
  if (res.error) {
    if (laTrungKhoa(res.error)) throw loiTrungDinhMuc();
    throwDbError(res.error);
  }
}

export async function doiDangDungDinhMucDb(id: string, dangDung: boolean): Promise<void> {
  const { error } = await db
    .from(TABLE_DM)
    .update({ dang_dung: dangDung, tg_cap_nhat: new Date().toISOString() })
    .eq('id', toIntId(id));
  if (error) throwDbError(error);
}
