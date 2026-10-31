/**
 * Báo cáo nhân công — DB: fp_farm_bao_cao_nhan_cong + _ct + _ct_sub + _nv (tên theo chuyền)
 * + danh mục fp_var_nhan_vien_so_che.
 */
import { db, fetchAllRows, fetchTablePage, throwDbError, formatDbError, type PaginatedTableResult } from '../../../../lib/db';
import { applyPostgrestSearch } from '../../../../lib/postgrest-search';
import {
  BCNC_SORTABLE_DB_COLUMNS,
  BCNC_SORT_MAC_DINH,
  dieuKienKyTheoNgay,
  type BaoCaoNhanCongListServerQuery,
} from './bao-cao-nhan-cong-list-query';
import i18n from '../../../../lib/i18n';
import type {
  ChamCong,
  FarmBaoCaoNhanCong,
  FarmBaoCaoNhanCongCt,
  FarmBaoCaoNhanCongNv,
  LoaiChuyen,
  TrangThaiBaoCaoNhanCongPhieu,
  VarNhanVienSoChe,
} from '../core/types';
import { TRANG_THAI_BAO_CAO_NHAN_CONG } from '../core/types';
import type { BaoCaoNhanCongFormValues } from '../core/schema';
import type { FarmBaoCaoNhanCongCtSub, LoaiChiTieu } from '../core/ct-sub';
import { LOAI_CHI_TIEU_CODES, groupSubModelsByLoai } from '../core/ct-sub';
import { applySubTotalsToChiTietForm } from '../core/form-mappers';
import { gonTen, khoaTen } from '../../danh-gia-dau-vao/core/chuan-hoa-ten';

const TABLE_CHA = 'fp_farm_bao_cao_nhan_cong';
const TABLE_CT = 'fp_farm_bao_cao_nhan_cong_ct';
const TABLE_CT_SUB = 'fp_farm_bao_cao_nhan_cong_ct_sub';
const TABLE_NV = 'fp_farm_bao_cao_nhan_cong_nv';
const TABLE_DM_NV = 'fp_var_nhan_vien_so_che';

/** List — bỏ hinh_anh_urls (~1.8MB/dòng base64). Ảnh chỉ load khi mở chi tiết (ROW_CHA_DETAIL). */
const ROW_CHA_LIST =
  'id,ngay,id_chi_nhanh,ten_chi_nhanh,ghi_chu,id_nguoi_tao,trang_thai,tg_tao,tg_cap_nhat';

/** Chi tiết / insert / update */
const ROW_CHA_DETAIL =
  'id,ngay,id_chi_nhanh,ten_chi_nhanh,ghi_chu,hinh_anh_urls,id_nguoi_tao,trang_thai,tg_tao,tg_cap_nhat';

const ROW_CT =
  'id,id_bao_cao,loai_chuyen,sl_cong_ngay,sl_cong_nua,sl_tang_ca,so_gio_tc,ghi_chu,thu_tu';

const ROW_CT_SUB =
  'id,id_bcnc_ct,loai_chi_tieu,thu_tu,sl_cong,so_gio,ghi_chu';

const ROW_NV = 'id,id_bcnc_ct,id_nhan_vien,ho_ten,vi_tri,cham_cong,so_gio_cong,so_gio_tc,ghi_chu,thu_tu';

const ROW_DM_NV = 'id,id_chi_nhanh,ho_ten,vi_tri,loai_chuyen,dang_dung,thu_tu';

