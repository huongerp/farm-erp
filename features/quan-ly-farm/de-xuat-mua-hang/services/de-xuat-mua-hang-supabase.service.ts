/**
 * Service phiếu đề xuất vật tư – đọc/ghi Supabase (fp_farm_de_xuat_mua_hang, fp_farm_de_xuat_mua_hang_chi_tiet).
 */
import { db, fetchAllRows, fetchTablePage, type PaginatedTableResult, throwSupabaseError } from '../../../../lib/db';
import type { DeXuatMuaHang, DeXuatMuaHangChiTiet, DeXuatMuaHangChiTietRow } from '../core/types';
import type { DeXuatMuaHangFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { getKhoRef } from '../../../kho-van/danh-sach-kho/services/kho-service';
import { getFarmHangHoaRef } from '../../hang-hoa-phan-thuoc/services/farm-hang-hoa-service';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import type { BranchListScope } from '../../../../lib/branch-scope-query';
import { postgrestQuotedIlikePattern } from '../../../../lib/postgrest-or-ilike';
import type { DeXuatMuaHangChiTietListServerQuery, DeXuatMuaHangListServerQuery } from './de-xuat-mua-hang-list-query';
import type {
  DeXuatMuaHangStatsByTrangThai,
  DeXuatMuaHangStatsSummary,
  StatsChartItem,
} from '../components/stats/useDeXuatMuaHangStats';
import {
  filterKeyToTrangThai,
  TRANG_THAI_DE_XUAT_MUA_HANG,
  trangThaiToI18nKey,
  type TrangThaiFilterKey,
  type TrangThaiDeXuatMuaHang,
} from '../core/constants';

const TABLE_PHIEU = 'fp_farm_de_xuat_mua_hang';
const TABLE_CHI_TIET = 'fp_farm_de_xuat_mua_hang_chi_tiet';
/** View: docs/supabase-v_farm_de_xuat_mua_hang_chi_tiet_flat.sql — JOIN mã/tên HH cho tìm kiếm tab Chi tiết. */
const VIEW_CHI_TIET_FLAT = 'v_farm_de_xuat_mua_hang_chi_tiet_flat';
const RPC_NEXT_SO_PHIEU = 'get_next_so_phieu_farm_de_xuat_mua_hang';

/** View DB: chạy docs/supabase-v_farm_de_xuat_mua_hang_summary.sql; chi tiết đọc VIEW_CHI_TIET_FLAT (script trong docs). */
const VIEW_DE_XUAT_SUMMARY = 'v_farm_de_xuat_mua_hang_summary';

/** Cột view summary (đủ cho `mapDeXuatMuaHangSummaryRowToPhieu`). */
const VIEW_DE_XUAT_SUMMARY_COLUMNS =
  'id,so_phieu,ngay,ngay_can,id_noi_de_xuat,id_nguoi_de_xuat,id_nguoi_duyet,ghi_chu,trang_thai,tg_tao,tg_cap_nhat,so_dong,tong_so_luong,ref_ten_noi_de_xuat,ref_ten_nguoi_de_xuat,ref_ma_nguoi_de_xuat,ref_ten_nguoi_duyet,ref_ma_nguoi_duyet,ref_chi_tiet_tim_kiem,ref_ngay_va_thoi_gian_tim_kiem';

const DE_XUAT_HEADER_SELECT =
  'id, so_phieu, ngay, ngay_can, id_noi_de_xuat, id_nguoi_de_xuat, id_nguoi_duyet, ghi_chu, trang_thai, tg_tao, tg_cap_nhat';

const CHI_TIET_TAB_SELECT =
  'id, id_de_xuat_mua_hang, id_hang_hoa, so_luong, don_vi_tinh, thong_so, ghi_chu, id_tien_do_mh, ten_tien_do_mh, trao_doi, so_phieu, ngay, ngay_can, ten_noi_de_xuat, ten_nguoi_de_xuat, ten_nguoi_duyet, trang_thai_phieu';

export interface NextSoPhieuConfig {
  tien_to_so_phieu: string;
  do_dai_phan_so: number;
}

/** Gọi RPC Supabase lấy số thứ tự tiếp theo, format thành mã phiếu (tiền tố + pad). Nguồn sự thật duy nhất, tránh trùng khi nhiều user. */
export async function getNextSoPhieuDeXuatMuaHangRpc(config: NextSoPhieuConfig): Promise<string> {
  const { data, error } = await db.rpc(RPC_NEXT_SO_PHIEU);
  if (error) throwSupabaseError(error);
  const nextNum = Number(data);
  if (Number.isNaN(nextNum) || nextNum < 1) throw new Error('Invalid next number from RPC');
  const padded = String(nextNum).padStart(config.do_dai_phan_so, '0');
  return `${config.tien_to_so_phieu || ''}${padded}`;
}

type DeXuatMuaHangSummaryRow = PhieuDbRow & {
  so_dong: number;
  tong_so_luong: number | string | null;
  ref_ten_noi_de_xuat?: string | null;
  ref_ten_nguoi_de_xuat?: string | null;
  ref_ma_nguoi_de_xuat?: string | null;
  ref_ten_nguoi_duyet?: string | null;
  ref_ma_nguoi_duyet?: string | null;
  ref_chi_tiet_tim_kiem?: string | null;
  ref_ngay_va_thoi_gian_tim_kiem?: string | null;
};

function mapDeXuatMuaHangSummaryRowToPhieu(row: DeXuatMuaHangSummaryRow): DeXuatMuaHang {
  const phieu = rowToPhieu(row, {
    ten_noi_de_xuat: row.ref_ten_noi_de_xuat ?? undefined,
    ten_nguoi_de_xuat: row.ref_ten_nguoi_de_xuat ?? undefined,
    ma_nguoi_de_xuat: row.ref_ma_nguoi_de_xuat ?? undefined,
    ten_nguoi_duyet: row.ref_ten_nguoi_duyet ?? null,
    ma_nguoi_duyet: row.ref_ma_nguoi_duyet ?? null,
  });
  phieu.tong_so_dong = Number(row.so_dong) || 0;
  phieu.tong_so_luong = Number(row.tong_so_luong) || 0;
  return phieu;
}

interface PhieuDbRow {
  id: number;
  so_phieu: string;
  ngay: string;
  ngay_can: string;
  id_noi_de_xuat: number;
  id_nguoi_de_xuat: number;
  id_nguoi_duyet: number | null;
  ghi_chu: string | null;
  trang_thai: string;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

interface ChiTietDbRow {
  id: number;
  id_de_xuat_mua_hang: number;
  id_hang_hoa: number;
  so_luong: number;
  don_vi_tinh: string | null;
  thong_so: string | null;
  ghi_chu: string | null;
  id_tien_do_mh: number | null;
  ten_tien_do_mh: string | null;
  trao_doi: string | null;
}

/** Hàng đầy đủ từ fp_farm_de_xuat_mua_hang_chi_tiet (có cột kéo từ phiếu). */
interface ChiTietFullDbRow extends ChiTietDbRow {
  so_phieu: string | null;
  ngay: string | null;
  ngay_can: string | null;
  ten_noi_de_xuat: string | null;
  ten_nguoi_de_xuat: string | null;
  ten_nguoi_duyet: string | null;
  trang_thai_phieu: string | null;
}

function toNum(s: string | null | undefined): number | null {
  if (s == null || s === '') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function rowToPhieu(
  row: PhieuDbRow,
  enrich?: { ten_noi_de_xuat?: string; ten_nguoi_de_xuat?: string; ma_nguoi_de_xuat?: string; ten_nguoi_duyet?: string | null; ma_nguoi_duyet?: string | null }
): DeXuatMuaHang {
  return {
    id: String(row.id),
    so_phieu: row.so_phieu ?? '',
    ngay: row.ngay ?? '',
    ngay_can: row.ngay_can ?? '',
    id_noi_de_xuat: String(row.id_noi_de_xuat),
    ten_noi_de_xuat: enrich?.ten_noi_de_xuat,
    id_nguoi_de_xuat: String(row.id_nguoi_de_xuat),
    ten_nguoi_de_xuat: enrich?.ten_nguoi_de_xuat,
    ma_nguoi_de_xuat: enrich?.ma_nguoi_de_xuat,
    id_nguoi_duyet: row.id_nguoi_duyet != null ? String(row.id_nguoi_duyet) : null,
    ten_nguoi_duyet: enrich?.ten_nguoi_duyet ?? null,
    ma_nguoi_duyet: enrich?.ma_nguoi_duyet ?? null,
    ghi_chu: row.ghi_chu ?? undefined,
    trang_thai: (row.trang_thai as DeXuatMuaHang['trang_thai']) || 'Chờ duyệt',
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

function rowToChiTiet(row: ChiTietDbRow, idPhieuStr: string, enrich?: { ma_hang?: string; ten_hang?: string }): DeXuatMuaHangChiTiet {
  return {
    id: String(row.id),
    id_de_xuat_mua_hang: idPhieuStr,
    id_hang_hoa: String(row.id_hang_hoa),
    so_luong: Number(row.so_luong),
    don_vi_tinh: row.don_vi_tinh ?? undefined,
    thong_so: row.thong_so ?? undefined,
    ghi_chu: row.ghi_chu ?? undefined,
    ma_hang: enrich?.ma_hang,
    ten_hang: enrich?.ten_hang,
    id_tien_do_mh: row.id_tien_do_mh != null ? String(row.id_tien_do_mh) : null,
    ten_tien_do_mh: row.ten_tien_do_mh ?? null,
    trao_doi: row.trao_doi ?? null,
  };
}

export async function getAllDeXuatMuaHangSupabase(): Promise<DeXuatMuaHang[]> {
  const rows = await fetchAllRows<DeXuatMuaHangSummaryRow>((from, to) =>
    db
      .from(VIEW_DE_XUAT_SUMMARY)
      .select(VIEW_DE_XUAT_SUMMARY_COLUMNS)
      .order('ngay', { ascending: false })
      .order('so_phieu', { ascending: false })
      .range(from, to)
  );
  return rows.map((row) => mapDeXuatMuaHangSummaryRowToPhieu(row));
}

export type DeXuatMuaHangStatsRpcResult = {
  summary: DeXuatMuaHangStatsSummary;
  byTrangThai: DeXuatMuaHangStatsByTrangThai[];
  byNoiDeXuat: StatsChartItem[];
  byNguoiDeXuat: StatsChartItem[];
  byNguoiDuyet: StatsChartItem[];
  byMonth: StatsChartItem[];
  chipByStatusKey: Record<string, number>;
  chipByNoiDeXuatId: Record<string, number>;
  chipByNguoiDeXuatId: Record<string, number>;
  chipByNguoiDuyetId: Record<string, number>;
};

/** Thống kê server-side — @see docs/supabase-rpc_farm_de_xuat_mua_hang_stats.sql */
export async function fetchDeXuatMuaHangStatsFromRpc(params: {
  dateFrom: string;
  dateTo: string;
  filterStatus: string[];
  filterNoiDeXuat: string[];
  filterNguoiDeXuat: string[];
  filterNguoiDuyet: string[];
  scopeNoiDeXuatIds?: number[];
}): Promise<DeXuatMuaHangStatsRpcResult | null> {
  const toDate = (s: string) => (s?.trim() ? s.trim().slice(0, 10) : null);
  const trangThai = params.filterStatus.map((k) => filterKeyToTrangThai(k as TrangThaiFilterKey));
  const noiNums = params.filterNoiDeXuat.map(Number).filter((n) => !Number.isNaN(n));
  let noiIds = noiNums.length ? noiNums : null;
  if (params.scopeNoiDeXuatIds != null) {
    const scopeSet = new Set(params.scopeNoiDeXuatIds);
    if (noiIds?.length) {
      noiIds = noiIds.filter((id) => scopeSet.has(id));
    } else {
      noiIds = [...scopeSet];
    }
    if (noiIds.length === 0) {
      return {
        summary: { total: 0, pending: 0, waiting: 0, approved: 0, rejected: 0 },
        byTrangThai: TRANG_THAI_DE_XUAT_MUA_HANG.map((s) => ({
          id: s,
          ten: `status.${trangThaiToI18nKey(s)}`,
          count: 0,
        })),
        byNoiDeXuat: [],
        byNguoiDeXuat: [],
        byNguoiDuyet: [],
        byMonth: [],
        chipByStatusKey: {},
        chipByNoiDeXuatId: {},
        chipByNguoiDeXuatId: {},
        chipByNguoiDuyetId: {},
      };
    }
  }
  const deXuatNums = params.filterNguoiDeXuat.map(Number).filter((n) => !Number.isNaN(n));
  const duyetNums = params.filterNguoiDuyet.map(Number).filter((n) => !Number.isNaN(n));

  const { data, error } = await db.rpc('rpc_farm_de_xuat_mua_hang_stats', {
    p_date_from: toDate(params.dateFrom),
    p_date_to: toDate(params.dateTo),
    p_trang_thai: trangThai.length ? trangThai : null,
    p_id_noi_de_xuat: noiIds,
    p_id_nguoi_de_xuat: deXuatNums.length ? deXuatNums : null,
    p_id_nguoi_duyet: duyetNums.length ? duyetNums : null,
  });
  if (error || data == null || typeof data !== 'object') return null;
  const j = data as {
    summary?: DeXuatMuaHangStatsSummary;
    byTrangThai?: { id: string; count: number }[];
    byNoiDeXuat?: StatsChartItem[];
    byNguoiDeXuat?: StatsChartItem[];
    byNguoiDuyet?: StatsChartItem[];
    byMonth?: StatsChartItem[];
    chipByStatusKey?: Record<string, number>;
    chipByNoiDeXuatId?: Record<string, number>;
    chipByNguoiDeXuatId?: Record<string, number>;
    chipByNguoiDuyetId?: Record<string, number>;
  };
  if (!j.summary) return null;
  const summary: DeXuatMuaHangStatsSummary = {
    total: j.summary.total ?? 0,
    pending: j.summary.pending ?? 0,
    waiting: j.summary.waiting ?? 0,
    approved: j.summary.approved ?? 0,
    rejected: j.summary.rejected ?? 0,
  };
  const byTrangThai: DeXuatMuaHangStatsByTrangThai[] = (
    ['Pending', 'Waiting', 'Approved', 'Rejected'] as const
  ).map((key) => {
    const row = j.byTrangThai?.find((r) => r.id === key);
    return {
      id: key,
      ten: `status.${key === 'Pending' ? 'pending' : key === 'Waiting' ? 'waiting' : key === 'Approved' ? 'approved' : 'rejected'}`,
      count: row?.count ?? 0,
    };
  });
  return {
    summary,
    byTrangThai,
    byNoiDeXuat: j.byNoiDeXuat ?? [],
    byNguoiDeXuat: j.byNguoiDeXuat ?? [],
    byNguoiDuyet: j.byNguoiDuyet ?? [],
    byMonth: j.byMonth ?? [],
    chipByStatusKey: j.chipByStatusKey ?? {},
    chipByNoiDeXuatId: j.chipByNoiDeXuatId ?? {},
    chipByNguoiDeXuatId: j.chipByNguoiDeXuatId ?? {},
    chipByNguoiDuyetId: j.chipByNguoiDuyetId ?? {},
  };
}

const DE_XUAT_PAGE_SIZE_DEFAULT = 50;
const IMPOSSIBLE_NUM_ID = -2147483647;
const PHIEU_ID_IN_CHUNK = 200;

function chunkNumericIds(ids: number[], size: number): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyDeXuatMuaHangHeaderScope(q: any, scope: BranchListScope): any {
  const b = q;
  if (scope.viewAll) return b;
  const own = scope.ownEmployeeIdNum;
  if (!scope.viewByBranch) {
    if (own != null) return b.eq('id_nguoi_de_xuat', own);
    return b.eq('id', IMPOSSIBLE_NUM_ID);
  }
  const ids = scope.allowedKhoNumericIds;
  const parts: string[] = [];
  if (own != null) parts.push(`id_nguoi_de_xuat.eq.${own}`);
  if (ids.length > 0) {
    const inl = `(${ids.join(',')})`;
    parts.push(`id_noi_de_xuat.in.${inl}`);
  }
  if (parts.length === 0) return b.eq('id', IMPOSSIBLE_NUM_ID);
  return b.or(parts.join(','));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyDeXuatMuaHangListQuery(q: any, query: DeXuatMuaHangListServerQuery): any {
  let b = applyDeXuatMuaHangHeaderScope(q, query.scope);
  if (query.trangThaiViet.length) b = b.in('trang_thai', query.trangThaiViet);
  if (query.ngayFrom) b = b.gte('ngay', query.ngayFrom);
  if (query.ngayTo) b = b.lte('ngay', query.ngayTo);
  if (query.idNoiDeXuat.length) b = b.in('id_noi_de_xuat', query.idNoiDeXuat);
  if (query.idNguoiDeXuat.length) b = b.in('id_nguoi_de_xuat', query.idNguoiDeXuat);
  if (query.idNguoiDuyet.length) b = b.in('id_nguoi_duyet', query.idNguoiDuyet);
  const term = (query.searchTerm ?? '').trim();
  if (term) {
    const esc = term.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const pat = postgrestQuotedIlikePattern(`%${esc}%`);
    const parts = [
      `so_phieu.ilike.${pat}`,
      `ghi_chu.ilike.${pat}`,
      `trang_thai.ilike.${pat}`,
      `ref_ten_noi_de_xuat.ilike.${pat}`,
      `ref_ten_nguoi_de_xuat.ilike.${pat}`,
      `ref_ma_nguoi_de_xuat.ilike.${pat}`,
      `ref_ten_nguoi_duyet.ilike.${pat}`,
      `ref_ma_nguoi_duyet.ilike.${pat}`,
      `ref_chi_tiet_tim_kiem.ilike.${pat}`,
      `ref_ngay_va_thoi_gian_tim_kiem.ilike.${pat}`,
    ];
    if (/^\d+$/.test(term)) {
      const n = Number(term);
      if (Number.isSafeInteger(n)) parts.push(`id.eq.${n}`);
    }
    b = b.or(parts.join(','));
  }
  return b;
}

async function fetchPhieuIdsMatchingScope(scope: BranchListScope): Promise<number[]> {
  const rows = await fetchAllRows<{ id: number }>((from, to) => {
    const base = db.from(VIEW_DE_XUAT_SUMMARY).select('id');
    const scoped = applyDeXuatMuaHangHeaderScope(base, scope);
    return scoped.order('id', { ascending: true }).range(from, to);
  });
  return rows.map((r) => r.id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPhieuIdConstraint(q: any, phieuIds: number[] | null): any {
  if (phieuIds == null) return q;
  if (phieuIds.length === 0) return q.eq('id', IMPOSSIBLE_NUM_ID);
  if (phieuIds.length <= PHIEU_ID_IN_CHUNK) return q.in('id_de_xuat_mua_hang', phieuIds);
  const parts = chunkNumericIds(phieuIds, PHIEU_ID_IN_CHUNK).map(
    (ch) => `id_de_xuat_mua_hang.in.(${ch.join(',')})`
  );
  return q.or(parts.join(','));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyDeXuatMuaHangChiTietRowFilters(q: any, query: DeXuatMuaHangChiTietListServerQuery): any {
  let b = q;
  if (query.trangThaiPhieuViet.length) b = b.in('trang_thai_phieu', query.trangThaiPhieuViet);
  if (query.ngayFrom) b = b.gte('ngay', query.ngayFrom);
  if (query.ngayTo) b = b.lte('ngay', query.ngayTo);
  if (query.tenNoiDeXuat.length) b = b.in('ten_noi_de_xuat', query.tenNoiDeXuat);
  if (query.tenNguoiDeXuat.length) b = b.in('ten_nguoi_de_xuat', query.tenNguoiDeXuat);
  if (query.tenNguoiDuyet.length) b = b.in('ten_nguoi_duyet', query.tenNguoiDuyet);
  if (query.tenTienDoMh.length) b = b.in('ten_tien_do_mh', query.tenTienDoMh);
  const term = (query.searchTerm ?? '').trim();
  if (term) {
    const esc = term.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const pat = postgrestQuotedIlikePattern(`%${esc}%`);
    const parts = [
      `so_phieu.ilike.${pat}`,
      `ghi_chu.ilike.${pat}`,
      `thong_so.ilike.${pat}`,
      `ten_noi_de_xuat.ilike.${pat}`,
      `ten_nguoi_de_xuat.ilike.${pat}`,
      `ten_nguoi_duyet.ilike.${pat}`,
      `ten_tien_do_mh.ilike.${pat}`,
      `trao_doi.ilike.${pat}`,
      `don_vi_tinh.ilike.${pat}`,
      `trang_thai_phieu.ilike.${pat}`,
      `ref_ma_hang_hoa.ilike.${pat}`,
      `ref_ten_hang_hoa.ilike.${pat}`,
    ];
    if (/^\d+$/.test(term)) {
      const n = Number(term);
      if (Number.isSafeInteger(n)) {
        parts.push(`id.eq.${n}`, `id_de_xuat_mua_hang.eq.${n}`, `id_hang_hoa.eq.${n}`);
      }
    }
    b = b.or(parts.join(','));
  }
  return b;
}

export async function getDeXuatMuaHangPageSupabase(
  page: number,
  pageSize: number = DE_XUAT_PAGE_SIZE_DEFAULT,
  listQuery?: DeXuatMuaHangListServerQuery
): Promise<PaginatedTableResult<DeXuatMuaHang>> {
  const pageResult = await fetchTablePage<DeXuatMuaHangSummaryRow>(page, pageSize, async (from, to) => {
    let sel = db.from(VIEW_DE_XUAT_SUMMARY).select(VIEW_DE_XUAT_SUMMARY_COLUMNS, { count: 'exact' });
    if (listQuery) sel = applyDeXuatMuaHangListQuery(sel, listQuery);
    const res = await sel.order('ngay', { ascending: false }).order('so_phieu', { ascending: false }).range(from, to);
    return { data: res.data as DeXuatMuaHangSummaryRow[] | null, error: res.error, count: res.count };
  });
  const data = pageResult.data.map((row) => mapDeXuatMuaHangSummaryRowToPhieu(row));
  return { data, totalCount: pageResult.totalCount, page: pageResult.page, pageSize: pageResult.pageSize };
}

export async function fetchAllDeXuatMuaHangForListQuerySupabase(
  listQuery: DeXuatMuaHangListServerQuery,
  pageSize = 500,
  maxRows = 25000
): Promise<DeXuatMuaHang[]> {
  const out: DeXuatMuaHang[] = [];
  let page = 0;
  while (out.length < maxRows) {
    const { data, totalCount } = await getDeXuatMuaHangPageSupabase(page, pageSize, listQuery);
    out.push(...data);
    if (data.length === 0 || out.length >= totalCount) break;
    page += 1;
  }
  return out;
}

export async function getDeXuatMuaHangByIdSupabase(id: string): Promise<DeXuatMuaHang | null> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await db
    .from(TABLE_PHIEU)
    .select(DE_XUAT_HEADER_SELECT)
    .eq('id', idNum)
    .maybeSingle();
  if (error) throwSupabaseError(error);
  if (!row) return null;

  const [khoList, employees, ctRows, hangHoaList] = await Promise.all([
    getKhoRef(),
    getEmployeesRef(),
    db
      .from(TABLE_CHI_TIET)
      .select('id, id_de_xuat_mua_hang, id_hang_hoa, so_luong, don_vi_tinh, thong_so, ghi_chu, id_tien_do_mh, ten_tien_do_mh, trao_doi')
      .eq('id_de_xuat_mua_hang', idNum)
      .order('id', { ascending: true })
      .then((r) => r.data ?? []),
    getFarmHangHoaRef(),
  ]);
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => {
    khoMap[k.id] = k.ten_kho;
  });
  const nvMap: Record<string, { ho_ten: string; ma_nhan_vien: string }> = {};
  employees.forEach((e) => {
    nvMap[e.id] = { ho_ten: e.ho_ten, ma_nhan_vien: e.ma_nhan_vien ?? '' };
  });
  const hangHoaMap: Record<string, { ma_hang: string; ten_hang: string }> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = { ma_hang: h.ma_hang ?? h.ma_hang_hoa ?? '', ten_hang: h.ten_hang_hoa ?? h.ten_hang ?? '' };
  });

  const p = row as PhieuDbRow;
  const ten_noi_de_xuat = khoMap[String(p.id_noi_de_xuat)];
  const ten_nguoi_de_xuat = nvMap[String(p.id_nguoi_de_xuat)]?.ho_ten;
  const ma_nguoi_de_xuat = nvMap[String(p.id_nguoi_de_xuat)]?.ma_nhan_vien;
  const ten_nguoi_duyet = p.id_nguoi_duyet != null ? nvMap[String(p.id_nguoi_duyet)]?.ho_ten ?? null : null;
  const ma_nguoi_duyet = p.id_nguoi_duyet != null ? nvMap[String(p.id_nguoi_duyet)]?.ma_nhan_vien ?? null : null;
  const phieu = rowToPhieu(p, { ten_noi_de_xuat, ten_nguoi_de_xuat, ma_nguoi_de_xuat, ten_nguoi_duyet, ma_nguoi_duyet });

  const chi_tiet: DeXuatMuaHangChiTiet[] = (ctRows as ChiTietDbRow[]).map((ct) => {
    const enrich = hangHoaMap[String(ct.id_hang_hoa)];
    return rowToChiTiet(ct, id, enrich);
  });
  phieu.chi_tiet = chi_tiet;
  phieu.tong_so_dong = chi_tiet.length;
  phieu.tong_so_luong = chi_tiet.reduce((s, c) => s + (Number(c.so_luong) || 0), 0);
  return phieu;
}

export async function createDeXuatMuaHangSupabase(data: DeXuatMuaHangFormValues): Promise<DeXuatMuaHang> {
  const soPhieu = data.so_phieu.trim();
  const { data: existing } = await db.from(TABLE_PHIEU).select('id').eq('so_phieu', soPhieu).maybeSingle();
  if (existing) throw new Error(i18n.t('deXuatMuaHang.service.duplicateCode'));

  const payload = {
    so_phieu: soPhieu,
    ngay: data.ngay.trim(),
    ngay_can: data.ngay_can.trim(),
    id_noi_de_xuat: Number(data.id_noi_de_xuat),
    id_nguoi_de_xuat: Number(data.id_nguoi_de_xuat),
    id_nguoi_duyet: toNum(data.id_nguoi_duyet),
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai,
  };

  const { data: inserted, error } = await db.from(TABLE_PHIEU).insert(payload).select(DE_XUAT_HEADER_SELECT).single();
  if (error) throwSupabaseError(error);
  const idPhieu = (inserted as PhieuDbRow).id;
  const idStr = String(idPhieu);

  const [hangHoaList, khoList, employees] = await Promise.all([
    getFarmHangHoaRef(),
    getKhoRef(),
    getEmployeesRef(),
  ]);
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = h.don_vi_tinh ?? '';
  });
  const tenNoiDeXuat = khoList.find((k) => String(k.id) === String(data.id_noi_de_xuat))?.ten_kho ?? null;
  const tenNguoiDeXuat = employees.find((e) => String(e.id) === String(data.id_nguoi_de_xuat))?.ho_ten ?? null;
  const tenNguoiDuyet = data.id_nguoi_duyet
    ? (employees.find((e) => String(e.id) === String(data.id_nguoi_duyet))?.ho_ten ?? null)
    : null;

  const chiTietPayload = (data.chi_tiet ?? []).filter((ct) => ct.id_hang_hoa?.trim() && Number(ct.so_luong) > 0);
  if (chiTietPayload.length > 0) {
    const ctRows = chiTietPayload.map((c) => ({
      id_de_xuat_mua_hang: idPhieu,
      id_hang_hoa: Number(c.id_hang_hoa),
      so_luong: Number(c.so_luong),
      don_vi_tinh: hangHoaMap[c.id_hang_hoa.trim()] ?? null,
      thong_so: c.thong_so?.trim() || null,
      ghi_chu: c.ghi_chu?.trim() || null,
      id_tien_do_mh: c.id_tien_do_mh ? Number(c.id_tien_do_mh) : null,
      ten_tien_do_mh: c.ten_tien_do_mh?.trim() || null,
      trao_doi: c.trao_doi?.trim() || null,
      so_phieu: soPhieu,
      ngay: data.ngay.trim() || null,
      ngay_can: data.ngay_can.trim() || null,
      ten_noi_de_xuat: tenNoiDeXuat,
      ten_nguoi_de_xuat: tenNguoiDeXuat,
      ten_nguoi_duyet: tenNguoiDuyet,
      trang_thai_phieu: data.trang_thai,
    }));
    const { error: errCt } = await db.from(TABLE_CHI_TIET).insert(ctRows);
    if (errCt) throwSupabaseError(errCt);
  }

  const got = await getDeXuatMuaHangByIdSupabase(idStr);
  if (!got) throw new Error(i18n.t('deXuatMuaHang.service.notFound'));
  return got;
}

export async function updateDeXuatMuaHangSupabase(id: string, data: DeXuatMuaHangFormValues): Promise<DeXuatMuaHang> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('deXuatMuaHang.service.notFound'));

  const { data: oldRow, error: fetchErr } = await db.from(TABLE_PHIEU).select(DE_XUAT_HEADER_SELECT).eq('id', idNum).maybeSingle();
  if (fetchErr || !oldRow) throw new Error(i18n.t('deXuatMuaHang.service.notFound'));

  const soPhieu = data.so_phieu.trim();
  const { data: other } = await db.from(TABLE_PHIEU).select('id').eq('so_phieu', soPhieu).neq('id', idNum).maybeSingle();
  if (other) throw new Error(i18n.t('deXuatMuaHang.service.duplicateCode'));

  const payload = {
    so_phieu: soPhieu,
    ngay: data.ngay.trim(),
    ngay_can: data.ngay_can.trim(),
    id_noi_de_xuat: Number(data.id_noi_de_xuat),
    id_nguoi_de_xuat: Number(data.id_nguoi_de_xuat),
    id_nguoi_duyet: toNum(data.id_nguoi_duyet),
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai,
  };

  const { error: updateErr } = await db.from(TABLE_PHIEU).update(payload).eq('id', idNum);
  if (updateErr) throwSupabaseError(updateErr);

  await db.from(TABLE_CHI_TIET).delete().eq('id_de_xuat_mua_hang', idNum);

  const [hangHoaList, khoList, employees] = await Promise.all([
    getFarmHangHoaRef(),
    getKhoRef(),
    getEmployeesRef(),
  ]);
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = h.don_vi_tinh ?? '';
  });
  const tenNoiDeXuat = khoList.find((k) => String(k.id) === String(data.id_noi_de_xuat))?.ten_kho ?? null;
  const tenNguoiDeXuat = employees.find((e) => String(e.id) === String(data.id_nguoi_de_xuat))?.ho_ten ?? null;
  const tenNguoiDuyet = data.id_nguoi_duyet
    ? (employees.find((e) => String(e.id) === String(data.id_nguoi_duyet))?.ho_ten ?? null)
    : null;

  const chiTietPayload = (data.chi_tiet ?? []).filter((ct) => ct.id_hang_hoa?.trim() && Number(ct.so_luong) > 0);
  if (chiTietPayload.length > 0) {
    const ctRows = chiTietPayload.map((c) => ({
      id_de_xuat_mua_hang: idNum,
      id_hang_hoa: Number(c.id_hang_hoa),
      so_luong: Number(c.so_luong),
      don_vi_tinh: hangHoaMap[c.id_hang_hoa.trim()] ?? null,
      thong_so: c.thong_so?.trim() || null,
      ghi_chu: c.ghi_chu?.trim() || null,
      id_tien_do_mh: c.id_tien_do_mh ? Number(c.id_tien_do_mh) : null,
      ten_tien_do_mh: c.ten_tien_do_mh?.trim() || null,
      trao_doi: c.trao_doi?.trim() || null,
      so_phieu: soPhieu,
      ngay: data.ngay.trim() || null,
      ngay_can: data.ngay_can.trim() || null,
      ten_noi_de_xuat: tenNoiDeXuat,
      ten_nguoi_de_xuat: tenNguoiDeXuat,
      ten_nguoi_duyet: tenNguoiDuyet,
      trang_thai_phieu: data.trang_thai,
    }));
    const { error: errCt } = await db.from(TABLE_CHI_TIET).insert(ctRows);
    if (errCt) throwSupabaseError(errCt);
  }

  const got = await getDeXuatMuaHangByIdSupabase(id);
  if (!got) throw new Error(i18n.t('deXuatMuaHang.service.notFound'));
  return got;
}

