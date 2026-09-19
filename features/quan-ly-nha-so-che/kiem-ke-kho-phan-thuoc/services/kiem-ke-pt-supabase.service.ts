/**
 * Kiểm kê kho phân thuốc — PostgREST.
 * Bảng: fp_farm_dot_kiem_ke_pt, _kho, _chi_tiet (docs/supabase-fp_farm_dot_kiem_ke_pt.sql).
 * Tồn sổ: v_farm_ton_kho_phan_thuoc. Điều chỉnh: RPC farm_kiem_ke_pt_apply_*.
 */
import { db, fetchTablePage, fetchAllRows, throwSupabaseError, type PaginatedTableResult } from '../../../../lib/db';
import { buildPostgrestSearchOr } from '../../../../lib/postgrest-search';
import i18n from '../../../../lib/i18n';
import { getKhoRef } from '../../../kho-van/danh-sach-kho/services/kho-service';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import { getFarmHangHoaRef } from '../../hang-hoa-phan-thuoc/services/farm-hang-hoa-service';
import { getTonKhoPTMatrixByKhoIds } from '../../ton-kho-phan-thuoc/services/farm-ton-kho-pt';
import { computeKetQuaKiemKePT } from '../core/ket-qua';
import {
  coTheSuaDotPT,
  coTheXoaDotPT,
  coTheSuaChiTietPT,
  coTheChuyenTrangThaiDotPT,
} from '../core/quyen-sua-dot';
import type {
  DotKiemKePT,
  DotKiemKePTTomTat,
  DotKiemKePTCreate,
  ChiTietKiemKePT,
  ChiTietKiemKePTUpdate,
  TrangThaiDotKiemKePT,
  TaoDanhSachKiemKePTFilters,
} from '../core/types';
import type { DotKiemKePTListServerQuery } from './kiem-ke-pt-list-query';
import { KKPT_SORT_MAC_DINH } from './kiem-ke-pt-list-query';

const TABLE_DOT = 'fp_farm_dot_kiem_ke_pt';
const TABLE_DOT_KHO = 'fp_farm_dot_kiem_ke_pt_kho';
const TABLE_CHI_TIET = 'fp_farm_dot_kiem_ke_pt_chi_tiet';

const DOT_COLUMNS =
  'id,ma_dot,ten_dot,ngay_bat_dau,ngay_ket_thuc,trang_thai,id_nguoi_phu_trach,id_nguoi_tao,ghi_chu,tg_tao,tg_cap_nhat';
const DOT_TOM_TAT_COLUMNS =
  'id,ma_dot,ten_dot,ngay_bat_dau,ngay_ket_thuc,trang_thai,id_nguoi_phu_trach,id_nguoi_tao';
const CHI_TIET_COLUMNS =
  'id,id_dot_kiem_ke_pt,id_kho,id_hang_hoa,so_luong_so,so_luong_thuc_te,ket_qua,ghi_chu_dong,id_nguoi_kiem,ngay_kiem,tg_tao,tg_cap_nhat,id_phieu_kho_dieu_chinh,so_luong_dieu_chinh,tg_dieu_chinh_ton';

/** Cột tham gia ô tìm kiếm ở server. */
const DOT_SEARCH_SPEC = {
  text: ['ma_dot', 'ten_dot', 'trang_thai', 'ghi_chu'],
  numeric: ['id'],
  dates: ['ngay_bat_dau', 'ngay_ket_thuc'],
} as const;