function parseIdToInt8(id: string | null | undefined): number | null {
  if (id == null || id === '') return null;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

function isUniqueViolation(err: unknown): boolean {
  if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === '23505') {
    return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /23505|duplicate key|unique constraint/i.test(msg);
}

function mapChaInsertUpdateError(err: unknown): Error {
  if (isUniqueViolation(err)) {
    return new Error(i18n.t('baoCaoNhanCong.validation.duplicateNgayChiNhanh'));
  }
  return new Error(formatDbError(err, { resource: TABLE_CHA }));
}

function num(v: string | number | null | undefined): number {
  if (v == null || v === '') return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseHinhAnhUrls(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  }
  return [];
}

interface DbRowCha {
  id: number;
  ngay: string;
  id_chi_nhanh: number | null;
  ten_chi_nhanh: string | null;
  ghi_chu: string | null;
  hinh_anh_urls?: unknown;
  id_nguoi_tao: number | null;
  trang_thai: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

interface DbRowCt {
  id: number;
  id_bao_cao: number;
  loai_chuyen: string;
  sl_cong_ngay: string | number | null;
  sl_cong_nua: string | number | null;
  sl_tang_ca: string | number | null;
  so_gio_tc: string | number | null;
  ghi_chu: string | null;
  thu_tu: number | null;
}

interface DbRowCtSub {
  id: number;
  id_bcnc_ct: number;
  loai_chi_tieu: string;
  thu_tu: number | null;
  sl_cong: string | number | null;
  so_gio: string | number | null;
  ghi_chu: string | null;
}

interface DbRowNv {
  id: number;
  id_bcnc_ct: number;
  id_nhan_vien: number | null;
  ho_ten: string;
  vi_tri: string | null;
  cham_cong: string;
  so_gio_cong: string | number | null;
  so_gio_tc: string | number | null;
  ghi_chu: string | null;
  thu_tu: number | null;
}

interface DbRowDmNv {
  id: number;
  id_chi_nhanh: number;
  ho_ten: string;
  vi_tri: string | null;
  loai_chuyen: string | null;
  dang_dung: boolean;
  thu_tu: number | null;
}

function nvRowToModel(row: DbRowNv): FarmBaoCaoNhanCongNv {
  return {
    id: String(row.id),
    id_bcnc_ct: String(row.id_bcnc_ct),
    id_nhan_vien: row.id_nhan_vien != null ? String(row.id_nhan_vien) : null,
    ho_ten: row.ho_ten,
    vi_tri: row.vi_tri ?? null,
    cham_cong: row.cham_cong as ChamCong,
    so_gio_cong: num(row.so_gio_cong),
    so_gio_tc: num(row.so_gio_tc),
    ghi_chu: row.ghi_chu ?? null,
    thu_tu: row.thu_tu ?? 0,
  };
}

function dmNvRowToModel(row: DbRowDmNv): VarNhanVienSoChe {
  return {
    id: String(row.id),
    id_chi_nhanh: String(row.id_chi_nhanh),
    ho_ten: row.ho_ten,
    vi_tri: row.vi_tri ?? null,
    loai_chuyen: (row.loai_chuyen as LoaiChuyen | null) ?? null,
    dang_dung: !!row.dang_dung,
    thu_tu: row.thu_tu ?? 0,
  };
}

function subRowToModel(row: DbRowCtSub): FarmBaoCaoNhanCongCtSub {
  return {
    id: String(row.id),
    id_bcnc_ct: String(row.id_bcnc_ct),
    loai_chi_tieu: row.loai_chi_tieu as LoaiChiTieu,
    thu_tu: row.thu_tu ?? 0,
    sl_cong: num(row.sl_cong),
    so_gio: num(row.so_gio),
    ghi_chu: row.ghi_chu ?? null,
  };
}

function ctRowToModel(row: DbRowCt, subs: FarmBaoCaoNhanCongCtSub[]): FarmBaoCaoNhanCongCt {
  return {
    id: String(row.id),
    id_bao_cao: String(row.id_bao_cao),
    loai_chuyen: row.loai_chuyen as FarmBaoCaoNhanCongCt['loai_chuyen'],
    sl_cong_ngay: num(row.sl_cong_ngay),
    sl_cong_nua: num(row.sl_cong_nua),
    sl_tang_ca: num(row.sl_tang_ca),
    so_gio_tc: num(row.so_gio_tc),
    ghi_chu: row.ghi_chu ?? null,
    thu_tu: row.thu_tu ?? 0,
    sub_by_loai: groupSubModelsByLoai(subs),
  };
}

function normalizeTrangThaiDb(v: string | null | undefined): TrangThaiBaoCaoNhanCongPhieu {
  return v === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA ? TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA : TRANG_THAI_BAO_CAO_NHAN_CONG.MO;
}

function chaRowToModel(row: DbRowCha, chi: FarmBaoCaoNhanCongCt[], includeHinhAnh = true): FarmBaoCaoNhanCong {
  return {
    id: String(row.id),
    ngay: typeof row.ngay === 'string' ? row.ngay.slice(0, 10) : String(row.ngay),
    id_chi_nhanh: row.id_chi_nhanh != null ? String(row.id_chi_nhanh) : null,
    ten_chi_nhanh: row.ten_chi_nhanh ?? null,
    ghi_chu: row.ghi_chu ?? null,
    hinh_anh_urls: includeHinhAnh ? parseHinhAnhUrls(row.hinh_anh_urls) : [],
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : null,
    ten_nguoi_tao: null,
    trang_thai: normalizeTrangThaiDb(row.trang_thai),
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
    chi_tiet: chi.sort((a, b) => a.thu_tu - b.thu_tu),
  };
}

async function fetchSubForCtIds(ctIds: number[]): Promise<Map<string, FarmBaoCaoNhanCongCtSub[]>> {
  const map = new Map<string, FarmBaoCaoNhanCongCtSub[]>();
  if (ctIds.length === 0) return map;
  const { data, error } = await db.from(TABLE_CT_SUB).select(ROW_CT_SUB).in('id_bcnc_ct', ctIds);
  if (error) throwDbError(error, { resource: `${TABLE_CT_SUB}.select` });
  for (const row of (data ?? []) as DbRowCtSub[]) {
    const key = String(row.id_bcnc_ct);
    const list = map.get(key) ?? [];
    list.push(subRowToModel(row));
    map.set(key, list);
  }
  return map;
}

async function fetchChiTietForIds(ids: string[]): Promise<Map<string, FarmBaoCaoNhanCongCt[]>> {
  const ctMap = new Map<string, FarmBaoCaoNhanCongCt[]>();
  if (ids.length === 0) return ctMap;
  const numIds = ids.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  const { data, error } = await db.from(TABLE_CT).select(ROW_CT).in('id_bao_cao', numIds);
  if (error) throwDbError(error, { resource: `${TABLE_CT}.select` });
  const ctRows = (data ?? []) as DbRowCt[];
  const ctIds = ctRows.map((r) => r.id);
  const subMap = await fetchSubForCtIds(ctIds);
  for (const row of ctRows) {
    const idBaoCao = String(row.id_bao_cao);
    const subs = subMap.get(String(row.id)) ?? [];
    const list = ctMap.get(idBaoCao) ?? [];
    list.push(ctRowToModel(row, subs));
    ctMap.set(idBaoCao, list);
  }
  return ctMap;
}

function subPayloadRows(
  idBcncCt: number,
  sub: BaoCaoNhanCongFormValues['chi_tiet'][number]['sub']
): {
  id_bcnc_ct: number;
  loai_chi_tieu: LoaiChiTieu;
  thu_tu: number;
  sl_cong: number;
  so_gio: number;
  ghi_chu: string | null;
}[] {
  const rows: {
    id_bcnc_ct: number;
    loai_chi_tieu: LoaiChiTieu;
    thu_tu: number;
    sl_cong: number;
    so_gio: number;
    ghi_chu: string | null;
  }[] = [];
  for (const loai of LOAI_CHI_TIEU_CODES) {
    const list = sub?.[loai] ?? [];
    list.forEach((r, i) => {
      const sl = num(r.sl_cong);
      const gio = num(r.so_gio);
      if (sl === 0 && gio === 0 && !(r.ghi_chu?.trim())) return;
      if ((sl > 0) !== (gio > 0)) {
        throw new Error(i18n.t('baoCaoNhanCong.validation.slGioPairRequired'));
      }
      rows.push({
        id_bcnc_ct: idBcncCt,
        loai_chi_tieu: loai,
        thu_tu: i + 1,
        sl_cong: sl,
        so_gio: gio,
        ghi_chu: r.ghi_chu?.trim() || null,
      });
    });
  }
  return rows;
}

async function insertCtAndSub(
  idBaoCao: number,
  idChiNhanh: number | null,
  chiTiet: BaoCaoNhanCongFormValues['chi_tiet']
): Promise<void> {
  const synced = applySubTotalsToChiTietForm(chiTiet);
  const idNvTheoTen = await ganIdNhanVien(idChiNhanh, synced);
  for (let i = 0; i < synced.length; i++) {
    const r = synced[i]!;
    const { data: insertedCt, error: eCt } = await db
      .from(TABLE_CT)
      .insert({
        id_bao_cao: idBaoCao,
        loai_chuyen: r.loai_chuyen,
        sl_cong_ngay: r.sl_cong_ngay ?? 0,
        sl_cong_nua: r.sl_cong_nua ?? 0,
        sl_tang_ca: r.sl_tang_ca ?? 0,
        so_gio_tc: r.so_gio_tc ?? 0,
        ghi_chu: r.ghi_chu ?? null,
        thu_tu: i + 1,
      })
      .select('id')
      .single();
    if (eCt) throwDbError(eCt, { resource: `${TABLE_CT}.insert` });
    const ctId = (insertedCt as { id: number }).id;
    const subRows = subPayloadRows(ctId, r.sub);
    if (subRows.length > 0) {
      const { error: eSub } = await db.from(TABLE_CT_SUB).insert(subRows);
      if (eSub) throwDbError(eSub, { resource: `${TABLE_CT_SUB}.insert` });
    }
    if (r.nhan_vien.length > 0) {
      const nvRows = r.nhan_vien.map((nv, j) => ({
        id_bcnc_ct: ctId,
        id_nhan_vien: idNvTheoTen.get(khoaTen(nv.ho_ten)) ?? null,
        ho_ten: gonTen(nv.ho_ten) ?? nv.ho_ten,
        vi_tri: gonTen(nv.vi_tri),
        cham_cong: nv.cham_cong,
        so_gio_cong: num(nv.so_gio_cong),
        so_gio_tc: num(nv.so_gio_tc),
        ghi_chu: nv.ghi_chu?.trim() || null,
        thu_tu: j + 1,
      }));
      const { error: eNv } = await db.from(TABLE_NV).insert(nvRows);
      if (eNv) throwDbError(eNv, { resource: `${TABLE_NV}.insert` });
    }
  }
}

export async function getAllBaoCaoNhanCongDb(): Promise<FarmBaoCaoNhanCong[]> {
  const { data, error } = await db.from(TABLE_CHA).select(ROW_CHA_LIST).order('ngay', { ascending: false });
  if (error) throwDbError(error, { resource: `${TABLE_CHA}.list` });
  const rows = (data ?? []) as DbRowCha[];
  const ids = rows.map((r) => String(r.id));
  const ctMap = await fetchChiTietForIds(ids);
  return rows.map((r) => chaRowToModel(r, ctMap.get(String(r.id)) ?? [], false));
}

/** Cột text tham gia ô tìm kiếm ở server. */
const BCNC_SEARCH_SPEC = {
  text: ['ten_chi_nhanh', 'ghi_chu', 'trang_thai'],
  numeric: ['id'],
  dates: ['ngay'],
} as const;

/**
 * Một trang danh sách — cha + hai bảng con lấy trong MỘT request nhờ embed của
 * PostgREST, thay vì ba lượt tải toàn bảng như trước.
 *
 * `hinh_anh_urls` vẫn nằm ngoài (ảnh base64 rất nặng, chỉ lấy khi mở chi tiết).
 */
const BCNC_LIST_SELECT = `${ROW_CHA_LIST},${TABLE_CT}(${ROW_CT},${TABLE_CT_SUB}(${ROW_CT_SUB}))`;

/** Phạm vi xem theo chi nhánh — dùng chung cho danh sách và tổng hợp theo ngày. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyBcncPhamViXem(sel: any, viewAll: boolean, allowedBranchIds: string[]): any {
  if (viewAll) return sel;
  const ids = allowedBranchIds.map(Number).filter(Number.isFinite);
  // Không được phép xem chi nhánh nào → trả rỗng, đừng để lọt toàn bộ dữ liệu.
  return ids.length === 0 ? sel.eq('id', -1) : sel.in('id_chi_nhanh', ids);
}

/** Lọc + sắp xếp dùng chung cho trang danh sách và cho lượt tải phục vụ xuất file. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyBcncListQuery(q: any, query: BaoCaoNhanCongListServerQuery): any {
  let sel = applyBcncPhamViXem(q, query.viewAll, query.allowedBranchIds);

  if (query.idChiNhanh.length > 0) {
    sel = sel.in('id_chi_nhanh', query.idChiNhanh.map(Number).filter(Number.isFinite));
  }
  if (query.trangThai.length > 0) sel = sel.in('trang_thai', query.trangThai);

  if (query.ngayFrom) sel = sel.gte('ngay', query.ngayFrom);
  if (query.ngayTo) sel = sel.lte('ngay', query.ngayTo);

  const ky = dieuKienKyTheoNgay(query.nam, query.thang);
  if (ky.length > 0) sel = sel.or(ky.join(','));

  sel = applyPostgrestSearch(sel, query.searchTerm, BCNC_SEARCH_SPEC);

  const dbSortable = query.sortColumn != null && BCNC_SORTABLE_DB_COLUMNS.has(query.sortColumn);
  const sortCol = dbSortable ? query.sortColumn! : BCNC_SORT_MAC_DINH.column;
  const ascending = dbSortable ? query.sortDirection !== 'desc' : BCNC_SORT_MAC_DINH.ascending;

  // Thêm `id` làm khoá phụ: hai phiếu cùng ngày mà thứ tự nhảy giữa các trang thì
  // chuyển trang sẽ lặp hoặc bỏ sót bản ghi.
  return sel.order(sortCol, { ascending }).order('id', { ascending: false });
}

export async function getBaoCaoNhanCongPageDb(
  query: BaoCaoNhanCongListServerQuery
): Promise<PaginatedTableResult<FarmBaoCaoNhanCong>> {
  const result = await fetchTablePage<DbRowChaEmbed>(query.page, query.pageSize, async (from, to) => {
    const sel = applyBcncListQuery(
      db.from(TABLE_CHA).select(BCNC_LIST_SELECT, { count: 'exact' }),
      query
    );
    const res = await sel.range(from, to);
    return { data: (res.data as unknown as DbRowChaEmbed[] | null) ?? null, error: res.error, count: res.count };
  });

  return { ...result, data: result.data.map(embedRowToModel) };
}

/**
 * Toàn bộ bản ghi khớp bộ lọc hiện tại — CHỈ dùng khi người dùng bấm Xuất file.
 * Danh sách trên màn hình luôn đi qua `getBaoCaoNhanCongPageDb`.
 */
export async function fetchAllBaoCaoNhanCongForListQuery(
  query: BaoCaoNhanCongListServerQuery
): Promise<FarmBaoCaoNhanCong[]> {
  const rows = await fetchAllRows<DbRowChaEmbed>((from, to) =>
    applyBcncListQuery(db.from(TABLE_CHA).select(BCNC_LIST_SELECT), query).range(from, to)
  );
  return rows.map(embedRowToModel);
}

/**
 * Mọi phiếu của MỘT ngày kèm chi tiết (embed như danh sách) — tab «Tổng hợp theo ngày».
 * Phạm vi xem lọc y hệt danh sách.
 */
export async function getBaoCaoNhanCongTheoNgayDb(
  ngay: string,
  viewAll: boolean,
  allowedBranchIds: string[]
): Promise<FarmBaoCaoNhanCong[]> {
  const rows = await fetchAllRows<DbRowChaEmbed>((from, to) =>
    applyBcncPhamViXem(db.from(TABLE_CHA).select(BCNC_LIST_SELECT).eq('ngay', ngay), viewAll, allowedBranchIds)
      .order('id', { ascending: true })
      .range(from, to)
  );
  return rows.map(embedRowToModel);
}

/** Bản ghi cha kèm bảng con lồng (embed). */
interface DbRowChaEmbed extends DbRowCha {
  [TABLE_CT]?: (DbRowCt & { [TABLE_CT_SUB]?: DbRowCtSub[] })[];
}

function embedRowToModel(row: DbRowChaEmbed): FarmBaoCaoNhanCong {
  const cts = (row[TABLE_CT] ?? []).map((ct) =>
    ctRowToModel(ct, (ct[TABLE_CT_SUB] ?? []).map(subRowToModel))
  );
  return chaRowToModel(row, cts, false);
}

/**
 * Danh sách TÓM TẮT (6 cột, không bảng con, không ảnh) — phục vụ ba việc cần
 * nhìn toàn bộ dữ liệu chứ không riêng trang đang xem:
 *   1. chip lọc năm / tháng / trạng thái / chi nhánh kèm số đếm,
 *   2. chi nhánh dùng gần nhất của người đang đăng nhập (gợi ý khi thêm phiếu),
 *   3. chặn trùng ngày × chi nhánh trước khi gửi form.
 *
 * Vẫn tải hết bảng nhưng payload nhỏ hơn danh sách cũ hàng chục lần (cũ kèm
 * `ghi_chu` + 2 bảng con qua `.in()` toàn bộ id).
 */
export async function getBaoCaoNhanCongTomTatDb(
  viewAll: boolean,
  allowedBranchIds: string[]
): Promise<BaoCaoNhanCongTomTatRow[]> {
  return fetchAllRows<BaoCaoNhanCongTomTatRow>((from, to) => {
    let sel = db.from(TABLE_CHA).select('id,ngay,trang_thai,id_chi_nhanh,ten_chi_nhanh,id_nguoi_tao,tg_tao');
    if (!viewAll) {
      const ids = allowedBranchIds.map(Number).filter(Number.isFinite);
      sel = ids.length === 0 ? sel.eq('id', -1) : sel.in('id_chi_nhanh', ids);
    }
    return sel.order('ngay', { ascending: false }).range(from, to);
  });
}

export interface BaoCaoNhanCongTomTatRow {
  id: number;
  ngay: string;
  trang_thai: string | null;
  id_chi_nhanh: number | null;
  ten_chi_nhanh: string | null;
  id_nguoi_tao: number | null;
  tg_tao: string | null;
}

export async function getBaoCaoNhanCongByIdDb(id: string): Promise<FarmBaoCaoNhanCong | null> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) return null;
  const { data, error } = await db.from(TABLE_CHA).select(ROW_CHA_DETAIL).eq('id', numId).maybeSingle();
  if (error) throwDbError(error, { resource: `${TABLE_CHA}.byId` });
  if (!data) return null;
  const row = data as DbRowCha;
  const ctMap = await fetchChiTietForIds([String(row.id)]);
  return chaRowToModel(row, await ganNhanVienVaoChiTiet(ctMap.get(String(row.id)) ?? []));
}