export async function deleteDeXuatMuaHangSupabase(id: string): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('deXuatMuaHang.service.notFound'));
  const { error } = await db.from(TABLE_PHIEU).delete().eq('id', idNum);
  if (error) throwSupabaseError(error);
}

export interface UpdateDeXuatMuaHangTrangThaiOptions {
  /** Ghi chú duyệt, được nối vào cột ghi_chu sẵn có kèm tiền tố. */
  ghi_chu?: string;
  notePrefix?: string;
  id_nguoi_duyet?: string | null;
}

export interface UpdateDeXuatMuaHangTrangThaiManyResult {
  okIds: string[];
  failed: { id: string; message: string }[];
}

function mergeGhiChuDuyet(existing: string | null | undefined, options?: UpdateDeXuatMuaHangTrangThaiOptions) {
  const noteText = options?.ghi_chu?.trim();
  if (!noteText) return existing || null;
  return (existing ? existing + '\n' : '') + `${options?.notePrefix ?? ''}${noteText}`;
}

/**
 * Đổi riêng trạng thái duyệt — KHÔNG đụng bảng chi tiết.
 *
 * Trước đây duyệt đi qua `updateDeXuatMuaHangSupabase` (ghi lại cả phiếu + xoá/chèn lại toàn
 * bộ dòng chi tiết) chỉ để đổi một cột; duyệt lẻ và duyệt hàng loạt đều dùng hàm này thay thế.
 */
