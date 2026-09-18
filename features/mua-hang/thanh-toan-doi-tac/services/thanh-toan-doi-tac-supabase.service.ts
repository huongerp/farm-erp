/**
 * Service thanh toán đối tác – đọc/ghi Supabase (fp_mh_thanh_toan_doi_tac).
 * Dùng id_trang_thai_thanh_toan (FK) và trang_thai (text denormalize).
 */
import {
  db,
  fetchAllRows,
  fetchTablePage,
  throwSupabaseError,
  type PaginatedTableResult,
} from '../../../../lib/db';
import { applyPostgrestSearch } from '../../../../lib/postgrest-search';
import {
  TTDT_SORTABLE_DB_COLUMNS,
  TTDT_SORT_MAC_DINH,
  type ThanhToanDoiTacListServerQuery,
} from './thanh-toan-doi-tac-list-query';
import type { ThanhToanDoiTac } from '../core/types';
import type { ThanhToanDoiTacFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { getBranches } from '../../../he-thong/chi-nhanh/services/chi-nhanh-service';
import { getAllNhomDoiTac } from '../../../kho-van/danh-sach-doi-tac/services/doi-tac-service';
import type { LoaiDoiTac } from '../../../kho-van/danh-sach-doi-tac/core/types';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import { getTrangThaiThanhToanDoiTacList } from '../../thiet-lap-de-xuat-vat-tu/services/trang-thai-thanh-toan-doi-tac-service';

const TABLE = 'fp_mh_thanh_toan_doi_tac';
const TABLE_DOI_TAC = 'fp_mh_danh_sach_doi_tac';
const RPC_NEXT_SO_PHIEU = 'get_next_so_phieu_thanh_toan_doi_tac';

const THANH_TOAN_ROW_COLUMNS =
  'id,so_phieu,hang_muc_thanh_toan,ngay,id_don_vi,id_doi_tac,id_trang_thai_thanh_toan,trang_thai,so_tien,ngay_xu_ly,ghi_chu,id_nguoi_tao,tg_tao,tg_cap_nhat';

export interface NextSoPhieuTtoConfig {
  tien_to_so_phieu: string;
  do_dai_phan_so: number;
}

/** Gọi RPC Supabase lấy số thứ tự tiếp theo, format thành mã phiếu (tiền tố + pad). */
export async function getNextSoPhieuThanhToanDoiTacRpc(config: NextSoPhieuTtoConfig): Promise<string> {
  const { data, error } = await db.rpc(RPC_NEXT_SO_PHIEU);
  if (error) throwSupabaseError(error);
  const nextNum = Number(data);
  if (Number.isNaN(nextNum) || nextNum < 1) throw new Error('Invalid next number from RPC');
  const padded = String(nextNum).padStart(config.do_dai_phan_so, '0');
  return `${config.tien_to_so_phieu || ''}${padded}`;
}

interface DbRow {
  id: number;
  so_phieu: string;
  hang_muc_thanh_toan: string;
  ngay: string;
  id_don_vi: number | null;
  id_doi_tac: number;
  id_trang_thai_thanh_toan: number | null;
  trang_thai: string | null;
  so_tien: number;
  ngay_xu_ly: string | null;
  ghi_chu: string | null;
  id_nguoi_tao: number | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

interface DoiTacNhomRow {
  id: number;
  ma_doi_tac: string;
  ten_doi_tac: string;
  id_nhom: number | null;
}

/** Map đối tác (NCC) kèm tên nhóm – dùng enrich list/detail thanh toán. */
async function loadDoiTacEnrichMap(
  loai: LoaiDoiTac
): Promise<Record<string, { ten: string; ma: string; ten_nhom?: string }>> {
  const [doiTacRows, nhomList] = await Promise.all([
    fetchAllRows<DoiTacNhomRow>((from, to) =>
      db
        .from(TABLE_DOI_TAC)
        .select('id, ma_doi_tac, ten_doi_tac, id_nhom')
        .eq('loai_doi_tac', loai)
        .order('thu_tu', { ascending: true })
        .order('ma_doi_tac', { ascending: true })
        .range(from, to)
    ),
    getAllNhomDoiTac(),
  ]);
  const nhomMap: Record<string, string> = {};
  nhomList.forEach((n) => {
    nhomMap[n.id] = n.ten_nhom;
  });
  const map: Record<string, { ten: string; ma: string; ten_nhom?: string }> = {};
  doiTacRows.forEach((row) => {
    map[String(row.id)] = {
      ten: row.ten_doi_tac ?? '',
      ma: row.ma_doi_tac ?? '',
      ten_nhom: row.id_nhom != null ? nhomMap[String(row.id_nhom)] : undefined,
    };
  });
  return map;
}

function toNum(s: string | null | undefined): number | null {
  if (s == null || s === '') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function rowToItem(
  row: DbRow,
  enrich: {
    ten_don_vi?: string | null;
    ten_doi_tac?: string;
    ma_doi_tac?: string;
    ten_nhom?: string;
    ten_nguoi_tao?: string;
    ma_nguoi_tao?: string;
    ten_trang_thai?: string;
    mau_trang_thai?: string;
  }
): ThanhToanDoiTac {
  const idTrangThai =
    row.id_trang_thai_thanh_toan != null
      ? String(row.id_trang_thai_thanh_toan)
      : '';
  const tenTrangThai = enrich.ten_trang_thai ?? row.trang_thai ?? undefined;
  return {
    id: String(row.id),
    so_phieu: row.so_phieu ?? '',
    hang_muc_thanh_toan: row.hang_muc_thanh_toan ?? '',
    ngay: row.ngay ?? '',
    id_don_vi: row.id_don_vi != null ? String(row.id_don_vi) : null,
    ten_don_vi: enrich.ten_don_vi ?? null,
    id_doi_tac: String(row.id_doi_tac),
    ten_doi_tac: enrich.ten_doi_tac,
    ma_doi_tac: enrich.ma_doi_tac,
    ten_nhom: enrich.ten_nhom,
    id_trang_thai_thanh_toan: idTrangThai,
    ten_trang_thai: tenTrangThai,
    mau_trang_thai: enrich.mau_trang_thai,
    so_tien: Number(row.so_tien),
    ngay_xu_ly: row.ngay_xu_ly ?? null,
    ghi_chu: row.ghi_chu ?? null,
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : '',
    ten_nguoi_tao: enrich.ten_nguoi_tao,
    ma_nguoi_tao: enrich.ma_nguoi_tao,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

/** Ghép bản ghi thô với các bảng tham chiếu đã tải. */
function mapRowsWithRefs(
  rows: DbRow[],
  branches: Awaited<ReturnType<typeof getBranches>>,
  doiTacMap: Awaited<ReturnType<typeof loadDoiTacEnrichMap>>,
  employees: Awaited<ReturnType<typeof getEmployeesRef>>,
  statusList: Awaited<ReturnType<typeof getTrangThaiThanhToanDoiTacList>>
): ThanhToanDoiTac[] {
  const donViMap: Record<string, string> = {};
  branches.forEach((b) => {
    donViMap[b.id] = b.ten_chi_nhanh;
  });
  const nvMap: Record<string, { ten: string; ma: string }> = {};
  employees.forEach((e) => {
    nvMap[e.id] = { ten: e.ho_ten ?? '', ma: e.ma_nhan_vien ?? '' };
  });
  const statusTenMap: Record<string, string> = {};
  const statusMauMap: Record<string, string> = {};
  statusList.forEach((s) => {
    statusTenMap[s.id] = s.ten;
    if (s.mau) statusMauMap[s.id] = s.mau;
  });

  return rows.map((row) => {
    const ten_don_vi = row.id_don_vi != null ? donViMap[String(row.id_don_vi)] ?? null : null;
    const doiTac = row.id_doi_tac != null ? doiTacMap[String(row.id_doi_tac)] : undefined;
    const nv = row.id_nguoi_tao != null ? nvMap[String(row.id_nguoi_tao)] : undefined;
    const ten_trang_thai =
      row.id_trang_thai_thanh_toan != null
        ? statusTenMap[String(row.id_trang_thai_thanh_toan)]
        : undefined;
    const mau_trang_thai =
      row.id_trang_thai_thanh_toan != null
        ? statusMauMap[String(row.id_trang_thai_thanh_toan)]
        : undefined;
    return rowToItem(row, {
      ten_don_vi,
      ten_doi_tac: doiTac?.ten,
      ma_doi_tac: doiTac?.ma,
      ten_nhom: doiTac?.ten_nhom,
      ten_nguoi_tao: nv?.ten,
      ma_nguoi_tao: nv?.ma,
      ten_trang_thai: ten_trang_thai ?? row.trang_thai ?? undefined,
      mau_trang_thai,
    });
  });
}

/** Cột tham gia ô tìm kiếm ở server. */
const TTDT_SEARCH_SPEC = {
  text: ['so_phieu', 'hang_muc_thanh_toan', 'ghi_chu', 'trang_thai'],
  numeric: ['id', 'so_tien'],
  dates: ['ngay', 'ngay_xu_ly'],
} as const;

/** Lọc + sắp xếp dùng chung cho trang danh sách và cho lượt tải phục vụ xuất file. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyTtdtListQuery(q: any, query: ThanhToanDoiTacListServerQuery): any {
  let sel = q;

  if (query.statusIds.length > 0) {
    sel = sel.in('id_trang_thai_thanh_toan', query.statusIds.map(Number).filter(Number.isFinite));
  }
  if (query.doiTacIds.length > 0) {
    sel = sel.in('id_doi_tac', query.doiTacIds.map(Number).filter(Number.isFinite));
  }
  if (query.donViIds.length > 0) {
    sel = sel.in('id_don_vi', query.donViIds.map(Number).filter(Number.isFinite));
  }

  // Phạm vi xem — khớp với filterThanhToanDoiTacListByViewScope ở client cũ.
  if (!query.viewAll) {
    const me = query.currentEmployeeId != null ? Number(query.currentEmployeeId) : NaN;
    const ve: string[] = [];
    if (Number.isFinite(me)) ve.push(`id_nguoi_tao.eq.${me}`);
    if (query.viewByBranch) {
      const ids = query.allowedBranchIds.map(Number).filter(Number.isFinite);
      if (ids.length > 0) ve.push(`id_don_vi.in.(${ids.join(',')})`);
    }
    sel = ve.length > 0 ? sel.or(ve.join(',')) : sel.eq('id', -1);
  }

  sel = applyPostgrestSearch(sel, query.searchTerm, TTDT_SEARCH_SPEC);

  const dbSortable = query.sortColumn != null && TTDT_SORTABLE_DB_COLUMNS.has(query.sortColumn);
  const sortCol = dbSortable ? query.sortColumn! : TTDT_SORT_MAC_DINH.column;
  const ascending = dbSortable ? query.sortDirection !== 'desc' : TTDT_SORT_MAC_DINH.ascending;

  sel = sel.order(sortCol, { ascending });
  if (sortCol === 'ngay') sel = sel.order('so_phieu', { ascending: false });
  return sel.order('id', { ascending: false });
}

export async function getThanhToanDoiTacPage(
  query: ThanhToanDoiTacListServerQuery
): Promise<PaginatedTableResult<ThanhToanDoiTac>> {
  const result = await fetchTablePage<DbRow>(query.page, query.pageSize, async (from, to) => {
    const res = await applyTtdtListQuery(
      db.from(TABLE).select(THANH_TOAN_ROW_COLUMNS, { count: 'exact' }),
      query
    ).range(from, to);
    return { data: (res.data as unknown as DbRow[] | null) ?? null, error: res.error, count: res.count };
  });
  return { ...result, data: await enrichThanhToanRows(result.data) };
}

/** Toàn bộ bản ghi khớp bộ lọc — chỉ gọi khi mở hộp thoại Xuất file. */
export async function fetchAllThanhToanDoiTacForListQuery(
  query: ThanhToanDoiTacListServerQuery
): Promise<ThanhToanDoiTac[]> {
  const rows = await fetchAllRows<DbRow>((from, to) =>
    applyTtdtListQuery(db.from(TABLE).select(THANH_TOAN_ROW_COLUMNS), query).range(from, to)
  );
  return enrichThanhToanRows(rows);
}

/**
 * Tóm tắt toàn bộ phiếu (4 cột) — chip lọc phải đếm trên toàn bộ dữ liệu chứ
 * không riêng trang đang xem.
 */
export async function getThanhToanDoiTacTomTat(): Promise<ThanhToanDoiTacTomTat[]> {
  const rows = await fetchAllRows<{
    id: number;
    id_trang_thai_thanh_toan: number | null;
    id_doi_tac: number | null;
    id_don_vi: number | null;
  }>((from, to) =>
    db.from(TABLE).select('id,id_trang_thai_thanh_toan,id_doi_tac,id_don_vi').range(from, to)
  );
  return rows.map((r) => ({
    id: String(r.id),
    id_trang_thai_thanh_toan: r.id_trang_thai_thanh_toan != null ? String(r.id_trang_thai_thanh_toan) : '',
    id_doi_tac: r.id_doi_tac != null ? String(r.id_doi_tac) : '',
    id_don_vi: r.id_don_vi != null ? String(r.id_don_vi) : null,
  }));
}

export interface ThanhToanDoiTacTomTat {
  id: string;
  id_trang_thai_thanh_toan: string;
  id_doi_tac: string;
  id_don_vi: string | null;
}

/** Gắn tên chi nhánh / đối tác / người tạo / trạng thái cho một tập bản ghi. */
async function enrichThanhToanRows(rows: DbRow[]): Promise<ThanhToanDoiTac[]> {
  const [branches, doiTacMap, employees, statusList] = await Promise.all([
    getBranches(),
    loadDoiTacEnrichMap('nha_cung_cap'),
    getEmployeesRef(),
    getTrangThaiThanhToanDoiTacList(),
  ]);
  return mapRowsWithRefs(rows, branches, doiTacMap, employees, statusList);
}

export async function getAllThanhToanDoiTac(): Promise<ThanhToanDoiTac[]> {
  const [rows, branches, doiTacMap, employees, statusList] = await Promise.all([
    fetchAllRows<DbRow>((from, to) =>
      db
        .from(TABLE)
        .select(THANH_TOAN_ROW_COLUMNS)
        .order('ngay', { ascending: false })
        .order('so_phieu', { ascending: false })
        .range(from, to)
    ),
    getBranches(),
    loadDoiTacEnrichMap('nha_cung_cap'),
    getEmployeesRef(),
    getTrangThaiThanhToanDoiTacList(),
  ]);

  return mapRowsWithRefs(rows, branches, doiTacMap, employees, statusList);
}

export async function getThanhToanDoiTacById(id: string): Promise<ThanhToanDoiTac | null> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;

  const { data: row, error } = await db
    .from(TABLE)
    .select(THANH_TOAN_ROW_COLUMNS)
    .eq('id', idNum)
    .maybeSingle();

  if (error) throwSupabaseError(error);
  if (!row) return null;

  const [branches, doiTacMap, employees, statusList] = await Promise.all([
    getBranches(),
    loadDoiTacEnrichMap('nha_cung_cap'),
    getEmployeesRef(),
    getTrangThaiThanhToanDoiTacList(),
  ]);

  const donViMap: Record<string, string> = {};
  branches.forEach((b) => {
    donViMap[b.id] = b.ten_chi_nhanh;
  });
  const nvMap: Record<string, { ten: string; ma: string }> = {};
  employees.forEach((e) => {
    nvMap[e.id] = { ten: e.ho_ten ?? '', ma: e.ma_nhan_vien ?? '' };
  });
  const statusTenMap: Record<string, string> = {};
  const statusMauMap: Record<string, string> = {};
  statusList.forEach((s) => {
    statusTenMap[s.id] = s.ten;
    if (s.mau) statusMauMap[s.id] = s.mau;
  });

  const r = row as DbRow;
  const ten_don_vi = r.id_don_vi != null ? donViMap[String(r.id_don_vi)] ?? null : null;
  const doiTac = r.id_doi_tac != null ? doiTacMap[String(r.id_doi_tac)] : undefined;
  const nv = r.id_nguoi_tao != null ? nvMap[String(r.id_nguoi_tao)] : undefined;
  const ten_trang_thai =
    r.id_trang_thai_thanh_toan != null
      ? statusTenMap[String(r.id_trang_thai_thanh_toan)]
      : undefined;
  const mau_trang_thai =
    r.id_trang_thai_thanh_toan != null
      ? statusMauMap[String(r.id_trang_thai_thanh_toan)]
      : undefined;

  return rowToItem(r, {
    ten_don_vi,
    ten_doi_tac: doiTac?.ten,
    ma_doi_tac: doiTac?.ma,
    ten_nhom: doiTac?.ten_nhom,
    ten_nguoi_tao: nv?.ten,
    ma_nguoi_tao: nv?.ma,
    ten_trang_thai: ten_trang_thai ?? r.trang_thai ?? undefined,
    mau_trang_thai,
  });
}

export async function createThanhToanDoiTac(data: ThanhToanDoiTacFormValues): Promise<ThanhToanDoiTac> {
  const soPhieu = data.so_phieu.trim();
  const { data: existing } = await db.from(TABLE).select('id').eq('so_phieu', soPhieu).maybeSingle();
  if (existing) throw new Error(i18n.t('thanhToanDoiTac.service.duplicateSoPhieu'));

  const statusList = await getTrangThaiThanhToanDoiTacList();
  const idTrangThaiNum = toNum(data.id_trang_thai_thanh_toan);
  const status = idTrangThaiNum != null ? statusList.find((s) => s.id === String(idTrangThaiNum)) : undefined;
  const trangThaiText = status?.ten ?? data.id_trang_thai_thanh_toan?.trim() ?? 'Chờ xử lý';

  const payload = {
    so_phieu: soPhieu,
    hang_muc_thanh_toan: data.hang_muc_thanh_toan.trim(),
    ngay: data.ngay.trim(),
    id_don_vi: toNum(data.id_don_vi),
    id_doi_tac: Number(data.id_doi_tac),
    id_trang_thai_thanh_toan: idTrangThaiNum,
    trang_thai: trangThaiText,
    so_tien: Number(data.so_tien),
    ngay_xu_ly: data.ngay_xu_ly?.trim() || null,
    ghi_chu: data.ghi_chu?.trim() || null,
    id_nguoi_tao: toNum(data.id_nguoi_tao),
  };

  const { data: inserted, error } = await db.from(TABLE).insert(payload).select(THANH_TOAN_ROW_COLUMNS).single();
  if (error) throwSupabaseError(error);

  const got = await getThanhToanDoiTacById(String((inserted as DbRow).id));
  if (!got) throw new Error(i18n.t('thanhToanDoiTac.service.notFound'));
  return got;
}

export async function updateThanhToanDoiTac(
  id: string,
  data: ThanhToanDoiTacFormValues
): Promise<ThanhToanDoiTac> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('thanhToanDoiTac.service.notFound'));

  const soPhieu = data.so_phieu.trim();
  const { data: other } = await db
    .from(TABLE)
    .select('id')
    .eq('so_phieu', soPhieu)
    .neq('id', idNum)
    .maybeSingle();
  if (other) throw new Error(i18n.t('thanhToanDoiTac.service.duplicateSoPhieu'));

  const statusList = await getTrangThaiThanhToanDoiTacList();
  const idTrangThaiNum = toNum(data.id_trang_thai_thanh_toan);
  const status = idTrangThaiNum != null ? statusList.find((s) => s.id === String(idTrangThaiNum)) : undefined;
  const trangThaiText = status?.ten ?? data.id_trang_thai_thanh_toan?.trim() ?? 'Chờ xử lý';

  const payload = {
    so_phieu: soPhieu,
    hang_muc_thanh_toan: data.hang_muc_thanh_toan.trim(),
    ngay: data.ngay.trim(),
    id_don_vi: toNum(data.id_don_vi),
    id_doi_tac: Number(data.id_doi_tac),
    id_trang_thai_thanh_toan: idTrangThaiNum,
    trang_thai: trangThaiText,
    so_tien: Number(data.so_tien),
    ngay_xu_ly: data.ngay_xu_ly?.trim() || null,
    ghi_chu: data.ghi_chu?.trim() || null,
    id_nguoi_tao: toNum(data.id_nguoi_tao),
  };

  const { error } = await db.from(TABLE).update(payload).eq('id', idNum);
  if (error) throwSupabaseError(error);

  const got = await getThanhToanDoiTacById(id);
  if (!got) throw new Error(i18n.t('thanhToanDoiTac.service.notFound'));
  return got;
}

export async function deleteThanhToanDoiTac(id: string): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('thanhToanDoiTac.service.notFound'));
  const { error } = await db.from(TABLE).delete().eq('id', idNum);
  if (error) throwSupabaseError(error);
}

export async function deleteThanhToanDoiTacMany(ids: string[]): Promise<void> {
  const numIds = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', numIds);
  if (error) throwSupabaseError(error);
}