/** Chỉ chi tiết phiếu mới tải tên (danh sách / xuất file chỉ cần số). */
async function ganNhanVienVaoChiTiet(ct: FarmBaoCaoNhanCongCt[]): Promise<FarmBaoCaoNhanCongCt[]> {
  const ctIds = ct.map((c) => Number(c.id)).filter((n) => Number.isFinite(n));
  if (ctIds.length === 0) return ct;
  const { data, error } = await db.from(TABLE_NV).select(ROW_NV).in('id_bcnc_ct', ctIds).order('thu_tu');
  if (error) throwDbError(error, { resource: `${TABLE_NV}.select` });
  const theoCt = new Map<string, FarmBaoCaoNhanCongNv[]>();
  for (const r of (data ?? []) as DbRowNv[]) {
    const k = String(r.id_bcnc_ct);
    theoCt.set(k, [...(theoCt.get(k) ?? []), nvRowToModel(r)]);
  }
  return ct.map((c) => ({ ...c, nhan_vien: theoCt.get(c.id) ?? [] }));
}

/** Danh mục nhân viên sơ chế của một chi nhánh (cả người đã bỏ «Đang dùng» — để hiện đúng phiếu cũ). */
export async function getNhanVienSoCheDb(idChiNhanh: string): Promise<VarNhanVienSoChe[]> {
  const idCn = parseIdToInt8(idChiNhanh);
  if (idCn == null) return [];
  const { data, error } = await db
    .from(TABLE_DM_NV)
    .select(ROW_DM_NV)
    .eq('id_chi_nhanh', idCn)
    .order('thu_tu')
    .order('ho_ten');
  if (error) throwDbError(error, { resource: TABLE_DM_NV });
  return ((data ?? []) as DbRowDmNv[]).map(dmNvRowToModel);
}