export async function updateDeXuatMuaHangTrangThaiSupabase(
  id: string,
  trang_thai: TrangThaiDeXuatMuaHang,
  options?: UpdateDeXuatMuaHangTrangThaiOptions
): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('deXuatMuaHang.service.notFound'));

  const { data: row, error: fetchErr } = await db
    .from(TABLE_PHIEU)
    .select('ghi_chu')
    .eq('id', idNum)
    .maybeSingle();
  if (fetchErr || !row) throw new Error(i18n.t('deXuatMuaHang.service.notFound'));

  const payload: Record<string, unknown> = {
    trang_thai,
    ghi_chu: mergeGhiChuDuyet((row as { ghi_chu?: string | null }).ghi_chu, options),
  };
  if (options?.id_nguoi_duyet !== undefined) payload.id_nguoi_duyet = toNum(options.id_nguoi_duyet);

  const { error } = await db.from(TABLE_PHIEU).update(payload).eq('id', idNum);
  if (error) throwSupabaseError(error);
}

/**
 * Duyệt hàng loạt. Ghi chú duyệt nối vào cột `ghi_chu` vốn khác nhau từng phiếu nên không gộp
 * được thành một `update().in()`: gom ghi chú cũ bằng 1 SELECT, PATCH tuần tự và gom lỗi thay vì
 * dừng cả lô.
 */
