/**
 * Service phiếu đề xuất vật tư – đọc/ghi Supabase (fp_mh_phieu_de_xuat_vat_tu, fp_mh_phieu_de_xuat_vat_tu_chi_tiet).
 */
import { supabase, fetchAllRows, fetchTablePage, type PaginatedTableResult, throwSupabaseError } from '../../../../lib/supabase';
import type { PhieuDeXuatVatTu, PhieuDeXuatVatTuChiTiet, PhieuDeXuatVatTuChiTietRow } from '../core/types';
import type { PhieuDeXuatVatTuFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { getKhoRef } from '../../danh-sach-kho/services/kho-service';
import { getHangHoaRef } from '../../danh-sach-hang-hoa/services/hang-hoa-service';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import type { BranchListScope } from '../../../../lib/branch-scope-query';
import { postgrestQuotedIlikePattern } from '../../../../lib/postgrest-or-ilike';
import type { PhieuDeXuatChiTietListServerQuery, PhieuDeXuatVatTuListServerQuery } from './phieu-de-xuat-list-query';

const TABLE_PHIEU = 'fp_mh_phieu_de_xuat_vat_tu';
const TABLE_CHI_TIET = 'fp_mh_phieu_de_xuat_vat_tu_chi_tiet';
/** View: docs/supabase-v_phieu_de_xuat_vat_tu_chi_tiet_flat.sql — JOIN mã/tên HH cho tìm kiếm tab Chi tiết. */
const VIEW_CHI_TIET_FLAT = 'v_phieu_de_xuat_vat_tu_chi_tiet_flat';
const RPC_NEXT_SO_PHIEU = 'get_next_so_phieu_phieu_de_xuat_vat_tu';

/** View DB: chạy docs/supabase-v_phieu_de_xuat_vat_tu_summary.sql; chi tiết đọc VIEW_CHI_TIET_FLAT (script trong docs). */
const VIEW_PHIEU_DE_XUAT_SUMMARY = 'v_phieu_de_xuat_vat_tu_summary';

/** Cột view summary (đủ cho `mapPhieuDeXuatSummaryRowToPhieu`). */
const VIEW_PHIEU_DE_XUAT_SUMMARY_COLUMNS =
  'id,so_phieu,ngay,ngay_can,id_noi_de_xuat,id_nguoi_de_xuat,id_nguoi_duyet,ghi_chu,trang_thai,tg_tao,tg_cap_nhat,so_dong,tong_so_luong,ref_ten_noi_de_xuat,ref_ten_nguoi_de_xuat,ref_ma_nguoi_de_xuat,ref_ten_nguoi_duyet,ref_ma_nguoi_duyet,ref_chi_tiet_tim_kiem,ref_ngay_va_thoi_gian_tim_kiem';

const PHIEU_DE_XUAT_HEADER_SELECT =
  'id, so_phieu, ngay, ngay_can, id_noi_de_xuat, id_nguoi_de_xuat, id_nguoi_duyet, ghi_chu, trang_thai, tg_tao, tg_cap_nhat';

const CHI_TIET_TAB_SELECT =
  'id, id_phieu_de_xuat_vat_tu, id_hang_hoa, so_luong, don_vi_tinh, thong_so, ghi_chu, id_tien_do_mh, ten_tien_do_mh, trao_doi, so_phieu, ngay, ngay_can, ten_noi_de_xuat, ten_nguoi_de_xuat, ten_nguoi_duyet, trang_thai_phieu';

export interface NextSoPhieuConfig {
  tien_to_so_phieu: string;
  do_dai_phan_so: number;
}

/** Gọi RPC Supabase lấy số thứ tự tiếp theo, format thành mã phiếu (tiền tố + pad). Nguồn sự thật duy nhất, tránh trùng khi nhiều user. */
export async function getNextSoPhieuPhieuDeXuatVatTuRpc(config: NextSoPhieuConfig): Promise<string> {
  const { data, error } = await supabase.rpc(RPC_NEXT_SO_PHIEU);
  if (error) throwSupabaseError(error);
  const nextNum = Number(data);
  if (Number.isNaN(nextNum) || nextNum < 1) throw new Error('Invalid next number from RPC');
  const padded = String(nextNum).padStart(config.do_dai_phan_so, '0');
  return `${config.tien_to_so_phieu || ''}${padded}`;
}

type PhieuDeXuatSummaryRow = PhieuDbRow & {
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

function mapPhieuDeXuatSummaryRowToPhieu(row: PhieuDeXuatSummaryRow): PhieuDeXuatVatTu {
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
  id_phieu_de_xuat_vat_tu: number;
  id_hang_hoa: number;
  so_luong: number;
  don_vi_tinh: string | null;
  thong_so: string | null;
  ghi_chu: string | null;
  id_tien_do_mh: number | null;
  ten_tien_do_mh: string | null;
  trao_doi: string | null;
}

/** Hàng đầy đủ từ fp_mh_phieu_de_xuat_vat_tu_chi_tiet (có cột kéo từ phiếu). */
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
): PhieuDeXuatVatTu {
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
    trang_thai: (row.trang_thai as PhieuDeXuatVatTu['trang_thai']) || 'Chờ duyệt',
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

function rowToChiTiet(row: ChiTietDbRow, idPhieuStr: string, enrich?: { ma_hang?: string; ten_hang?: string }): PhieuDeXuatVatTuChiTiet {
  return {
    id: String(row.id),
    id_phieu_de_xuat_vat_tu: idPhieuStr,
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

export async function getAllPhieuDeXuatVatTuSupabase(): Promise<PhieuDeXuatVatTu[]> {
  const rows = await fetchAllRows<PhieuDeXuatSummaryRow>((from, to) =>
    supabase
      .from(VIEW_PHIEU_DE_XUAT_SUMMARY)
      .select(VIEW_PHIEU_DE_XUAT_SUMMARY_COLUMNS)
      .order('ngay', { ascending: false })
      .order('so_phieu', { ascending: false })
      .range(from, to)
  );
  return rows.map((row) => mapPhieuDeXuatSummaryRowToPhieu(row));
}

const PHIEU_DE_XUAT_PAGE_SIZE_DEFAULT = 50;
const IMPOSSIBLE_NUM_ID = -2147483647;
const PHIEU_ID_IN_CHUNK = 200;

function chunkNumericIds(ids: number[], size: number): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPhieuDeXuatHeaderScope(q: any, scope: BranchListScope): any {
  let b = q;
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
function applyPhieuDeXuatVatTuListQuery(q: any, query: PhieuDeXuatVatTuListServerQuery): any {
  let b = applyPhieuDeXuatHeaderScope(q, query.scope);
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
    const base = supabase.from(VIEW_PHIEU_DE_XUAT_SUMMARY).select('id');
    const scoped = applyPhieuDeXuatHeaderScope(base, scope);
    return scoped.order('id', { ascending: true }).range(from, to);
  });
  return rows.map((r) => r.id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPhieuIdConstraint(q: any, phieuIds: number[] | null): any {
  if (phieuIds == null) return q;
  if (phieuIds.length === 0) return q.eq('id', IMPOSSIBLE_NUM_ID);
  if (phieuIds.length <= PHIEU_ID_IN_CHUNK) return q.in('id_phieu_de_xuat_vat_tu', phieuIds);
  const parts = chunkNumericIds(phieuIds, PHIEU_ID_IN_CHUNK).map(
    (ch) => `id_phieu_de_xuat_vat_tu.in.(${ch.join(',')})`
  );
  return q.or(parts.join(','));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPhieuDeXuatChiTietRowFilters(q: any, query: PhieuDeXuatChiTietListServerQuery): any {
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
        parts.push(`id.eq.${n}`, `id_phieu_de_xuat_vat_tu.eq.${n}`, `id_hang_hoa.eq.${n}`);
      }
    }
    b = b.or(parts.join(','));
  }
  return b;
}

export async function getPhieuDeXuatVatTuPageSupabase(
  page: number,
  pageSize: number = PHIEU_DE_XUAT_PAGE_SIZE_DEFAULT,
  listQuery?: PhieuDeXuatVatTuListServerQuery
): Promise<PaginatedTableResult<PhieuDeXuatVatTu>> {
  const pageResult = await fetchTablePage<PhieuDeXuatSummaryRow>(page, pageSize, async (from, to) => {
    let sel = supabase.from(VIEW_PHIEU_DE_XUAT_SUMMARY).select(VIEW_PHIEU_DE_XUAT_SUMMARY_COLUMNS, { count: 'exact' });
    if (listQuery) sel = applyPhieuDeXuatVatTuListQuery(sel, listQuery);
    const res = await sel.order('ngay', { ascending: false }).order('so_phieu', { ascending: false }).range(from, to);
    return { data: res.data as PhieuDeXuatSummaryRow[] | null, error: res.error, count: res.count };
  });
  const data = pageResult.data.map((row) => mapPhieuDeXuatSummaryRowToPhieu(row));
  return { data, totalCount: pageResult.totalCount, page: pageResult.page, pageSize: pageResult.pageSize };
}

export async function fetchAllPhieuDeXuatVatTuForListQuerySupabase(
  listQuery: PhieuDeXuatVatTuListServerQuery,
  pageSize = 500,
  maxRows = 25000
): Promise<PhieuDeXuatVatTu[]> {
  const out: PhieuDeXuatVatTu[] = [];
  let page = 0;
  while (out.length < maxRows) {
    const { data, totalCount } = await getPhieuDeXuatVatTuPageSupabase(page, pageSize, listQuery);
    out.push(...data);
    if (data.length === 0 || out.length >= totalCount) break;
    page += 1;
  }
  return out;
}

export async function getPhieuDeXuatVatTuByIdSupabase(id: string): Promise<PhieuDeXuatVatTu | null> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await supabase
    .from(TABLE_PHIEU)
    .select(PHIEU_DE_XUAT_HEADER_SELECT)
    .eq('id', idNum)
    .maybeSingle();
  if (error) throwSupabaseError(error);
  if (!row) return null;

  const [khoList, employees, ctRows, hangHoaList] = await Promise.all([
    getKhoRef(),
    getEmployeesRef(),
    supabase
      .from(TABLE_CHI_TIET)
      .select('id, id_phieu_de_xuat_vat_tu, id_hang_hoa, so_luong, don_vi_tinh, thong_so, ghi_chu, id_tien_do_mh, ten_tien_do_mh, trao_doi')
      .eq('id_phieu_de_xuat_vat_tu', idNum)
      .order('id', { ascending: true })
      .then((r) => r.data ?? []),
    getHangHoaRef(),
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

  const chi_tiet: PhieuDeXuatVatTuChiTiet[] = (ctRows as ChiTietDbRow[]).map((ct) => {
    const enrich = hangHoaMap[String(ct.id_hang_hoa)];
    return rowToChiTiet(ct, id, enrich);
  });
  phieu.chi_tiet = chi_tiet;
  phieu.tong_so_dong = chi_tiet.length;
  phieu.tong_so_luong = chi_tiet.reduce((s, c) => s + (Number(c.so_luong) || 0), 0);
  return phieu;
}

export async function createPhieuDeXuatVatTuSupabase(data: PhieuDeXuatVatTuFormValues): Promise<PhieuDeXuatVatTu> {
  const soPhieu = data.so_phieu.trim();
  const { data: existing } = await supabase.from(TABLE_PHIEU).select('id').eq('so_phieu', soPhieu).maybeSingle();
  if (existing) throw new Error(i18n.t('phieuDeXuatVatTu.service.duplicateCode'));

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

  const { data: inserted, error } = await supabase.from(TABLE_PHIEU).insert(payload).select(PHIEU_DE_XUAT_HEADER_SELECT).single();
  if (error) throwSupabaseError(error);
  const idPhieu = (inserted as PhieuDbRow).id;
  const idStr = String(idPhieu);

  const [hangHoaList, khoList, employees] = await Promise.all([
    getHangHoaRef(),
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
      id_phieu_de_xuat_vat_tu: idPhieu,
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
    const { error: errCt } = await supabase.from(TABLE_CHI_TIET).insert(ctRows);
    if (errCt) throwSupabaseError(errCt);
  }

  const got = await getPhieuDeXuatVatTuByIdSupabase(idStr);
  if (!got) throw new Error(i18n.t('phieuDeXuatVatTu.service.notFound'));
  return got;
}

export async function updatePhieuDeXuatVatTuSupabase(id: string, data: PhieuDeXuatVatTuFormValues): Promise<PhieuDeXuatVatTu> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuDeXuatVatTu.service.notFound'));

  const { data: oldRow, error: fetchErr } = await supabase.from(TABLE_PHIEU).select(PHIEU_DE_XUAT_HEADER_SELECT).eq('id', idNum).maybeSingle();
  if (fetchErr || !oldRow) throw new Error(i18n.t('phieuDeXuatVatTu.service.notFound'));

  const soPhieu = data.so_phieu.trim();
  const { data: other } = await supabase.from(TABLE_PHIEU).select('id').eq('so_phieu', soPhieu).neq('id', idNum).maybeSingle();
  if (other) throw new Error(i18n.t('phieuDeXuatVatTu.service.duplicateCode'));

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

  const { error: updateErr } = await supabase.from(TABLE_PHIEU).update(payload).eq('id', idNum);
  if (updateErr) throwSupabaseError(updateErr);

  await supabase.from(TABLE_CHI_TIET).delete().eq('id_phieu_de_xuat_vat_tu', idNum);

  const [hangHoaList, khoList, employees] = await Promise.all([
    getHangHoaRef(),
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
      id_phieu_de_xuat_vat_tu: idNum,
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
    const { error: errCt } = await supabase.from(TABLE_CHI_TIET).insert(ctRows);
    if (errCt) throwSupabaseError(errCt);
  }

  const got = await getPhieuDeXuatVatTuByIdSupabase(id);
  if (!got) throw new Error(i18n.t('phieuDeXuatVatTu.service.notFound'));
  return got;
}

export async function deletePhieuDeXuatVatTuSupabase(id: string): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuDeXuatVatTu.service.notFound'));
  const { error } = await supabase.from(TABLE_PHIEU).delete().eq('id', idNum);
  if (error) throwSupabaseError(error);
}

export async function deletePhieuDeXuatVatTuManySupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE_PHIEU).delete().in('id', numIds);
  if (error) throwSupabaseError(error);
}

/** Map DB chi tiết + ref → dòng tab Chi tiết. */
async function mapPhieuDeXuatChiTietDbRowsToRows(rows: ChiTietFullDbRow[]): Promise<PhieuDeXuatVatTuChiTietRow[]> {
  if (rows.length === 0) return [];
  const [hangHoaList, khoList, employees] = await Promise.all([getHangHoaRef(), getKhoRef(), getEmployeesRef()]);

  const phieuIds = [...new Set(rows.map((r) => r.id_phieu_de_xuat_vat_tu))];
  const phieuRows: PhieuDbRow[] = [];
  if (phieuIds.length > 0) {
    const { data: phieuData } = await supabase.from(TABLE_PHIEU).select(PHIEU_DE_XUAT_HEADER_SELECT).in('id', phieuIds);
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
    const fromPhieu = phieuEnrich[row.id_phieu_de_xuat_vat_tu];
    return {
      id: String(row.id),
      id_phieu_de_xuat_vat_tu: String(row.id_phieu_de_xuat_vat_tu),
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

/** Lấy toàn bộ dòng chi tiết từ bảng fp_mh_phieu_de_xuat_vat_tu_chi_tiet (phục vụ tab Chi tiết). Làm giàu ten_noi_de_xuat, ten_nguoi_de_xuat, ten_nguoi_duyet từ phiếu nếu chi tiết chưa có. */
export async function getAllPhieuDeXuatVatTuChiTietSupabase(): Promise<PhieuDeXuatVatTuChiTietRow[]> {
  const rows = await fetchAllRows<ChiTietFullDbRow>((from, to) =>
    supabase
      .from(VIEW_CHI_TIET_FLAT)
      .select(CHI_TIET_TAB_SELECT)
      .order('id_phieu_de_xuat_vat_tu', { ascending: false })
      .order('id', { ascending: true })
      .range(from, to)
  );
  return mapPhieuDeXuatChiTietDbRowsToRows(rows);
}

const CHI_TIET_DE_XUAT_PAGE_SIZE_DEFAULT = 100;

/** Một trang chi tiết đề xuất (server-side). */
export async function getPhieuDeXuatVatTuChiTietPageSupabase(
  page: number,
  pageSize: number = CHI_TIET_DE_XUAT_PAGE_SIZE_DEFAULT,
  listQuery?: PhieuDeXuatChiTietListServerQuery
): Promise<PaginatedTableResult<PhieuDeXuatVatTuChiTietRow>> {
  let phieuIds: number[] | null = null;
  if (listQuery && !listQuery.scope.viewAll) {
    phieuIds = await fetchPhieuIdsMatchingScope(listQuery.scope);
    if (phieuIds.length === 0) {
      return { data: [], totalCount: 0, page, pageSize };
    }
  }

  const pageResult = await fetchTablePage<ChiTietFullDbRow>(page, pageSize, async (from, to) => {
    let sel = supabase.from(VIEW_CHI_TIET_FLAT).select(CHI_TIET_TAB_SELECT, { count: 'exact' });
    sel = applyPhieuIdConstraint(sel, phieuIds);
    if (listQuery) sel = applyPhieuDeXuatChiTietRowFilters(sel, listQuery);
    const res = await sel
      .order('id_phieu_de_xuat_vat_tu', { ascending: false })
      .order('id', { ascending: true })
      .range(from, to);
    return { data: res.data as ChiTietFullDbRow[] | null, error: res.error, count: res.count };
  });
  const data = await mapPhieuDeXuatChiTietDbRowsToRows(pageResult.data);
  return { data, totalCount: pageResult.totalCount, page: pageResult.page, pageSize: pageResult.pageSize };
}

/** Chỉ id + số phiếu + ngày — dropdown liên kết PO (giảm egress so với full list). */
export type PhieuDeXuatSoPhieuOption = { id: string; so_phieu: string; ngay: string };

export async function listPhieuDeXuatSoPhieuMinimalSupabase(limit = 2500): Promise<PhieuDeXuatSoPhieuOption[]> {
  const { data, error } = await supabase
    .from(TABLE_PHIEU)
    .select('id, so_phieu, ngay')
    .order('id', { ascending: false })
    .limit(limit);
  if (error) throwSupabaseError(error);
  return (data ?? []).map((r: { id: number; so_phieu: string | null; ngay: string | null }) => ({
    id: String(r.id),
    so_phieu: r.so_phieu ?? '',
    ngay: r.ngay ?? '',
  }));
}

export async function fetchAllPhieuDeXuatVatTuChiTietForListQuerySupabase(
  listQuery: PhieuDeXuatChiTietListServerQuery,
  pageSize = 500,
  maxRows = 25000
): Promise<PhieuDeXuatVatTuChiTietRow[]> {
  const out: PhieuDeXuatVatTuChiTietRow[] = [];
  let page = 0;
  while (out.length < maxRows) {
    const { data, totalCount } = await getPhieuDeXuatVatTuChiTietPageSupabase(page, pageSize, listQuery);
    out.push(...data);
    if (data.length === 0 || out.length >= totalCount) break;
    page += 1;
  }
  return out;
}