export async function updateNhanVienSoCheDb(
  id: string,
  patch: Partial<Pick<VarNhanVienSoChe, 'ho_ten' | 'vi_tri' | 'loai_chuyen' | 'dang_dung'>>
): Promise<void> {
  const body: Record<string, unknown> = { ...patch };
  if (patch.ho_ten !== undefined) body.ho_ten = gonTen(patch.ho_ten) ?? '';
  if (patch.vi_tri !== undefined) body.vi_tri = gonTen(patch.vi_tri);
  const { error } = await db.from(TABLE_DM_NV).update(body).eq('id', Number(id));
  if (error) throwDbError(error, { resource: `${TABLE_DM_NV}.update` });
}

type NvTheoChuyen = BaoCaoNhanCongFormValues['chi_tiet'][number];

/**
 * Tên trong phiếu → id danh mục của chi nhánh (không phân biệt hoa thường); tên chưa có thì thêm vào
 * danh mục với vị trí + chuyền của lần gặp đầu (khuôn ganIdLo của Đánh giá đầu vào).
 */
async function ganIdNhanVien(idChiNhanh: number | null, chiTiet: NvTheoChuyen[]): Promise<Map<string, number>> {
  const idTheoTen = new Map<string, number>();
  const ds = chiTiet.flatMap((ct) => ct.nhan_vien.map((nv) => ({ nv, loai: ct.loai_chuyen })));
  if (idChiNhanh == null || ds.length === 0) return idTheoTen;

  const docDanhMuc = async () => {
    const { data, error } = await db.from(TABLE_DM_NV).select('id,ho_ten').eq('id_chi_nhanh', idChiNhanh);
    if (error) throwDbError(error, { resource: TABLE_DM_NV });
    for (const r of (data ?? []) as { id: number; ho_ten: string }[]) idTheoTen.set(khoaTen(r.ho_ten), Number(r.id));
  };
  await docDanhMuc();

  const thieu = new Map<string, { id_chi_nhanh: number; ho_ten: string; vi_tri: string | null; loai_chuyen: string }>();
  for (const { nv, loai } of ds) {
    const k = khoaTen(nv.ho_ten);
    if (k && !idTheoTen.has(k) && !thieu.has(k)) {
      thieu.set(k, { id_chi_nhanh: idChiNhanh, ho_ten: gonTen(nv.ho_ten) ?? nv.ho_ten, vi_tri: gonTen(nv.vi_tri), loai_chuyen: loai });
    }
  }
  if (thieu.size > 0) {
    const { data, error } = await db.from(TABLE_DM_NV).insert([...thieu.values()]).select('id,ho_ten');
    // Người khác vừa thêm cùng tên (UNIQUE chi nhánh + tên) → đọc lại danh mục là đủ.
    if (error && !isUniqueViolation(error)) throwDbError(error, { resource: `${TABLE_DM_NV}.insert` });
    if (error) await docDanhMuc();
    for (const r of (data ?? []) as { id: number; ho_ten: string }[]) idTheoTen.set(khoaTen(r.ho_ten), Number(r.id));
  }
  return idTheoTen;
}