export async function updateDeXuatMuaHangTrangThaiManySupabase(
  ids: string[],
  trang_thai: TrangThaiDeXuatMuaHang,
  options?: UpdateDeXuatMuaHangTrangThaiOptions
): Promise<UpdateDeXuatMuaHangTrangThaiManyResult> {
  const numIds = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return { okIds: [], failed: [] };

  const { data, error: selErr } = await db.from(TABLE_PHIEU).select('id,ghi_chu').in('id', numIds);
  if (selErr) throwSupabaseError(selErr);
  const ghiChuById = new Map<number, string | null>();
  ((data ?? []) as { id: number; ghi_chu?: string | null }[]).forEach((row) => {
    ghiChuById.set(Number(row.id), row.ghi_chu ?? null);
  });

  const okIds: string[] = [];
  const failed: { id: string; message: string }[] = [];

  for (const idNum of numIds) {
    try {
      const payload: Record<string, unknown> = {
        trang_thai,
        ghi_chu: mergeGhiChuDuyet(ghiChuById.get(idNum), options),
      };
      if (options?.id_nguoi_duyet !== undefined) payload.id_nguoi_duyet = toNum(options.id_nguoi_duyet);
      const { error } = await db.from(TABLE_PHIEU).update(payload).eq('id', idNum);
      if (error) throwSupabaseError(error);
      okIds.push(String(idNum));
    } catch (err) {
      failed.push({ id: String(idNum), message: err instanceof Error ? err.message : String(err) });
    }
  }

  return { okIds, failed };
}

export async function deleteDeXuatMuaHangManySupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE_PHIEU).delete().in('id', numIds);
  if (error) throwSupabaseError(error);
}

/** Map DB chi tiết + ref → dòng tab Chi tiết. */
async function mapDeXuatMuaHangChiTietDbRowsToRows(rows: ChiTietFullDbRow[]): Promise<DeXuatMuaHangChiTietRow[]> {
  if (rows.length === 0) return [];
  const [hangHoaList, khoList, employees] = await Promise.all([getFarmHangHoaRef(), getKhoRef(), getEmployeesRef()]);

  const phieuIds = [...new Set(rows.map((r) => r.id_de_xuat_mua_hang))];
  const phieuRows: PhieuDbRow[] = [];
  if (phieuIds.length > 0) {
    const { data: phieuData } = await db.from(TABLE_PHIEU).select(DE_XUAT_HEADER_SELECT).in('id', phieuIds);
    if (phieuData) phieuRows.push(...(phieuData as PhieuDbRow[]));
  }
  const nvMap: Record<string, { ho_ten: string }> = {};
  employees.forEach((e) => {
    nvMap[String(e.id)] = { ho_ten: e.ho_ten ?? '' };
  });
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => {
    khoMap[String(k.id)] = k.ten_kho ?? '';
  });
  const phieuEnrich: Record<
    number,
    { so_phieu: string; ngay: string; ngay_can: string; ten_noi_de_xuat: string; ten_nguoi_de_xuat: string; ten_nguoi_duyet: string | null; trang_thai_phieu: string }
  > = {};
  phieuRows.forEach((p) => {
    phieuEnrich[p.id] = {
      so_phieu: p.so_phieu ?? '',
      ngay: p.ngay ?? '',
      ngay_can: p.ngay_can ?? '',
      ten_noi_de_xuat: khoMap[String(p.id_noi_de_xuat)] ?? '',
      ten_nguoi_de_xuat: nvMap[String(p.id_nguoi_de_xuat)]?.ho_ten ?? '',
      ten_nguoi_duyet: p.id_nguoi_duyet != null ? (nvMap[String(p.id_nguoi_duyet)]?.ho_ten ?? null) : null,
      trang_thai_phieu: p.trang_thai ?? '',
    };
  });

  const hangHoaMap: Record<string, { ma_hang: string; ten_hang: string }> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = { ma_hang: h.ma_hang ?? h.ma_hang_hoa ?? '', ten_hang: h.ten_hang_hoa ?? h.ten_hang ?? '' };
  });
  return rows.map((row) => {
    const enrich = hangHoaMap[String(row.id_hang_hoa)];
    const ct = row as ChiTietDbRow;
    const full = row as ChiTietFullDbRow;
    const fromPhieu = phieuEnrich[row.id_de_xuat_mua_hang];
    return {
      id: String(row.id),
      id_de_xuat_mua_hang: String(row.id_de_xuat_mua_hang),
      so_phieu: full.so_phieu ?? fromPhieu?.so_phieu ?? null,
      ngay: full.ngay ?? fromPhieu?.ngay ?? null,
      ngay_can: full.ngay_can ?? fromPhieu?.ngay_can ?? null,
      ten_noi_de_xuat: full.ten_noi_de_xuat ?? fromPhieu?.ten_noi_de_xuat ?? null,
      ten_nguoi_de_xuat: full.ten_nguoi_de_xuat ?? fromPhieu?.ten_nguoi_de_xuat ?? null,
      ten_nguoi_duyet: full.ten_nguoi_duyet ?? fromPhieu?.ten_nguoi_duyet ?? null,
      trang_thai_phieu: full.trang_thai_phieu ?? fromPhieu?.trang_thai_phieu ?? null,
      id_hang_hoa: String(row.id_hang_hoa),
      ma_hang: enrich?.ma_hang,
      ten_hang: enrich?.ten_hang,
      so_luong: Number(row.so_luong),
      don_vi_tinh: row.don_vi_tinh ?? null,
      thong_so: row.thong_so ?? null,
      ghi_chu: row.ghi_chu ?? null,
      id_tien_do_mh: ct.id_tien_do_mh != null ? String(ct.id_tien_do_mh) : null,
      ten_tien_do_mh: ct.ten_tien_do_mh ?? null,
      trao_doi: ct.trao_doi ?? null,
    };
  });
}