interface DotRow {
  id: number;
  ma_dot: string | null;
  ten_dot: string | null;
  ngay_bat_dau: string | null;
  ngay_ket_thuc: string | null;
  trang_thai: string | null;
  id_nguoi_phu_trach: number;
  id_nguoi_tao: number | null;
  ghi_chu: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

interface ChiTietRow {
  id: number;
  id_dot_kiem_ke_pt: number;
  id_kho: number;
  id_hang_hoa: number;
  so_luong_so: number | string;
  so_luong_thuc_te: number | string | null;
  ket_qua: string | null;
  ghi_chu_dong: string | null;
  id_nguoi_kiem: number | null;
  ngay_kiem: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
  id_phieu_kho_dieu_chinh: number | null;
  so_luong_dieu_chinh: number | string | null;
  tg_dieu_chinh_ton: string | null;
}

interface DotEnrich {
  ten_nguoi_phu_trach?: string | null;
  ma_nguoi_phu_trach?: string | null;
  ten_nguoi_tao?: string | null;
  ma_nguoi_tao?: string | null;
}

function rowToDot(
  row: DotRow,
  idKhoList: string[],
  enrich?: DotEnrich,
  stats?: { so_hang_hoa: number; so_lech: number }
): DotKiemKePT {
  return {
    id: String(row.id),
    ma_dot: row.ma_dot ?? '',
    ten_dot: row.ten_dot ?? '',
    ngay_bat_dau: row.ngay_bat_dau ?? '',
    ngay_ket_thuc: row.ngay_ket_thuc ?? '',
    trang_thai: (row.trang_thai as TrangThaiDotKiemKePT) ?? 'draft',
    id_nguoi_phu_trach: String(row.id_nguoi_phu_trach),
    ten_nguoi_phu_trach: enrich?.ten_nguoi_phu_trach ?? null,
    ma_nguoi_phu_trach: enrich?.ma_nguoi_phu_trach ?? null,
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : null,
    ten_nguoi_tao: enrich?.ten_nguoi_tao ?? null,
    ma_nguoi_tao: enrich?.ma_nguoi_tao ?? null,
    id_kho: idKhoList,
    ghi_chu: row.ghi_chu ?? null,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
    so_kho: idKhoList.length,
    so_hang_hoa: stats?.so_hang_hoa ?? 0,
    so_lech: stats?.so_lech ?? 0,
  };
}

function rowToChiTiet(
  row: ChiTietRow,
  enrich?: { ten_kho?: string | null; ma_kho?: string | null; ma_hang?: string | null; ten_hang?: string | null; don_vi_tinh?: string | null; ten_nguoi_kiem?: string | null }
): ChiTietKiemKePT {
  return {
    id: String(row.id),
    id_dot_kiem_ke_pt: String(row.id_dot_kiem_ke_pt),
    id_kho: String(row.id_kho),
    ten_kho: enrich?.ten_kho ?? null,
    ma_kho: enrich?.ma_kho ?? null,
    id_hang_hoa: String(row.id_hang_hoa),
    ma_hang: enrich?.ma_hang ?? null,
    ten_hang: enrich?.ten_hang ?? null,
    don_vi_tinh: enrich?.don_vi_tinh ?? null,
    so_luong_so: Number(row.so_luong_so) || 0,
    so_luong_thuc_te: row.so_luong_thuc_te == null ? null : Number(row.so_luong_thuc_te),
    ket_qua: (row.ket_qua as ChiTietKiemKePT['ket_qua']) ?? 'chua_kiem',
    ghi_chu_dong: row.ghi_chu_dong ?? null,
    id_nguoi_kiem: row.id_nguoi_kiem != null ? String(row.id_nguoi_kiem) : null,
    ten_nguoi_kiem: enrich?.ten_nguoi_kiem ?? null,
    ngay_kiem: row.ngay_kiem ?? null,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
    id_phieu_kho_dieu_chinh: row.id_phieu_kho_dieu_chinh != null ? String(row.id_phieu_kho_dieu_chinh) : null,
    so_luong_dieu_chinh: row.so_luong_dieu_chinh == null ? null : Number(row.so_luong_dieu_chinh),
    tg_dieu_chinh_ton: row.tg_dieu_chinh_ton ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/*  Truy vấn phụ dùng chung                                                    */
/* -------------------------------------------------------------------------- */

/** Kho của nhiều đợt trong MỘT request. */
async function khoTheoDotIds(dotIds: number[]): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  if (dotIds.length === 0) return map;
  const { data, error } = await db
    .from(TABLE_DOT_KHO)
    .select('id_dot_kiem_ke_pt,id_kho')
    .in('id_dot_kiem_ke_pt', dotIds);
  if (error) throwSupabaseError(error);
  for (const r of (data ?? []) as { id_dot_kiem_ke_pt: number; id_kho: number }[]) {
    const arr = map.get(r.id_dot_kiem_ke_pt) ?? [];
    arr.push(String(r.id_kho));
    map.set(r.id_dot_kiem_ke_pt, arr);
  }
  return map;
}

/**
 * Id đợt có ít nhất một kho trong danh sách.
 * Tra id trước rồi `.in('id', …)` thay vì embed `!inner`: inner-join làm nhân
 * dòng cha nên `count: 'exact'` sai và phân trang lệch.
 */
async function dotIdsTheoKho(khoIds: string[]): Promise<number[]> {
  const ids = khoIds.map(Number).filter(Number.isFinite);
  if (ids.length === 0) return [];
  const { data, error } = await db.from(TABLE_DOT_KHO).select('id_dot_kiem_ke_pt').in('id_kho', ids);
  if (error) throwSupabaseError(error);
  return [...new Set((data ?? []).map((r) => Number((r as { id_dot_kiem_ke_pt: unknown }).id_dot_kiem_ke_pt)))];
}

/** Số dòng / số lệch của các đợt (một request `.in()`). */
async function thongKeChiTietTheoDot(
  dotIds: number[]
): Promise<Record<number, { so_hang_hoa: number; so_lech: number }>> {
  const out: Record<number, { so_hang_hoa: number; so_lech: number }> = {};
  if (dotIds.length === 0) return out;
  const { data } = await db.from(TABLE_CHI_TIET).select('id_dot_kiem_ke_pt,ket_qua').in('id_dot_kiem_ke_pt', dotIds);
  for (const r of (data ?? []) as { id_dot_kiem_ke_pt: number; ket_qua: string | null }[]) {
    if (!out[r.id_dot_kiem_ke_pt]) out[r.id_dot_kiem_ke_pt] = { so_hang_hoa: 0, so_lech: 0 };
    out[r.id_dot_kiem_ke_pt].so_hang_hoa += 1;
    if (r.ket_qua === 'thieu' || r.ket_qua === 'thua') out[r.id_dot_kiem_ke_pt].so_lech += 1;
  }
  return out;
}

interface PreResolved {
  /** Id đợt khớp bộ lọc kho người dùng chọn; `null` = không lọc theo kho. */
  dotIdsLoc: number[] | null;
  /** Id đợt nằm trong phạm vi xem; `null` = xem toàn phạm vi. */
  dotIdsPhamVi: number[] | null;
  /** Id nhân viên khớp từ khoá (tìm theo tên người phụ trách / người tạo). */
  nhanVienIdsTheoTen: number[];
}

/**
 * Điều kiện chung cho cả trang danh sách, bản xuất file và bản tóm tắt.
 * Thuần: mọi truy vấn phụ đã giải sẵn trong `pre`.
 */
function applyKKPTListQuery<T>(builder: T, query: DotKiemKePTListServerQuery, pre: PreResolved): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sel: any = builder;

  if (query.trangThai.length > 0) sel = sel.in('trang_thai', query.trangThai);

  // Lọc kỳ theo GIAO khoảng: "đợt có chạm vào kỳ", không phải "đợt nằm trọn trong kỳ".
  if (query.ngayFrom) sel = sel.gte('ngay_ket_thuc', query.ngayFrom);
  if (query.ngayTo) sel = sel.lte('ngay_bat_dau', query.ngayTo);

  if (query.idNguoiPhuTrach.length > 0) {
    sel = sel.in('id_nguoi_phu_trach', query.idNguoiPhuTrach.map(Number).filter(Number.isFinite));
  }

  if (pre.dotIdsLoc != null) {
    sel = pre.dotIdsLoc.length === 0 ? sel.eq('id', -1) : sel.in('id', pre.dotIdsLoc);
  }

  if (pre.dotIdsPhamVi != null) {
    const ve: string[] = [];
    const me = query.currentEmployeeId != null ? Number(query.currentEmployeeId) : NaN;
    if (Number.isFinite(me)) ve.push(`id_nguoi_phu_trach.eq.${me}`, `id_nguoi_tao.eq.${me}`);
    if (pre.dotIdsPhamVi.length > 0) ve.push(`id.in.(${pre.dotIdsPhamVi.join(',')})`);
    // Không điều kiện nào hợp lệ = không được xem gì, KHÔNG phải xem tất cả.
    sel = ve.length > 0 ? sel.or(ve.join(',')) : sel.eq('id', -1);
  }

  if (query.searchTerm) {
    const parts = buildPostgrestSearchOr(query.searchTerm, DOT_SEARCH_SPEC);
    if (pre.nhanVienIdsTheoTen.length > 0) {
      parts.push(
        `id_nguoi_phu_trach.in.(${pre.nhanVienIdsTheoTen.join(',')})`,
        `id_nguoi_tao.in.(${pre.nhanVienIdsTheoTen.join(',')})`
      );
    }
    if (parts.length > 0) sel = sel.or(parts.join(','));
  }

  const col = query.sortColumn ?? KKPT_SORT_MAC_DINH.column;
  const asc = query.sortDirection === 'asc';
  // Khoá phụ `id` để thứ tự ổn định giữa các trang.
  return sel.order(col, { ascending: asc }).order('id', { ascending: false }) as T;
}

async function giaiCacDieuKienPhu(query: DotKiemKePTListServerQuery): Promise<PreResolved> {
  const employees = await getEmployeesRef();
  const term = query.searchTerm.toLowerCase();
  const nhanVienIdsTheoTen = term
    ? employees
        .filter(
          (e) =>
            (e.ho_ten ?? '').toLowerCase().includes(term) ||
            (e.ma_nhan_vien ?? '').toLowerCase().includes(term)
        )
        .map((e) => Number(e.id))
        .filter(Number.isFinite)
    : [];

  const dotIdsLoc = query.idKho.length > 0 ? await dotIdsTheoKho(query.idKho) : null;
  const dotIdsPhamVi = query.viewAll ? null : await dotIdsTheoKho(query.allowedKhoIds);

  return { dotIdsLoc, dotIdsPhamVi, nhanVienIdsTheoTen };
}

async function enrichDotRows(rows: DotRow[]): Promise<DotKiemKePT[]> {
  const employees = await getEmployeesRef();
  const empMap = new Map(employees.map((e) => [e.id, { ten: e.ho_ten, ma: e.ma_nhan_vien }]));
  const dotIds = rows.map((r) => r.id);
  const [khoMap, stats] = await Promise.all([khoTheoDotIds(dotIds), thongKeChiTietTheoDot(dotIds)]);
  return rows.map((row) => {
    const empPhuTrach = empMap.get(String(row.id_nguoi_phu_trach));
    const empTao = row.id_nguoi_tao != null ? empMap.get(String(row.id_nguoi_tao)) : undefined;
    return rowToDot(
      row,
      khoMap.get(row.id) ?? [],
      {
        ten_nguoi_phu_trach: empPhuTrach?.ten ?? null,
        ma_nguoi_phu_trach: empPhuTrach?.ma ?? null,
        ten_nguoi_tao: empTao?.ten ?? null,
        ma_nguoi_tao: empTao?.ma ?? null,
      },
      stats[row.id]
    );
  });
}

/* -------------------------------------------------------------------------- */
/*  Danh sách                                                                  */
/* -------------------------------------------------------------------------- */

/** Một trang danh sách đợt — lọc / sắp xếp / cắt trang ở PostgREST. */
export async function getDotKiemKePTPage(
  query: DotKiemKePTListServerQuery
): Promise<PaginatedTableResult<DotKiemKePT>> {
  const pre = await giaiCacDieuKienPhu(query);

  const result = await fetchTablePage<DotRow>(query.page, query.pageSize, async (from, to) => {
    const sel = applyKKPTListQuery(db.from(TABLE_DOT).select(DOT_COLUMNS, { count: 'exact' }), query, pre);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (sel as any).range(from, to);
    return { data: (res.data as DotRow[] | null) ?? null, error: res.error, count: res.count };
  });

  return { ...result, data: await enrichDotRows(result.data) };
}

/** Toàn bộ đợt khớp bộ lọc — CHỈ gọi khi bấm Xuất file. */
export async function fetchAllDotKiemKePTForListQuery(
  query: DotKiemKePTListServerQuery
): Promise<DotKiemKePT[]> {
  const pre = await giaiCacDieuKienPhu(query);
  const rows = await fetchAllRows<DotRow>((from, to) => {
    const sel = applyKKPTListQuery(db.from(TABLE_DOT).select(DOT_COLUMNS), query, pre);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (sel as any).range(from, to);
  });
  return enrichDotRows(rows);
}

/**
 * Tóm tắt TOÀN BỘ đợt trong phạm vi xem — nguồn đếm chip lọc và tab Thống kê.
 * Chip phải đếm trên toàn bộ dữ liệu, không phải trang đang xem.
 */
export async function getDotKiemKePTTomTat(
  phamVi: { viewAll: boolean; allowedKhoIds: string[]; currentEmployeeId: string | null }
): Promise<DotKiemKePTTomTat[]> {
  const employees = await getEmployeesRef();
  const empMap = new Map(employees.map((e) => [e.id, e.ho_ten]));
  const dotIdsPhamVi = phamVi.viewAll ? null : await dotIdsTheoKho(phamVi.allowedKhoIds);

  let sel = db.from(TABLE_DOT).select(DOT_TOM_TAT_COLUMNS);
  if (dotIdsPhamVi != null) {
    const ve: string[] = [];
    const me = phamVi.currentEmployeeId != null ? Number(phamVi.currentEmployeeId) : NaN;
    if (Number.isFinite(me)) ve.push(`id_nguoi_phu_trach.eq.${me}`, `id_nguoi_tao.eq.${me}`);
    if (dotIdsPhamVi.length > 0) ve.push(`id.in.(${dotIdsPhamVi.join(',')})`);
    sel = ve.length > 0 ? sel.or(ve.join(',')) : sel.eq('id', -1);
  }
  const { data, error } = await sel
    .order('ngay_ket_thuc', { ascending: false })
    .order('id', { ascending: false });
  if (error) throwSupabaseError(error);

  const rows = (data ?? []) as DotRow[];
  const dotIds = rows.map((r) => r.id);
  const [khoMap, stats] = await Promise.all([khoTheoDotIds(dotIds), thongKeChiTietTheoDot(dotIds)]);

  return rows.map((row) => {
    const idKho = khoMap.get(row.id) ?? [];
    const st = stats[row.id];
    return {
      id: String(row.id),
      ma_dot: row.ma_dot ?? '',
      ten_dot: row.ten_dot ?? '',
      ngay_bat_dau: row.ngay_bat_dau ?? '',
      ngay_ket_thuc: row.ngay_ket_thuc ?? '',
      trang_thai: (row.trang_thai as TrangThaiDotKiemKePT) ?? 'draft',
      id_nguoi_phu_trach: String(row.id_nguoi_phu_trach),
      ten_nguoi_phu_trach: empMap.get(String(row.id_nguoi_phu_trach)) ?? null,
      id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : null,
      ten_nguoi_tao: row.id_nguoi_tao != null ? empMap.get(String(row.id_nguoi_tao)) ?? null : null,
      id_kho: idKho,
      so_kho: idKho.length,
      so_hang_hoa: st?.so_hang_hoa ?? 0,
      so_lech: st?.so_lech ?? 0,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*  Đợt                                                                        */
/* -------------------------------------------------------------------------- */

export async function getDotKiemKePTById(id: string): Promise<DotKiemKePT | null> {
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) return null;
  const { data: row, error } = await db.from(TABLE_DOT).select(DOT_COLUMNS).eq('id', idNum).maybeSingle();
  if (error) throwSupabaseError(error);
  if (!row) return null;
  const [enriched] = await enrichDotRows([row as DotRow]);
  return enriched ?? null;
}

/** idNguoiTao = fp_var_nhan_vien.id của user đăng nhập (không fallback sang người phụ trách). */
export async function createDotKiemKePT(
  data: DotKiemKePTCreate,
  idNguoiTao?: string | null
): Promise<DotKiemKePT> {
  const idNguoiTaoNum =
    idNguoiTao != null && idNguoiTao !== '' && Number.isFinite(Number(idNguoiTao)) ? Number(idNguoiTao) : null;
  const { data: row, error } = await db
    .from(TABLE_DOT)
    .insert({
      ma_dot: data.ma_dot.trim(),
      ten_dot: data.ten_dot.trim(),
      ngay_bat_dau: data.ngay_bat_dau,
      ngay_ket_thuc: data.ngay_ket_thuc,
      trang_thai: 'draft',
      id_nguoi_phu_trach: Number(data.id_nguoi_phu_trach),
      id_nguoi_tao: idNguoiTaoNum,
      ghi_chu: data.ghi_chu?.trim() || null,
    })
    .select(DOT_COLUMNS)
    .single();
  if (error) throwSupabaseError(error);

  const idDot = (row as DotRow).id;
  if ((data.id_kho ?? []).length > 0) {
    const { error: errKho } = await db
      .from(TABLE_DOT_KHO)
      .insert(data.id_kho.map((id_kho) => ({ id_dot_kiem_ke_pt: idDot, id_kho: Number(id_kho) })));
    if (errKho) throwSupabaseError(errKho);
  }
  const created = await getDotKiemKePTById(String(idDot));
  if (!created) throw new Error(i18n.t('kiemKeKhoPT.service.notFound'));
  return created;
}

export async function updateDotKiemKePT(
  id: string,
  data: Partial<DotKiemKePTCreate>,
  /** Cấp cao (cap_bac = 1 hoặc admin/all) được sửa cả đợt đã hoàn thành. */
  capCao = false
): Promise<DotKiemKePT> {
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) throw new Error(i18n.t('kiemKeKhoPT.service.notFound'));
  const existing = await getDotKiemKePTById(id);
  if (!existing) throw new Error(i18n.t('kiemKeKhoPT.service.notFound'));
  if (!coTheSuaDotPT(existing.trang_thai, capCao)) {
    // Ghi chú vẫn cho sửa: đó là chỗ ghi lý do chốt sổ, không đụng số liệu.
    const onlyGhiChu = data.ghi_chu !== undefined && Object.keys(data).length === 1;
    if (!onlyGhiChu) throw new Error(i18n.t('kiemKeKhoPT.service.hoanThanhChiCapCao'));
  }

  const payload: Record<string, unknown> = {};
  if (data.ma_dot != null) payload.ma_dot = data.ma_dot.trim();
  if (data.ten_dot != null) payload.ten_dot = data.ten_dot.trim();
  if (data.ngay_bat_dau != null) payload.ngay_bat_dau = data.ngay_bat_dau;
  if (data.ngay_ket_thuc != null) payload.ngay_ket_thuc = data.ngay_ket_thuc;
  if (data.id_nguoi_phu_trach != null) payload.id_nguoi_phu_trach = Number(data.id_nguoi_phu_trach);
  if (data.ghi_chu !== undefined) payload.ghi_chu = data.ghi_chu?.trim() || null;
  if (Object.keys(payload).length > 0) {
    const { error } = await db.from(TABLE_DOT).update(payload).eq('id', idNum);
    if (error) throwSupabaseError(error);
  }

  if (data.id_kho != null) {
    await db.from(TABLE_DOT_KHO).delete().eq('id_dot_kiem_ke_pt', idNum);
    if (data.id_kho.length > 0) {
      const { error } = await db
        .from(TABLE_DOT_KHO)
        .insert(data.id_kho.map((id_kho) => ({ id_dot_kiem_ke_pt: idNum, id_kho: Number(id_kho) })));
      if (error) throwSupabaseError(error);
    }
  }

  const updated = await getDotKiemKePTById(id);
  if (!updated) throw new Error(i18n.t('kiemKeKhoPT.service.notFound'));
  return updated;
}

export async function deleteDotKiemKePT(ids: string[], capCao = false): Promise<void> {
  const idNums = ids.map(Number).filter(Number.isFinite);
  if (idNums.length === 0) return;
  const { data: dots } = await db.from(TABLE_DOT).select('id,trang_thai').in('id', idNums);
  const chanLai = (dots ?? []).filter(
    (d: { trang_thai: TrangThaiDotKiemKePT }) => !coTheXoaDotPT(d.trang_thai, capCao)
  );
  if (chanLai.length > 0) throw new Error(i18n.t('kiemKeKhoPT.service.hoanThanhChiCapCaoXoa'));
  const { error } = await db.from(TABLE_DOT).delete().in('id', idNums);
  if (error) throwSupabaseError(error);
}

export async function changeTrangThaiDotPT(
  id: string,
  trang_thai: TrangThaiDotKiemKePT,
  capCao = false
): Promise<DotKiemKePT> {
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) throw new Error(i18n.t('kiemKeKhoPT.service.notFound'));
  const existing = await getDotKiemKePTById(id);
  if (!existing) throw new Error(i18n.t('kiemKeKhoPT.service.notFound'));
  // Chặn lối vòng: đưa đợt đã chốt về Đang kiểm kê rồi sửa thoải mái.
  if (!coTheChuyenTrangThaiDotPT(existing.trang_thai, capCao)) {
    throw new Error(i18n.t('kiemKeKhoPT.service.hoanThanhChiCapCaoDoiTrangThai'));
  }
  const { error } = await db.from(TABLE_DOT).update({ trang_thai }).eq('id', idNum);
  if (error) throwSupabaseError(error);
  const updated = await getDotKiemKePTById(id);
  if (!updated) throw new Error(i18n.t('kiemKeKhoPT.service.notFound'));
  return updated;
}

export async function hoanThanhDotPT(id: string): Promise<DotKiemKePT> {
  const dot = await getDotKiemKePTById(id);
  if (!dot) throw new Error(i18n.t('kiemKeKhoPT.service.notFound'));
  if (dot.trang_thai !== 'dang_kiem_ke') {
    throw new Error(i18n.t('kiemKeKhoPT.service.onlyHoanThanhWhenDangKiem'));
  }
  const { error } = await db.from(TABLE_DOT).update({ trang_thai: 'hoan_thanh' }).eq('id', Number(id));
  if (error) throwSupabaseError(error);
  const updated = await getDotKiemKePTById(id);
  if (!updated) throw new Error(i18n.t('kiemKeKhoPT.service.notFound'));
  return updated;
}

/** Số thứ tự tiếp theo cho mã đợt (app ghép thành KKPT-YYYY-NNNN). */
export async function getNextMaDotKiemKePT(): Promise<number> {
  const { data, error } = await db.rpc('get_next_ma_dot_farm_kiem_ke_pt');
  if (error) throwSupabaseError(error);
  const n = typeof data === 'number' ? data : Number(data);
  return Number.isFinite(n) ? n : 1;
}

/* -------------------------------------------------------------------------- */
/*  Chi tiết                                                                   */
/* -------------------------------------------------------------------------- */

export async function getChiTietByDotPT(id_dot: string): Promise<ChiTietKiemKePT[]> {
  const idNum = Number(id_dot);
  if (!Number.isFinite(idNum)) return [];
  const { data: rows, error } = await db
    .from(TABLE_CHI_TIET)
    .select(CHI_TIET_COLUMNS)
    .eq('id_dot_kiem_ke_pt', idNum)
    .order('id_kho')
    .order('id_hang_hoa');
  if (error) throwSupabaseError(error);

  const [khoList, hangHoaList, employees] = await Promise.all([
    getKhoRef(),
    getFarmHangHoaRef(),
    getEmployeesRef(),
  ]);
  const khoMap = new Map(khoList.map((k) => [k.id, { ten: k.ten_kho, ma: k.ma_kho }]));
  const hhMap = new Map(hangHoaList.map((h) => [h.id, { ma: h.ma_hang_hoa, ten: h.ten_hang_hoa, dvt: h.dvt }]));
  const empMap = new Map(employees.map((e) => [e.id, e.ho_ten]));

  return ((rows ?? []) as ChiTietRow[]).map((row) => {
    const kho = khoMap.get(String(row.id_kho));
    const hh = hhMap.get(String(row.id_hang_hoa));
    return rowToChiTiet(row, {
      ten_kho: kho?.ten ?? null,
      ma_kho: kho?.ma ?? null,
      ma_hang: hh?.ma ?? null,
      ten_hang: hh?.ten ?? null,
      don_vi_tinh: hh?.dvt ?? null,
      ten_nguoi_kiem: row.id_nguoi_kiem != null ? empMap.get(String(row.id_nguoi_kiem)) ?? null : null,
    });
  });
}

/**
 * Snapshot tồn theo phạm vi đợt → sinh dòng kiểm kê, rồi chuyển đợt sang `dang_kiem_ke`.
 *
 * Tồn lấy từ `v_farm_ton_kho_phan_thuoc` — view tính mọi phiếu `trang_thai <> 'Không duyệt'`
 * (kể cả "Chờ duyệt"), nên phiếu điều chỉnh sinh ra sau này ("Đã duyệt") có hiệu lực ngay.
 */
export async function taoDanhSachKiemKePT(
  id_dot: string,
  filters?: TaoDanhSachKiemKePTFilters,
  capCao = false
): Promise<ChiTietKiemKePT[]> {
  const dot = await getDotKiemKePTById(id_dot);
  if (!dot) throw new Error(i18n.t('kiemKeKhoPT.service.notFound'));
  if (!coTheSuaChiTietPT(dot.trang_thai, capCao)) {
    throw new Error(i18n.t('kiemKeKhoPT.service.hoanThanhChiCapCao'));
  }
  if (!dot.id_kho.length) throw new Error(i18n.t('kiemKeKhoPT.service.dotChuaChonKho'));

  const khoIdsToProcess = filters?.id_kho?.length
    ? filters.id_kho.filter((k) => dot.id_kho.includes(k))
    : dot.id_kho;
  if (khoIdsToProcess.length === 0) throw new Error(i18n.t('kiemKeKhoPT.service.dotChuaChonKho'));

  const [hangHoaList, existing, tonRows] = await Promise.all([
    getFarmHangHoaRef(),
    getChiTietByDotPT(id_dot),
    // Một request cho mọi kho trong phạm vi, thay vì một request mỗi kho.
    getTonKhoPTMatrixByKhoIds(khoIdsToProcess),
  ]);

  // `fp_farm_danh_sach_hang_hoa` không còn cột trang_thai → chỉ lọc theo danh mục / hàng hóa.
  const hangHoaCanKiem = hangHoaList.filter((h) => {
    if (filters?.id_hang_hoa?.length && !filters.id_hang_hoa.includes(h.id)) return false;
    if (filters?.id_danh_muc?.length && (!h.danh_muc_id || !filters.id_danh_muc.includes(h.danh_muc_id))) return false;
    return true;
  });

  const tonByKho = new Map<string, Map<string, number>>();
  for (const r of tonRows) {
    const m = tonByKho.get(r.id_kho) ?? new Map<string, number>();
    m.set(r.id_hang_hoa, r.so_luong);
    tonByKho.set(r.id_kho, m);
  }

  const existingKeys = new Set(existing.map((c) => `${c.id_kho}|${c.id_hang_hoa}`));
  const idDotNum = Number(id_dot);
  const toInsert: {
    id_dot_kiem_ke_pt: number;
    id_kho: number;
    id_hang_hoa: number;
    so_luong_so: number;
    ket_qua: string;
  }[] = [];

  for (const id_kho of khoIdsToProcess) {
    const tonMap = tonByKho.get(id_kho) ?? new Map<string, number>();
    for (const hh of hangHoaCanKiem) {
      const key = `${id_kho}|${hh.id}`;
      if (existingKeys.has(key)) continue;
      toInsert.push({
        id_dot_kiem_ke_pt: idDotNum,
        id_kho: Number(id_kho),
        id_hang_hoa: Number(hh.id),
        so_luong_so: tonMap.get(hh.id) ?? 0,
        ket_qua: 'chua_kiem',
      });
      existingKeys.add(key);
    }
  }

  if (toInsert.length === 0) throw new Error(i18n.t('kiemKeKhoPT.service.taoDanhSachEmpty'));

  const { error } = await db.from(TABLE_CHI_TIET).insert(toInsert);
  if (error) throwSupabaseError(error);
  const { error: errDot } = await db.from(TABLE_DOT).update({ trang_thai: 'dang_kiem_ke' }).eq('id', idDotNum);
  if (errDot) throwSupabaseError(errDot);

  return getChiTietByDotPT(id_dot);
}

/** Thêm một hàng hóa vào nhiều kho trong MỘT request (bản kiểm kê kho cũ gọi tuần tự từng kho). */
export async function createChiTietKiemKePT(
  id_dot: string,
  id_kho_list: string[],
  id_hang_hoa: string,
  capCao = false
): Promise<ChiTietKiemKePT[]> {
  const dot = await getDotKiemKePTById(id_dot);
  if (!dot) throw new Error(i18n.t('kiemKeKhoPT.service.notFound'));
  if (!coTheSuaChiTietPT(dot.trang_thai, capCao)) {
    throw new Error(i18n.t('kiemKeKhoPT.service.hoanThanhChiCapCao'));
  }

  const khoHopLe = id_kho_list.filter((k) => dot.id_kho.includes(k));
  if (khoHopLe.length === 0) throw new Error(i18n.t('kiemKeKhoPT.service.khoNotInDot'));

  const existing = await getChiTietByDotPT(id_dot);
  const existingKeys = new Set(existing.map((c) => `${c.id_kho}|${c.id_hang_hoa}`));
  const khoCanThem = khoHopLe.filter((k) => !existingKeys.has(`${k}|${id_hang_hoa}`));
  if (khoCanThem.length === 0) throw new Error(i18n.t('kiemKeKhoPT.service.chiTietAlreadyExists'));

  const tonRows = await getTonKhoPTMatrixByKhoIds(khoCanThem);
  const tonMap = new Map(tonRows.filter((r) => r.id_hang_hoa === id_hang_hoa).map((r) => [r.id_kho, r.so_luong]));

  const { error } = await db.from(TABLE_CHI_TIET).insert(
    khoCanThem.map((id_kho) => ({
      id_dot_kiem_ke_pt: Number(id_dot),
      id_kho: Number(id_kho),
      id_hang_hoa: Number(id_hang_hoa),
      so_luong_so: tonMap.get(id_kho) ?? 0,
      so_luong_thuc_te: null,
      ket_qua: 'chua_kiem',
    }))
  );
  if (error) throwSupabaseError(error);
  return getChiTietByDotPT(id_dot);
}

export async function deleteChiTietKiemKePT(id_chi_tiet: string, capCao = false): Promise<void> {
  const idNum = Number(id_chi_tiet);
  if (!Number.isFinite(idNum)) throw new Error(i18n.t('kiemKeKhoPT.service.chiTietNotFound'));
  const { data: row, error: fetchErr } = await db
    .from(TABLE_CHI_TIET)
    .select('id_dot_kiem_ke_pt')
    .eq('id', idNum)
    .maybeSingle();
  if (fetchErr || !row) throw new Error(i18n.t('kiemKeKhoPT.service.chiTietNotFound'));
  const dot = await getDotKiemKePTById(String((row as { id_dot_kiem_ke_pt: number }).id_dot_kiem_ke_pt));
  if (!dot) throw new Error(i18n.t('kiemKeKhoPT.service.notFound'));
  if (!coTheSuaChiTietPT(dot.trang_thai, capCao)) {
    throw new Error(i18n.t('kiemKeKhoPT.service.hoanThanhChiCapCao'));
  }
  const { error } = await db.from(TABLE_CHI_TIET).delete().eq('id', idNum);
  if (error) throwSupabaseError(error);
}

export async function updateChiTietKetQuaPT(
  id_chi_tiet: string,
  data: ChiTietKiemKePTUpdate,
  id_nguoi_kiem: string
): Promise<ChiTietKiemKePT[]> {
  const idNum = Number(id_chi_tiet);
  if (!Number.isFinite(idNum)) throw new Error(i18n.t('kiemKeKhoPT.service.chiTietNotFound'));
  const { data: row, error: fetchErr } = await db
    .from(TABLE_CHI_TIET)
    .select(CHI_TIET_COLUMNS)
    .eq('id', idNum)
    .maybeSingle();
  if (fetchErr || !row) throw new Error(i18n.t('kiemKeKhoPT.service.chiTietNotFound'));

  const r = row as ChiTietRow;
  const soLuongThucTe =
    data.so_luong_thuc_te !== undefined
      ? data.so_luong_thuc_te
      : r.so_luong_thuc_te == null
        ? null
        : Number(r.so_luong_thuc_te);
  const ghiChuDong = data.ghi_chu_dong !== undefined ? data.ghi_chu_dong : r.ghi_chu_dong;

  const { error } = await db
    .from(TABLE_CHI_TIET)
    .update({
      so_luong_thuc_te: soLuongThucTe ?? null,
      ghi_chu_dong: ghiChuDong?.trim() || null,
      ket_qua: computeKetQuaKiemKePT(Number(r.so_luong_so), soLuongThucTe ?? null),
      id_nguoi_kiem: Number(id_nguoi_kiem),
      ngay_kiem: new Date().toISOString(),
    })
    .eq('id', idNum);
  if (error) throwSupabaseError(error);
  return getChiTietByDotPT(String(r.id_dot_kiem_ke_pt));
}

/* -------------------------------------------------------------------------- */
/*  Điều chỉnh tồn (RPC)                                                       */
/* -------------------------------------------------------------------------- */

function throwKiemKePTRpcError(err: { message?: string; code?: string }): never {
  const m = String(err.message ?? '');
  const lower = m.toLowerCase();
  if (m.includes('kiem_ke_chi_tiet_not_found')) throw new Error(i18n.t('kiemKeKhoPT.service.rpcChiTietNotFound'));
  if (m.includes('kiem_ke_dot_not_found')) throw new Error(i18n.t('kiemKeKhoPT.service.rpcDotNotFound'));
  if (m.includes('kiem_ke_dot_not_dang_kiem_ke')) throw new Error(i18n.t('kiemKeKhoPT.service.rpcDotNotDangKiemKe'));
  if (m.includes('kiem_ke_already_adjusted')) throw new Error(i18n.t('kiemKeKhoPT.service.rpcAlreadyAdjusted'));
  if (m.includes('kiem_ke_no_thuc_te')) throw new Error(i18n.t('kiemKeKhoPT.service.noThucTeForDieuChinh'));
  if (m.includes('kiem_ke_no_variance')) throw new Error(i18n.t('kiemKeKhoPT.service.rpcNoVariance'));
  if (
    err.code === 'PGRST202' ||
    /could not find the function/i.test(m) ||
    (lower.includes('schema cache') && lower.includes('function'))
  ) {
    throw new Error(i18n.t('kiemKeKhoPT.service.rpcFunctionNotFound'));
  }
  throw new Error(m || i18n.t('kiemKeKhoPT.service.rpcUnknown'));
}

export async function dieuChinhTonTheoKetQuaPT(
  id_chi_tiet: string,
  p_nguoi_tao_id?: number | null
): Promise<void> {
  const idNum = Number(id_chi_tiet);
  if (!Number.isFinite(idNum)) throw new Error(i18n.t('kiemKeKhoPT.service.chiTietNotFound'));
  const nv = p_nguoi_tao_id != null && Number.isFinite(Number(p_nguoi_tao_id)) ? Number(p_nguoi_tao_id) : null;
  const { error } = await db.rpc('farm_kiem_ke_pt_apply_dieu_chinh_chi_tiet', {
    p_id_chi_tiet: idNum,
    p_nguoi_tao_id: nv,
  });
  if (error) throwKiemKePTRpcError(error);
}

export async function dieuChinhTonTheoDotPT(
  id_dot: string,
  p_nguoi_tao_id?: number | null
): Promise<number> {
  const idNum = Number(id_dot);
  if (!Number.isFinite(idNum)) throw new Error(i18n.t('kiemKeKhoPT.service.notFound'));
  const nv = p_nguoi_tao_id != null && Number.isFinite(Number(p_nguoi_tao_id)) ? Number(p_nguoi_tao_id) : null;
  const { data, error } = await db.rpc('farm_kiem_ke_pt_apply_dieu_chinh_dot', {
    p_id_dot: idNum,
    p_nguoi_tao_id: nv,
  });
  if (error) throwKiemKePTRpcError(error);
  const n = typeof data === 'number' ? data : Number(data);
  return Number.isFinite(n) ? n : 0;
}