function chaPayloadCreate(values: BaoCaoNhanCongFormValues, idNguoiTao: string | null) {
  return {
    ngay: values.ngay,
    id_chi_nhanh: parseIdToInt8(values.id_chi_nhanh),
    ten_chi_nhanh: values.ten_chi_nhanh?.trim() || null,
    ghi_chu: values.ghi_chu?.trim() || null,
    hinh_anh_urls: values.hinh_anh_urls ?? [],
    id_nguoi_tao: parseIdToInt8(idNguoiTao),
    trang_thai: TRANG_THAI_BAO_CAO_NHAN_CONG.MO,
    tg_cap_nhat: new Date().toISOString(),
  };
}

function chaPayloadUpdate(values: BaoCaoNhanCongFormValues) {
  return {
    ngay: values.ngay,
    id_chi_nhanh: parseIdToInt8(values.id_chi_nhanh),
    ten_chi_nhanh: values.ten_chi_nhanh?.trim() || null,
    ghi_chu: values.ghi_chu?.trim() || null,
    hinh_anh_urls: values.hinh_anh_urls ?? [],
    tg_cap_nhat: new Date().toISOString(),
  };
}

export async function createBaoCaoNhanCongDb(
  values: BaoCaoNhanCongFormValues,
  idNguoiTao: string | null
): Promise<FarmBaoCaoNhanCong> {
  const payload = { ...chaPayloadCreate(values, idNguoiTao), tg_tao: new Date().toISOString() };
  const { data: inserted, error } = await db.from(TABLE_CHA).insert(payload).select(ROW_CHA_DETAIL).single();
  if (error) throw mapChaInsertUpdateError(error);
  const parent = inserted as DbRowCha;
  await insertCtAndSub(parent.id, parseIdToInt8(values.id_chi_nhanh), values.chi_tiet);
  return (await getBaoCaoNhanCongByIdDb(String(parent.id)))!;
}