/** Lấy toàn bộ dòng chi tiết từ bảng fp_farm_de_xuat_mua_hang_chi_tiet (phục vụ tab Chi tiết). Làm giàu ten_noi_de_xuat, ten_nguoi_de_xuat, ten_nguoi_duyet từ phiếu nếu chi tiết chưa có. */
export async function getAllDeXuatMuaHangChiTietSupabase(): Promise<DeXuatMuaHangChiTietRow[]> {
  const rows = await fetchAllRows<ChiTietFullDbRow>((from, to) =>
    db
      .from(VIEW_CHI_TIET_FLAT)
      .select(CHI_TIET_TAB_SELECT)
      .order('id_de_xuat_mua_hang', { ascending: false })
      .order('id', { ascending: true })
      .range(from, to)
  );
  return mapDeXuatMuaHangChiTietDbRowsToRows(rows);
}

const CHI_TIET_DE_XUAT_MH_PAGE_SIZE_DEFAULT = 100;

/** Một trang chi tiết đề xuất (server-side). */
export async function getDeXuatMuaHangChiTietPageSupabase(
  page: number,
  pageSize: number = CHI_TIET_DE_XUAT_MH_PAGE_SIZE_DEFAULT,
  listQuery?: DeXuatMuaHangChiTietListServerQuery
): Promise<PaginatedTableResult<DeXuatMuaHangChiTietRow>> {
  let phieuIds: number[] | null = null;
  if (listQuery && !listQuery.scope.viewAll) {
    phieuIds = await fetchPhieuIdsMatchingScope(listQuery.scope);
    if (phieuIds.length === 0) {
      return { data: [], totalCount: 0, page, pageSize };
    }
  }

  const pageResult = await fetchTablePage<ChiTietFullDbRow>(page, pageSize, async (from, to) => {
    let sel = db.from(VIEW_CHI_TIET_FLAT).select(CHI_TIET_TAB_SELECT, { count: 'exact' });
    sel = applyPhieuIdConstraint(sel, phieuIds);
    if (listQuery) sel = applyDeXuatMuaHangChiTietRowFilters(sel, listQuery);
    const res = await sel
      .order('id_de_xuat_mua_hang', { ascending: false })
      .order('id', { ascending: true })
      .range(from, to);
    return { data: res.data as ChiTietFullDbRow[] | null, error: res.error, count: res.count };
  });
  const data = await mapDeXuatMuaHangChiTietDbRowsToRows(pageResult.data);
  return { data, totalCount: pageResult.totalCount, page: pageResult.page, pageSize: pageResult.pageSize };
}

export async function fetchAllDeXuatMuaHangChiTietForListQuerySupabase(
  listQuery: DeXuatMuaHangChiTietListServerQuery,
  pageSize = 500,
  maxRows = 25000
): Promise<DeXuatMuaHangChiTietRow[]> {
  const out: DeXuatMuaHangChiTietRow[] = [];
  let page = 0;
  while (out.length < maxRows) {
    const { data, totalCount } = await getDeXuatMuaHangChiTietPageSupabase(page, pageSize, listQuery);
    out.push(...data);
    if (data.length === 0 || out.length >= totalCount) break;
    page += 1;
  }
  return out;
}
