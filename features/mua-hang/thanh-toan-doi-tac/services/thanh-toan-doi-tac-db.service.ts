/**
 * Service thanh toán đối tác – đọc/ghi DB (fp_mh_thanh_toan_doi_tac).
 * Dùng id_trang_thai_thanh_toan (FK) và trang_thai (text denormalize).
 */
import {
  db,
  fetchAllRows,
  fetchTablePage,
  throwDbError,
  type PaginatedTableResult,
} from '../../../../lib/db';
import { applyPostgrestSearch } from '../../../../lib/postgrest-search';
import {
  TTDT_SORTABLE_DB_COLUMNS,
  TTDT_SORT_MAC_DINH,
  type ThanhToanDoiTacListServerQuery,
  type ThanhToanDoiTacViewScopeQuery,
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
  'id,so_phieu,hang_muc_thanh_toan,noi_dung_chi_tiet,ngay,id_don_vi,id_doi_tac,id_trang_thai_thanh_toan,trang_thai,so_tien,ngay_xu_ly,ghi_chu,id_nguoi_tao,tg_tao,tg_cap_nhat';

export interface NextSoPhieuTtoConfig {
  tien_to_so_phieu: string;
  do_dai_phan_so: number;
}

/** Gọi RPC lấy số thứ tự tiếp theo, format thành mã phiếu (tiền tố + pad). */
export async function getNextSoPhieuThanhToanDoiTacRpc(config: NextSoPhieuTtoConfig): Promise<string> {
  const { data, error } = await db.rpc(RPC_NEXT_SO_PHIEU);
  if (error) throwDbError(error);
  const nextNum = Number(data);
  if (Number.isNaN(nextNum) || nextNum < 1) throw new Error('Invalid next number from RPC');
  const padded = String(nextNum).padStart(config.do_dai_phan_so, '0');
  return `${config.tien_to_so_phieu || ''}${padded}`;
}

interface DbRow {
  id: number;
  so_phieu: string;
  hang_muc_thanh_toan: string;
  noi_dung_chi_tiet: string | null;
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
  ngan_hang_bin: string | null;
  so_tai_khoan: string | null;
  chu_tai_khoan: string | null;
}

type DoiTacEnrich = {
  ten: string;
  ma: string;
  ten_nhom?: string;
  ngan_hang_bin?: string | null;
  so_tai_khoan?: string | null;
  chu_tai_khoan?: string | null;
};

/** Map đối tác (NCC) kèm tên nhóm – dùng enrich list/detail thanh toán. */
async function loadDoiTacEnrichMap(loai: LoaiDoiTac): Promise<Record<string, DoiTacEnrich>> {
  const [doiTacRows, nhomList] = await Promise.all([
    fetchAllRows<DoiTacNhomRow>((from, to) =>
      db
        .from(TABLE_DOI_TAC)
        .select('id, ma_doi_tac, ten_doi_tac, id_nhom, ngan_hang_bin, so_tai_khoan, chu_tai_khoan')
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
  const map: Record<string, DoiTacEnrich> = {};
  doiTacRows.forEach((row) => {
    map[String(row.id)] = {
      ten: row.ten_doi_tac ?? '',
      ma: row.ma_doi_tac ?? '',
      ten_nhom: row.id_nhom != null ? nhomMap[String(row.id_nhom)] : undefined,
      ngan_hang_bin: row.ngan_hang_bin,
      so_tai_khoan: row.so_tai_khoan,
      chu_tai_khoan: row.chu_tai_khoan,
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
    ngan_hang_bin?: string | null;
    so_tai_khoan?: string | null;
    chu_tai_khoan?: string | null;
    ten_nguoi_tao?: string;
    ma_nguoi_tao?: string;
    ten_trang_thai?: string;
    ma_trang_thai?: string;
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
    noi_dung_chi_tiet: row.noi_dung_chi_tiet ?? null,
    ngay: row.ngay ?? '',
    id_don_vi: row.id_don_vi != null ? String(row.id_don_vi) : null,
    ten_don_vi: enrich.ten_don_vi ?? null,
    id_doi_tac: String(row.id_doi_tac),
    ten_doi_tac: enrich.ten_doi_tac,
    ma_doi_tac: enrich.ma_doi_tac,
    ten_nhom: enrich.ten_nhom,
    ngan_hang_bin: enrich.ngan_hang_bin ?? null,
    so_tai_khoan: enrich.so_tai_khoan ?? null,
    chu_tai_khoan: enrich.chu_tai_khoan ?? null,
    id_trang_thai_thanh_toan: idTrangThai,
    ten_trang_thai: tenTrangThai,
    // Thẻ thống kê Chờ / Đã thanh toán / Đã huỷ đếm theo mã — thiếu là mọi thẻ = 0.
    ma_trang_thai: enrich.ma_trang_thai,
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
  const statusMaMap: Record<string, string> = {};
  statusList.forEach((s) => {
    statusTenMap[s.id] = s.ten;
    statusMaMap[s.id] = s.ma;
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
      ngan_hang_bin: doiTac?.ngan_hang_bin,
      so_tai_khoan: doiTac?.so_tai_khoan,
      chu_tai_khoan: doiTac?.chu_tai_khoan,
      ten_nguoi_tao: nv?.ten,
      ma_nguoi_tao: nv?.ma,
      ten_trang_thai: ten_trang_thai ?? row.trang_thai ?? undefined,
      ma_trang_thai:
        row.id_trang_thai_thanh_toan != null ? statusMaMap[String(row.id_trang_thai_thanh_toan)] : undefined,
      mau_trang_thai,
    });
  });
}

/** Cột tham gia ô tìm kiếm ở server. */
const TTDT_SEARCH_SPEC = {
  text: ['so_phieu', 'hang_muc_thanh_toan', 'noi_dung_chi_tiet', 'ghi_chu', 'trang_thai'],
  numeric: ['id', 'so_tien'],
  dates: ['ngay', 'ngay_xu_ly'],
} as const;

const toNumIds = (ids: string[]) => ids.map(Number).filter(Number.isFinite);

/** Phạm vi xem — khớp với filterThanhToanDoiTacListByViewScope ở client cũ. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyTtdtViewScope(sel: any, scope: ThanhToanDoiTacViewScopeQuery): any {
  if (scope.viewAll) return sel;
  const me = scope.currentEmployeeId != null ? Number(scope.currentEmployeeId) : NaN;
  const ve: string[] = [];
  if (Number.isFinite(me)) ve.push(`id_nguoi_tao.eq.${me}`);
  if (scope.viewByBranch) {
    const ids = toNumIds(scope.allowedBranchIds);
    if (ids.length > 0) ve.push(`id_don_vi.in.(${ids.join(',')})`);
  }
  return ve.length > 0 ? sel.or(ve.join(',')) : sel.eq('id', -1);
}

/**
 * Nhóm đối tác nằm ở bảng đối tác → tra id đối tác thuộc các nhóm đã chọn bằng một truy vấn nhẹ.
 * Trả null khi không lọc theo nhóm; mảng rỗng = không đối tác nào khớp (danh sách trống).
 */
async function doiTacIdsTheoNhom(nhomIds: string[]): Promise<number[] | null> {
  const ids = toNumIds(nhomIds);
  if (ids.length === 0) return null;
  const rows = await fetchAllRows<{ id: number }>((from, to) =>
    db.from(TABLE_DOI_TAC).select('id').in('id_nhom', ids).range(from, to)
  );
  return rows.map((r) => r.id);
}

/** Lọc + sắp xếp dùng chung cho trang danh sách và cho lượt tải phục vụ xuất file. */
function applyTtdtListQuery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  q: any,
  query: ThanhToanDoiTacListServerQuery,
  doiTacTheoNhom: number[] | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  let sel = q;

  if (query.statusIds.length > 0) {
    sel = sel.in('id_trang_thai_thanh_toan', toNumIds(query.statusIds));
  }
  if (query.doiTacIds.length > 0) {
    sel = sel.in('id_doi_tac', toNumIds(query.doiTacIds));
  }
  if (doiTacTheoNhom) {
    sel = doiTacTheoNhom.length > 0 ? sel.in('id_doi_tac', doiTacTheoNhom) : sel.eq('id', -1);
  }
  if (query.donViIds.length > 0) {
    sel = sel.in('id_don_vi', toNumIds(query.donViIds));
  }
  if (query.nguoiTaoIds.length > 0) {
    sel = sel.in('id_nguoi_tao', toNumIds(query.nguoiTaoIds));
  }
  if (query.tuNgay) sel = sel.gte('ngay', query.tuNgay);
  if (query.denNgay) sel = sel.lte('ngay', query.denNgay);

  sel = applyTtdtViewScope(sel, query);

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
  const doiTacTheoNhom = await doiTacIdsTheoNhom(query.nhomIds);
  const result = await fetchTablePage<DbRow>(query.page, query.pageSize, async (from, to) => {
    const res = await applyTtdtListQuery(
      db.from(TABLE).select(THANH_TOAN_ROW_COLUMNS, { count: 'exact' }),
      query,
      doiTacTheoNhom
    ).range(from, to);
    return { data: (res.data as unknown as DbRow[] | null) ?? null, error: res.error, count: res.count };
  });
  return { ...result, data: await enrichThanhToanRows(result.data) };
}

/** Toàn bộ bản ghi khớp bộ lọc — chỉ gọi khi mở hộp thoại Xuất file. */
export async function fetchAllThanhToanDoiTacForListQuery(
  query: ThanhToanDoiTacListServerQuery
): Promise<ThanhToanDoiTac[]> {
  const doiTacTheoNhom = await doiTacIdsTheoNhom(query.nhomIds);
  const rows = await fetchAllRows<DbRow>((from, to) =>
    applyTtdtListQuery(db.from(TABLE).select(THANH_TOAN_ROW_COLUMNS), query, doiTacTheoNhom).range(from, to)
  );
  return enrichThanhToanRows(rows);
}

/**
 * Tóm tắt phiếu trong PHẠM VI XEM (vài cột) — chip lọc phải đếm trên toàn bộ dữ liệu chứ
 * không riêng trang đang xem, nhưng không đếm phiếu người dùng không được xem.
 * id_nhom ghép từ bảng đối tác (phiếu không có cột nhóm).
 */
export async function getThanhToanDoiTacTomTat(
  scope: ThanhToanDoiTacViewScopeQuery
): Promise<ThanhToanDoiTacTomTat[]> {
  const [rows, doiTacRows] = await Promise.all([
    fetchAllRows<{
      id: number;
      id_trang_thai_thanh_toan: number | null;
      id_doi_tac: number | null;
      id_don_vi: number | null;
      id_nguoi_tao: number | null;
    }>((from, to) =>
      applyTtdtViewScope(
        db.from(TABLE).select('id,id_trang_thai_thanh_toan,id_doi_tac,id_don_vi,id_nguoi_tao'),
        scope
      )
        .order('id', { ascending: true })
        .range(from, to)
    ),
    fetchAllRows<{ id: number; id_nhom: number | null }>((from, to) =>
      db
        .from(TABLE_DOI_TAC)
        .select('id,id_nhom')
        .eq('loai_doi_tac', 'nha_cung_cap')
        .order('id', { ascending: true })
        .range(from, to)
    ),
  ]);
  const nhomTheoDoiTac = new Map(doiTacRows.map((d) => [String(d.id), d.id_nhom != null ? String(d.id_nhom) : null]));
  return rows.map((r) => {
    const idDoiTac = r.id_doi_tac != null ? String(r.id_doi_tac) : '';
    return {
      id: String(r.id),
      id_trang_thai_thanh_toan: r.id_trang_thai_thanh_toan != null ? String(r.id_trang_thai_thanh_toan) : '',
      id_doi_tac: idDoiTac,
      id_don_vi: r.id_don_vi != null ? String(r.id_don_vi) : null,
      id_nguoi_tao: r.id_nguoi_tao != null ? String(r.id_nguoi_tao) : null,
      id_nhom: nhomTheoDoiTac.get(idDoiTac) ?? null,
    };
  });
}

export interface ThanhToanDoiTacTomTat {
  id: string;
  id_trang_thai_thanh_toan: string;
  id_doi_tac: string;
  id_don_vi: string | null;
  id_nguoi_tao: string | null;
  id_nhom: string | null;
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

  if (error) throwDbError(error);
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
  const statusMaMap: Record<string, string> = {};
  statusList.forEach((s) => {
    statusTenMap[s.id] = s.ten;
    statusMaMap[s.id] = s.ma;
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
    ngan_hang_bin: doiTac?.ngan_hang_bin,
    so_tai_khoan: doiTac?.so_tai_khoan,
    chu_tai_khoan: doiTac?.chu_tai_khoan,
    ten_nguoi_tao: nv?.ten,
    ma_nguoi_tao: nv?.ma,
    ten_trang_thai: ten_trang_thai ?? r.trang_thai ?? undefined,
    ma_trang_thai:
      r.id_trang_thai_thanh_toan != null ? statusMaMap[String(r.id_trang_thai_thanh_toan)] : undefined,
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
    noi_dung_chi_tiet: data.noi_dung_chi_tiet?.trim() || null,
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
  if (error) throwDbError(error);

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
    noi_dung_chi_tiet: data.noi_dung_chi_tiet?.trim() || null,
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
  if (error) throwDbError(error);

  const got = await getThanhToanDoiTacById(id);
  if (!got) throw new Error(i18n.t('thanhToanDoiTac.service.notFound'));
  return got;
}

export async function deleteThanhToanDoiTac(id: string): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('thanhToanDoiTac.service.notFound'));
  const { error } = await db.from(TABLE).delete().eq('id', idNum);
  if (error) throwDbError(error);
}

export async function deleteThanhToanDoiTacMany(ids: string[]): Promise<void> {
  const numIds = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', numIds);
  if (error) throwDbError(error);
}

/**
 * Chuyển nhiều phiếu sang một trạng thái kết thúc (Đã thanh toán / Đã huỷ).
 * Chỉ ăn vào phiếu CHƯA ở trạng thái kết thúc (`idsKetThuc`) — phiếu đã xử lý giữ nguyên.
 * Ngày xử lý: phiếu chưa có thì điền `ngayXuLy`, phiếu đã có thì giữ (khớp dialog đơn lẻ).
 * Trả số phiếu đã đổi thật.
 */
export async function chuyenTrangThaiThanhToanManyDb(
  ids: string[],
  status: { id: string; ten: string },
  idsKetThuc: string[],
  ngayXuLy: string
): Promise<number> {
  const numIds = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return 0;
  const ketThuc = idsKetThuc.map(Number).filter((n) => !Number.isNaN(n));
  const chuaKetThuc =
    ketThuc.length > 0
      ? `id_trang_thai_thanh_toan.is.null,id_trang_thai_thanh_toan.not.in.(${ketThuc.join(',')})`
      : null;
  const patch = { id_trang_thai_thanh_toan: Number(status.id), trang_thai: status.ten };

  let count = 0;
  for (const coNgay of [true, false]) {
    let q = db
      .from(TABLE)
      .update(coNgay ? patch : { ...patch, ngay_xu_ly: ngayXuLy })
      .in('id', numIds);
    q = coNgay ? q.not('ngay_xu_ly', 'is', null) : q.is('ngay_xu_ly', null);
    if (chuaKetThuc) q = q.or(chuaKetThuc);
    const { data, error } = await q.select('id');
    if (error) throwDbError(error);
    count += data?.length ?? 0;
  }
  return count;
}