export async function updateBaoCaoNhanCongDb(
  id: string,
  values: BaoCaoNhanCongFormValues
): Promise<FarmBaoCaoNhanCong> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) throw new Error('Invalid id');
  const { error } = await db.from(TABLE_CHA).update(chaPayloadUpdate(values)).eq('id', numId);
  if (error) throw mapChaInsertUpdateError(error);
  const { error: delErr } = await db.from(TABLE_CT).delete().eq('id_bao_cao', numId);
  if (delErr) throwDbError(delErr, { resource: `${TABLE_CT}.delete` });
  await insertCtAndSub(numId, parseIdToInt8(values.id_chi_nhanh), values.chi_tiet);
  return (await getBaoCaoNhanCongByIdDb(id))!;
}

export async function deleteBaoCaoNhanCongDb(id: string): Promise<void> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) return;
  const { error } = await db.from(TABLE_CHA).delete().eq('id', numId);
  if (error) throwDbError(error, { resource: `${TABLE_CHA}.delete` });
}

export async function deleteBaoCaoNhanCongManyDb(ids: string[]): Promise<void> {
  const numIds = ids.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE_CHA).delete().in('id', numIds);
  if (error) throwDbError(error, { resource: `${TABLE_CHA}.deleteMany` });
}

/**
 * Khóa / mở khóa hàng loạt. Bảng không có log nối thêm nên gộp được thành một UPDATE ... IN —
 * hoặc cả lô thành công, hoặc ném lỗi để UI báo, không có trạng thái dở dang từng phiếu.
 */
export async function updateBaoCaoNhanCongTrangThaiManyDb(
  ids: string[],
  trang_thai: TrangThaiBaoCaoNhanCongPhieu
): Promise<void> {
  const numIds = ids.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  if (numIds.length === 0) return;
  const next =
    trang_thai === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA
      ? TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA
      : TRANG_THAI_BAO_CAO_NHAN_CONG.MO;
  const { error } = await db
    .from(TABLE_CHA)
    .update({ trang_thai: next, tg_cap_nhat: new Date().toISOString() })
    .in('id', numIds);
  if (error) throwDbError(error, { resource: `${TABLE_CHA}.updateTrangThaiMany` });
}

export async function updateBaoCaoNhanCongTrangThaiDb(
  id: string,
  trang_thai: TrangThaiBaoCaoNhanCongPhieu
): Promise<FarmBaoCaoNhanCong> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) throw new Error('Invalid id');
  const next = trang_thai === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA ? TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA : TRANG_THAI_BAO_CAO_NHAN_CONG.MO;
  const { error } = await db
    .from(TABLE_CHA)
    .update({ trang_thai: next, tg_cap_nhat: new Date().toISOString() })
    .eq('id', numId);
  if (error) throwDbError(error, { resource: `${TABLE_CHA}.updateTrangThai` });
  return (await getBaoCaoNhanCongByIdDb(id))!;
}
