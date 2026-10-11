/**
 * Service đợt kiểm kê kho – DB: (fp_mh_dot_kiem_ke_kho, fp_mh_dot_kiem_ke_kho_kho, fp_mh_dot_kiem_ke_kho_chi_tiet).
 */
import { db, fetchTablePage, fetchAllRows, throwDbError, type PaginatedTableResult } from '../../../../lib/db';
import { buildPostgrestSearchOr } from '../../../../lib/postgrest-search';
import type {
  DotKiemKeKho,
  DotKiemKeKhoTomTat,
  ChiTietKiemKeKho,
  DotKiemKeKhoCreate,
  ChiTietKiemKeKhoUpdate,
  TrangThaiDotKiemKeKho,
  KetQuaKiemKeKho,
} from '../core/types';
/** Tham số lọc danh sách đợt (trùng shape với GetDotKiemKeKhoListParams) */
export interface GetDotKiemKeKhoListParamsDb {
  filter?: 'all' | 'mine';
  id_nguoi?: string;
  q?: string;
  trang_thai_dot?: TrangThaiDotKiemKeKho[];
  dateFrom?: string;
  dateTo?: string;
  id_nguoi_phu_trach?: string[];
  id_kho?: string[];
}

export interface TaoDanhSachKiemKeKhoFiltersDb {
  id_kho?: string[];
  id_danh_muc?: string[];
  id_hang_hoa?: string[];
}
import { getKhoRef } from '../../danh-sach-kho/services/kho-service';
import { getHangHoaRef } from '../../danh-sach-hang-hoa/services/hang-hoa-service';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import i18n from '../../../../lib/i18n';
import {
  coTheSuaDot,
  coTheXoaDot,
  coTheSuaChiTiet,
  coTheSuaDongKiemKe,
  coTheSuaSoLuongSo,
  coTheChuyenTrangThaiDot,
} from '../core/quyen-sua-dot';

const TABLE_DOT = 'fp_mh_dot_kiem_ke_kho';
const TABLE_DOT_KHO = 'fp_mh_dot_kiem_ke_kho_kho';
const TABLE_CHI_TIET = 'fp_mh_dot_kiem_ke_kho_chi_tiet';
const TABLE_PHIEU_KHO = 'fp_mh_phieu_kho';

const DOT_KK_KHO_COLUMNS =
  'id,ma_dot,ten_dot,ngay_bat_dau,ngay_ket_thuc,trang_thai,id_nguoi_phu_trach,id_nguoi_tao,ghi_chu,tg_tao,tg_cap_nhat';
const CHI_TIET_KK_KHO_COLUMNS =
  'id,id_dot_kiem_ke_kho,id_kho,id_hang_hoa,so_luong_so,so_luong_thuc_te,ket_qua,ghi_chu_dong,id_nguoi_kiem,ngay_kiem,tg_tao,tg_cap_nhat,id_phieu_kho_dieu_chinh,so_luong_dieu_chinh,tg_dieu_chinh_ton';

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
  id_dot_kiem_ke_kho: number;
  id_kho: number;
  id_hang_hoa: number;
  so_luong_so: number;
  so_luong_thuc_te: number | null;
  ket_qua: string | null;
  ghi_chu_dong: string | null;
  id_nguoi_kiem: number | null;
  ngay_kiem: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
  id_phieu_kho_dieu_chinh?: number | null;
  so_luong_dieu_chinh?: number | null;
  tg_dieu_chinh_ton?: string | null;
}

function rowToDot(
  row: DotRow,
  idKhoList: string[],
  enrich?: {
    ten_nguoi_phu_trach?: string | null;
    ma_nguoi_phu_trach?: string | null;
    ten_nguoi_tao?: string | null;
    ma_nguoi_tao?: string | null;
  },
  stats?: { so_hang_hoa: number; so_lech: number }
): DotKiemKeKho {
  return {
    id: String(row.id),
    ma_dot: row.ma_dot ?? '',
    ten_dot: row.ten_dot ?? '',
    ngay_bat_dau: row.ngay_bat_dau ?? '',
    ngay_ket_thuc: row.ngay_ket_thuc ?? '',
    trang_thai: (row.trang_thai as TrangThaiDotKiemKeKho) ?? 'draft',
    id_nguoi_phu_trach: String(row.id_nguoi_phu_trach),
    ten_nguoi_phu_trach: enrich?.ten_nguoi_phu_trach ?? null,
    ma_nguoi_phu_trach: enrich?.ma_nguoi_phu_trach ?? null,
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : null,
    ten_nguoi_tao: enrich?.ten_nguoi_tao ?? null,
    ma_nguoi_tao: enrich?.ma_nguoi_tao ?? null,
    id_kho: idKhoList,
    ghi_chu: row.ghi_chu ?? null,
    trang_thai_active: 1,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
    so_kho: idKhoList.length,
    so_hang_hoa: stats?.so_hang_hoa ?? 0,
    so_lech: stats?.so_lech ?? 0,
  };
}

function rowToChiTiet(
  row: ChiTietRow,
  enrich?: { ten_kho?: string; ma_kho?: string; ma_hang?: string; ten_hang?: string; don_vi_tinh?: string }
): ChiTietKiemKeKho {
  return {
    id: String(row.id),
    id_dot_kiem_ke_kho: String(row.id_dot_kiem_ke_kho),
    id_kho: String(row.id_kho),
    ten_kho: enrich?.ten_kho ?? null,
    ma_kho: enrich?.ma_kho ?? null,
    id_hang_hoa: String(row.id_hang_hoa),
    ma_hang: enrich?.ma_hang ?? null,
    ten_hang: enrich?.ten_hang ?? null,
    don_vi_tinh: enrich?.don_vi_tinh ?? null,
    so_luong_so: Number(row.so_luong_so),
    so_luong_thuc_te: row.so_luong_thuc_te != null ? Number(row.so_luong_thuc_te) : null,
    ket_qua: (row.ket_qua as KetQuaKiemKeKho) ?? 'chua_kiem',
    ghi_chu_dong: row.ghi_chu_dong ?? null,
    id_nguoi_kiem: row.id_nguoi_kiem != null ? String(row.id_nguoi_kiem) : null,
    ten_nguoi_kiem: null,
    ngay_kiem: row.ngay_kiem ?? null,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
    id_phieu_kho_dieu_chinh:
      row.id_phieu_kho_dieu_chinh != null ? String(row.id_phieu_kho_dieu_chinh) : null,
    so_luong_dieu_chinh:
      row.so_luong_dieu_chinh != null ? Number(row.so_luong_dieu_chinh) : null,
    tg_dieu_chinh_ton: row.tg_dieu_chinh_ton ?? null,
  };
}

/** Dòng chi tiết trỏ tới phiếu kho đã xóa → cập nhật DB + bản in-memory để UI/RPC khớp. */
async function reconcileKiemKeChiTietOrphanPhieuLinks(rows: ChiTietRow[]): Promise<void> {
  const phieuIds = [
    ...new Set(
      rows
        .map((r) => r.id_phieu_kho_dieu_chinh)
        .filter((id): id is number => id != null && !Number.isNaN(Number(id)))
        .map((id) => Number(id))
    ),
  ];
  if (phieuIds.length === 0) return;
  const { data: phieuRows, error: phieuErr } = await db.from(TABLE_PHIEU_KHO).select('id').in('id', phieuIds);
  if (phieuErr) throwDbError(phieuErr);
  const existing = new Set((phieuRows ?? []).map((p: { id: number }) => Number(p.id)));
  const orphanLineIds = rows
    .filter((r) => r.id_phieu_kho_dieu_chinh != null && !existing.has(Number(r.id_phieu_kho_dieu_chinh)))
    .map((r) => r.id);
  if (orphanLineIds.length === 0) return;
  const { error: upErr } = await db
    .from(TABLE_CHI_TIET)
    .update({
      id_phieu_kho_dieu_chinh: null,
      so_luong_dieu_chinh: null,
      tg_dieu_chinh_ton: null,
    })
    .in('id', orphanLineIds);
  if (upErr) throwDbError(upErr);
  const orphanSet = new Set(orphanLineIds);
  for (const r of rows) {
    if (orphanSet.has(r.id)) {
      r.id_phieu_kho_dieu_chinh = null;
      r.so_luong_dieu_chinh = null;
      r.tg_dieu_chinh_ton = null;
    }
  }
}

function computeKetQua(soLuongSo: number, soLuongThucTe: number | null): KetQuaKiemKeKho {
  if (soLuongThucTe == null) return 'chua_kiem';
  if (soLuongSo === soLuongThucTe) return 'khop';
  if (soLuongThucTe < soLuongSo) return 'thieu';
  return 'thua';
}

/** Lấy danh sách id_kho của một đợt */
async function getDotKhoIds(idDot: number): Promise<string[]> {
  const { data, error } = await db
    .from(TABLE_DOT_KHO)
    .select('id_kho')
    .eq('id_dot_kiem_ke_kho', idDot);
  if (error) throwDbError(error);
  return (data ?? []).map((r: { id_kho: number }) => String(r.id_kho));
}

/** Cột cho bản tóm tắt (chip lọc + tab Thống kê). */
const DOT_KK_KHO_TOM_TAT_COLUMNS =
  'id,ma_dot,ten_dot,ngay_bat_dau,ngay_ket_thuc,trang_thai,id_nguoi_phu_trach,id_nguoi_tao';

interface TomTatRow {
  id: number;
  ma_dot: string;
  ten_dot: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  trang_thai: string;
  id_nguoi_phu_trach: number;
  id_nguoi_tao: number | null;
}

/** Cột tham gia ô tìm kiếm ở server. */
const DOT_KK_KHO_SEARCH_SPEC = {
  text: ['ma_dot', 'ten_dot', 'trang_thai', 'ghi_chu'],
  numeric: ['id'],
  dates: ['ngay_bat_dau', 'ngay_ket_thuc'],
} as const;

/** Kho của nhiều đợt trong MỘT request (bản cũ gọi `getDotKhoIds` trong vòng lặp). */
async function khoTheoDotIds(dotIds: number[]): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  if (dotIds.length === 0) return map;
  const { data, error } = await db
    .from(TABLE_DOT_KHO)
    .select('id_dot_kiem_ke_kho,id_kho')
    .in('id_dot_kiem_ke_kho', dotIds);
  if (error) throwDbError(error);
  for (const r of (data ?? []) as { id_dot_kiem_ke_kho: number; id_kho: number }[]) {
    const arr = map.get(r.id_dot_kiem_ke_kho) ?? [];
    arr.push(String(r.id_kho));
    map.set(r.id_dot_kiem_ke_kho, arr);
  }
  return map;
}

/** Id đợt có ít nhất một kho trong danh sách đã chọn. */
async function dotIdsTheoKho(khoIds: string[]): Promise<number[]> {
  const ids = khoIds.map(Number).filter(Number.isFinite);
  if (ids.length === 0) return [];
  const { data, error } = await db.from(TABLE_DOT_KHO).select('id_dot_kiem_ke_kho').in('id_kho', ids);
  if (error) throwDbError(error);
  return [...new Set((data ?? []).map((r) => Number((r as { id_dot_kiem_ke_kho: unknown }).id_dot_kiem_ke_kho)))];
}

/** Thống kê số dòng / số lệch của các đợt trong trang. */
async function thongKeChiTietTheoDot(
  dotIds: number[]
): Promise<Record<number, { so_hang_hoa: number; so_lech: number }>> {
  const out: Record<number, { so_hang_hoa: number; so_lech: number }> = {};
  if (dotIds.length === 0) return out;
  const { data } = await db
    .from(TABLE_CHI_TIET)
    .select('id_dot_kiem_ke_kho, ket_qua')
    .in('id_dot_kiem_ke_kho', dotIds);
  for (const r of (data ?? []) as { id_dot_kiem_ke_kho: number; ket_qua: string | null }[]) {
    if (!out[r.id_dot_kiem_ke_kho]) out[r.id_dot_kiem_ke_kho] = { so_hang_hoa: 0, so_lech: 0 };
    out[r.id_dot_kiem_ke_kho].so_hang_hoa += 1;
    if (r.ket_qua === 'thieu' || r.ket_qua === 'thua') out[r.id_dot_kiem_ke_kho].so_lech += 1;
  }
  return out;
}

/**
 * Tóm tắt TOÀN BỘ đợt trong phạm vi xem — vài cột, 3 request cố định.
 *
 * Chip lọc và tab Thống kê phải tính trên toàn bộ dữ liệu, không phải trang đang
 * xem; đây là nguồn thay cho bản `getDotKiemKeKhoList` cũ (tải cả bảng rồi gọi
 * `getDotKhoIds` trong vòng lặp — N+1).
 */
export async function getDotKiemKeKhoTomTatDb(
  phamVi: { khoChoPhep: string[]; currentEmployeeId: string | null } | null = null
): Promise<DotKiemKeKhoTomTat[]> {
  const employees = await getEmployeesRef();
  const empMap = new Map(employees.map((e) => [e.id, e.ho_ten]));

  const dotIdsPhamVi = phamVi ? await dotIdsTheoKho(phamVi.khoChoPhep) : null;

  let sel = db.from(TABLE_DOT).select(DOT_KK_KHO_TOM_TAT_COLUMNS);
  if (dotIdsPhamVi != null) {
    const ve: string[] = [];
    const me = phamVi?.currentEmployeeId != null ? Number(phamVi.currentEmployeeId) : NaN;
    if (Number.isFinite(me)) ve.push(`id_nguoi_phu_trach.eq.${me}`, `id_nguoi_tao.eq.${me}`);
    if (dotIdsPhamVi.length > 0) ve.push(`id.in.(${dotIdsPhamVi.join(',')})`);
    // Không có điều kiện hợp lệ nào = không được phép xem gì, KHÔNG phải xem tất cả.
    sel = ve.length > 0 ? sel.or(ve.join(',')) : sel.eq('id', -1);
  }
  const { data, error } = await sel.order('ngay_ket_thuc', { ascending: false }).order('id', { ascending: false });
  if (error) throwDbError(error);

  const rows = (data ?? []) as TomTatRow[];
  const dotIds = rows.map((r) => r.id);
  const [khoMap, stats] = await Promise.all([khoTheoDotIds(dotIds), thongKeChiTietTheoDot(dotIds)]);

  return rows.map((row) => {
    const idKho = khoMap.get(row.id) ?? [];
    const st = stats[row.id];
    return {
      id: String(row.id),
      ma_dot: row.ma_dot,
      ten_dot: row.ten_dot,
      ngay_bat_dau: row.ngay_bat_dau,
      ngay_ket_thuc: row.ngay_ket_thuc,
      trang_thai: row.trang_thai as DotKiemKeKhoTomTat['trang_thai'],
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

/**
 * Một trang danh sách đợt kiểm kê kho — lọc / phân trang ở PostgREST.
 *
 * Lọc theo kho và tìm theo tên người phụ trách đều nằm ở bảng khác, nên tra id
 * trước rồi mới ràng buộc `id.in.(...)`.
 */
export async function getDotKiemKeKhoPageDb(
  page: number,
  pageSize: number,
  params: GetDotKiemKeKhoListParamsDb = {},
  /**
   * Phạm vi xem: đợt của chính mình HOẶC đợt chạm kho được phép. `null` = xem tất cả.
   * Component tính sẵn vì danh sách kho ↔ chi nhánh nằm ở module khác.
   */
  phamVi: { khoChoPhep: string[]; currentEmployeeId: string | null } | null = null
): Promise<PaginatedTableResult<DotKiemKeKho>> {
  const employees = await getEmployeesRef();
  const empMap = new Map(employees.map((e) => [e.id, { ten: e.ho_ten, ma: e.ma_nhan_vien }]));

  const term = params.q?.trim() ?? '';
  const nhanVienIdsTheoTen = term
    ? employees
        .filter(
          (e) =>
            (e.ho_ten ?? '').toLowerCase().includes(term.toLowerCase()) ||
            (e.ma_nhan_vien ?? '').toLowerCase().includes(term.toLowerCase())
        )
        .map((e) => Number(e.id))
        .filter(Number.isFinite)
    : [];

  const dotIdsKho = params.id_kho?.length ? await dotIdsTheoKho(params.id_kho) : null;
  const dotIdsPhamVi = phamVi ? await dotIdsTheoKho(phamVi.khoChoPhep) : null;

  const result = await fetchTablePage<DotRow>(page, pageSize, async (from, to) => {
    let sel = db.from(TABLE_DOT).select(DOT_KK_KHO_COLUMNS, { count: 'exact' });

    if (params.trang_thai_dot?.length) sel = sel.in('trang_thai', params.trang_thai_dot);
    if (params.dateFrom) sel = sel.gte('ngay_ket_thuc', params.dateFrom);
    if (params.dateTo) sel = sel.lte('ngay_bat_dau', params.dateTo);
    if (params.id_nguoi_phu_trach?.length) {
      sel = sel.in('id_nguoi_phu_trach', params.id_nguoi_phu_trach.map(Number).filter(Number.isFinite));
    }
    if (params.filter === 'mine' && params.id_nguoi) {
      const n = Number(params.id_nguoi);
      sel = Number.isFinite(n) ? sel.eq('id_nguoi_phu_trach', n) : sel.eq('id', -1);
    }
    if (dotIdsKho != null) {
      sel = dotIdsKho.length === 0 ? sel.eq('id', -1) : sel.in('id', dotIdsKho);
    }
    if (dotIdsPhamVi != null) {
      const ve: string[] = [];
      const me = phamVi?.currentEmployeeId != null ? Number(phamVi.currentEmployeeId) : NaN;
      if (Number.isFinite(me)) ve.push(`id_nguoi_phu_trach.eq.${me}`, `id_nguoi_tao.eq.${me}`);
      if (dotIdsPhamVi.length > 0) ve.push(`id.in.(${dotIdsPhamVi.join(',')})`);
      sel = ve.length > 0 ? sel.or(ve.join(',')) : sel.eq('id', -1);
    }

    if (term) {
      const parts = buildPostgrestSearchOr(term, DOT_KK_KHO_SEARCH_SPEC);
      if (nhanVienIdsTheoTen.length > 0) {
        parts.push(
          `id_nguoi_phu_trach.in.(${nhanVienIdsTheoTen.join(',')})`,
          `id_nguoi_tao.in.(${nhanVienIdsTheoTen.join(',')})`
        );
      }
      if (parts.length > 0) sel = sel.or(parts.join(','));
    }

    const res = await sel
      .order('ngay_ket_thuc', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to);
    return { data: (res.data as unknown as DotRow[] | null) ?? null, error: res.error, count: res.count };
  });

  const dotIds = result.data.map((r) => r.id);
  const [khoMap, stats] = await Promise.all([khoTheoDotIds(dotIds), thongKeChiTietTheoDot(dotIds)]);

  return {
    ...result,
    data: result.data.map((row) => {
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
    }),
  };
}

export async function getDotKiemKeKhoByIdDb(id: string): Promise<DotKiemKeKho | null> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await db.from(TABLE_DOT).select(DOT_KK_KHO_COLUMNS).eq('id', idNum).maybeSingle();
  if (error) throwDbError(error);
  if (!row) return null;
  const idKhoList = await getDotKhoIds((row as DotRow).id);
  const employees = await getEmployeesRef();
  const dotRow = row as DotRow;
  const empPhuTrach = employees.find((e) => e.id === String(dotRow.id_nguoi_phu_trach));
  const empTao = dotRow.id_nguoi_tao != null ? employees.find((e) => e.id === String(dotRow.id_nguoi_tao)) : undefined;
  return rowToDot(row as DotRow, idKhoList, {
    ten_nguoi_phu_trach: empPhuTrach?.ho_ten ?? null,
    ma_nguoi_phu_trach: empPhuTrach?.ma_nhan_vien ?? null,
    ten_nguoi_tao: empTao?.ho_ten ?? null,
    ma_nguoi_tao: empTao?.ma_nhan_vien ?? null,
  });
}

export async function getChiTietByDotDb(id_dot_kiem_ke_kho: string): Promise<ChiTietKiemKeKho[]> {
  const idNum = Number(id_dot_kiem_ke_kho);
  if (Number.isNaN(idNum)) return [];
  const { data: rows, error } = await db
    .from(TABLE_CHI_TIET)
    .select(CHI_TIET_KK_KHO_COLUMNS)
    .eq('id_dot_kiem_ke_kho', idNum)
    .order('id_kho')
    .order('id_hang_hoa');
  if (error) throwDbError(error);
  const rawRows = (rows ?? []) as ChiTietRow[];
  await reconcileKiemKeChiTietOrphanPhieuLinks(rawRows);
  const [khoList, hangHoaList, employees] = await Promise.all([getKhoRef(), getHangHoaRef(), getEmployeesRef()]);
  const khoMap = new Map(khoList.map((k) => [k.id, { ten: k.ten_kho, ma: k.ma_kho }]));
  const hhMap = new Map(hangHoaList.map((h) => [h.id, { ma: h.ma_hang_hoa ?? h.ma_hang, ten: h.ten_hang_hoa ?? h.ten_hang, dvt: h.dvt ?? h.don_vi_tinh }]));
  const empMap = new Map(employees.map((e) => [e.id, e.ho_ten]));
  const out: ChiTietKiemKeKho[] = [];
  for (const r of rawRows) {
    const row = r as ChiTietRow;
    const kho = khoMap.get(String(row.id_kho));
    const hh = hhMap.get(String(row.id_hang_hoa));
    const tenNguoiKiem = row.id_nguoi_kiem != null ? empMap.get(String(row.id_nguoi_kiem)) ?? null : null;
    const ct = rowToChiTiet(row, {
      ten_kho: kho?.ten ?? undefined,
      ma_kho: kho?.ma ?? undefined,
      ma_hang: hh?.ma ?? undefined,
      ten_hang: hh?.ten ?? undefined,
      don_vi_tinh: hh?.dvt ?? undefined,
    }) as ChiTietKiemKeKho;
    if (tenNguoiKiem) ct.ten_nguoi_kiem = tenNguoiKiem;
    out.push(ct);
  }
  return out;
}

/** idNguoiTao = fp_var_nhan_vien.id của user đăng nhập; không fallback sang id_nguoi_phu_trach. */
export async function createDotKiemKeKhoDb(
  data: DotKiemKeKhoCreate,
  idNguoiTao?: string | null
): Promise<DotKiemKeKho> {
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
    .select(DOT_KK_KHO_COLUMNS)
    .single();
  if (error) throwDbError(error);
  const idDot = (row as DotRow).id;
  if ((data.id_kho ?? []).length > 0) {
    const { error: errKho } = await db.from(TABLE_DOT_KHO).insert(
      data.id_kho!.map((id_kho) => ({ id_dot_kiem_ke_kho: idDot, id_kho: Number(id_kho) }))
    );
    if (errKho) throwDbError(errKho);
  }
  const created = await getDotKiemKeKhoByIdDb(String(idDot));
  if (!created) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  return created;
}

export async function updateDotKiemKeKhoDb(
  id: string,
  data: Partial<DotKiemKeKhoCreate>,
  /** Cấp cao (cap_bac = 1 hoặc admin/all) được sửa cả đợt đã hoàn thành. */
  capCao = false
): Promise<DotKiemKeKho> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  const existing = await getDotKiemKeKhoByIdDb(id);
  if (!existing) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  if (!coTheSuaDot(existing.trang_thai, capCao)) {
    // Ghi chú vẫn cho sửa: đó là chỗ ghi lý do chốt sổ, không đụng số liệu.
    const onlyGhiChu = data.ghi_chu !== undefined && Object.keys(data).length === 1;
    if (!onlyGhiChu) throw new Error(i18n.t('kiemKeKho.service.hoanThanhChiCapCao'));
  }
  const payload: Record<string, unknown> = {};
  if (data.ma_dot != null) payload.ma_dot = data.ma_dot.trim();
  if (data.ten_dot != null) payload.ten_dot = data.ten_dot.trim();
  if (data.ngay_bat_dau != null) payload.ngay_bat_dau = data.ngay_bat_dau;
  if (data.ngay_ket_thuc != null) payload.ngay_ket_thuc = data.ngay_ket_thuc;
  if (data.id_nguoi_phu_trach != null) payload.id_nguoi_phu_trach = Number(data.id_nguoi_phu_trach);
  if (data.ghi_chu !== undefined) payload.ghi_chu = data.ghi_chu?.trim() || null;
  if (Object.keys(payload).length > 0) {
    const { error: updateErr } = await db.from(TABLE_DOT).update(payload).eq('id', idNum);
    if (updateErr) throwDbError(updateErr);
  }
  if (data.id_kho != null) {
    await db.from(TABLE_DOT_KHO).delete().eq('id_dot_kiem_ke_kho', idNum);
    if (data.id_kho.length > 0) {
      const { error: errKho } = await db
        .from(TABLE_DOT_KHO)
        .insert(data.id_kho.map((id_kho) => ({ id_dot_kiem_ke_kho: idNum, id_kho: Number(id_kho) })));
      if (errKho) throwDbError(errKho);
    }
  }
  // SL sổ = tồn cuối ngày bắt đầu → đổi ngày thì lấy lại sổ cho các dòng chưa điều chỉnh.
  if (data.ngay_bat_dau != null && data.ngay_bat_dau !== existing.ngay_bat_dau) {
    await capNhatSoLuongSoTheoNgayDb(id, capCao);
  }
  const updated = await getDotKiemKeKhoByIdDb(id);
  if (!updated) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  return updated;
}

export async function deleteDotKiemKeKhoDb(ids: string[], capCao = false): Promise<void> {
  const idNums = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (idNums.length === 0) return;
  const { data: dots } = await db.from(TABLE_DOT).select('id, trang_thai').in('id', idNums);
  const chanLai = (dots ?? []).filter(
    (d: { trang_thai: TrangThaiDotKiemKeKho }) => !coTheXoaDot(d.trang_thai, capCao)
  );
  if (chanLai.length > 0) throw new Error(i18n.t('kiemKeKho.service.hoanThanhChiCapCaoXoa'));
  const { error } = await db.from(TABLE_DOT).delete().in('id', idNums);
  if (error) throwDbError(error);
}

export async function changeTrangThaiDotDb(
  id: string,
  trang_thai: TrangThaiDotKiemKeKho,
  capCao = false
): Promise<DotKiemKeKho> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  const existing = await getDotKiemKeKhoByIdDb(id);
  if (!existing) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  // Chặn lối vòng: đưa đợt đã chốt về Đang kiểm kê rồi sửa thoải mái.
  if (!coTheChuyenTrangThaiDot(existing.trang_thai, capCao)) {
    throw new Error(i18n.t('kiemKeKho.service.hoanThanhChiCapCaoDoiTrangThai'));
  }
  const { error } = await db.from(TABLE_DOT).update({ trang_thai }).eq('id', idNum);
  if (error) throwDbError(error);
  const updated = await getDotKiemKeKhoByIdDb(id);
  if (!updated) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  return updated;
}

/**
 * SL sổ của đợt = tồn CUỐI NGÀY `ngay` (ngày bắt đầu đợt) theo kho × hàng, khoá `kho|hàng`.
 * RPC `rpc_mh_ton_kho_den_ngay` (migration 037) cùng luật view `fp_mh_ton_kho` (mọi phiếu trừ
 * 'Không duyệt') nhưng chỉ tính phiếu `ngay <= ngay`. Phiếu điều chỉnh do kiểm kê sinh ra cũng
 * ghi đúng ngày bắt đầu → xem tồn ngày đó ra số thực tế đã đếm.
 */
async function layTonTheoNgayKho(ngay: string, khoIds: string[]): Promise<Map<string, number>> {
  const rows = await fetchAllRows<{ id_kho: number; id_hang_hoa: number; so_luong: number | string | null }>(
    (from, to) =>
      db
        .rpc('rpc_mh_ton_kho_den_ngay', { p_den: ngay, p_kho_ids: khoIds.map(Number) })
        .order('id_kho')
        .order('id_hang_hoa')
        .range(from, to)
  );
  return new Map(rows.map((r) => [`${r.id_kho}|${r.id_hang_hoa}`, Number(r.so_luong) || 0]));
}

/**
 * Lấy lại SL sổ theo ngày bắt đầu hiện tại của đợt cho mọi dòng CHƯA sinh phiếu điều chỉnh
 * (dòng đã điều chỉnh giữ nguyên sổ — đổi sẽ lệch với phiếu đã ghi), tính lại kết quả.
 * Gọi khi đổi ngày bắt đầu, hoặc từ nút "Lấy lại SL sổ theo ngày". Trả số dòng đã đổi.
 */
export async function capNhatSoLuongSoTheoNgayDb(id_dot_kiem_ke_kho: string, capCao = false): Promise<number> {
  const dot = await getDotKiemKeKhoByIdDb(id_dot_kiem_ke_kho);
  if (!dot) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  if (!coTheSuaChiTiet(dot.trang_thai, capCao)) {
    throw new Error(i18n.t('kiemKeKho.service.hoanThanhChiCapCao'));
  }
  const dongs = (await getChiTietByDotDb(id_dot_kiem_ke_kho)).filter((c) => !c.id_phieu_kho_dieu_chinh);
  if (dongs.length === 0) return 0;

  const ton = await layTonTheoNgayKho(dot.ngay_bat_dau, [...new Set(dongs.map((c) => c.id_kho))]);

  // Gom các dòng cùng (sổ mới, kết quả) → một UPDATE … WHERE id IN (…) mỗi nhóm.
  const nhom = new Map<string, { so: number; ketQua: KetQuaKiemKeKho; ids: number[] }>();
  for (const c of dongs) {
    const so = ton.get(`${c.id_kho}|${c.id_hang_hoa}`) ?? 0;
    if (so === c.so_luong_so) continue;
    const ketQua = computeKetQua(so, c.so_luong_thuc_te ?? null);
    const key = `${so}|${ketQua}`;
    const g = nhom.get(key) ?? { so, ketQua, ids: [] };
    g.ids.push(Number(c.id));
    nhom.set(key, g);
  }

  const groups = [...nhom.values()];
  for (let i = 0; i < groups.length; i += 8) {
    const results = await Promise.all(
      groups.slice(i, i + 8).map((g) =>
        db.from(TABLE_CHI_TIET).update({ so_luong_so: g.so, ket_qua: g.ketQua }).in('id', g.ids)
      )
    );
    const loi = results.find((r) => r.error)?.error;
    if (loi) throwDbError(loi);
  }
  return groups.reduce((n, g) => n + g.ids.length, 0);
}

/** SL sổ = tồn cuối ngày bắt đầu của đợt → sinh dòng kiểm kê, rồi chuyển đợt sang `dang_kiem_ke`. */
export async function taoDanhSachKiemKeDb(
  id_dot_kiem_ke_kho: string,
  filters?: TaoDanhSachKiemKeKhoFiltersDb,
  capCao = false
): Promise<ChiTietKiemKeKho[]> {
  const dot = await getDotKiemKeKhoByIdDb(id_dot_kiem_ke_kho);
  if (!dot) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  if (!coTheSuaChiTiet(dot.trang_thai, capCao)) {
    throw new Error(i18n.t('kiemKeKho.service.hoanThanhChiCapCao'));
  }
  if (!dot.id_kho?.length) throw new Error(i18n.t('kiemKeKho.service.dotChuaChonKho'));

  const hangHoaList = await getHangHoaRef();
  const existing = await getChiTietByDotDb(id_dot_kiem_ke_kho);
  const existingKeys = new Set(existing.map((c) => `${c.id_kho}|${c.id_hang_hoa}`));
  const idDotNum = Number(id_dot_kiem_ke_kho);
  const khoIdsToProcess = (filters?.id_kho?.length
    ? filters.id_kho.filter((k) => dot.id_kho.includes(k))
    : dot.id_kho) as string[];

  const activeHangHoa = hangHoaList.filter((h) => {
    if (h.trang_thai === 'Ngừng hoạt động') return false;
    if (filters?.id_hang_hoa?.length && !filters.id_hang_hoa.includes(h.id)) return false;
    if (filters?.id_danh_muc?.length && (!h.danh_muc_id || !filters.id_danh_muc.includes(h.danh_muc_id))) return false;
    return true;
  });

  // Một request cho mọi kho trong phạm vi, thay vì một request mỗi kho.
  const ton = await layTonTheoNgayKho(dot.ngay_bat_dau, khoIdsToProcess);

  const toInsert: { id_dot_kiem_ke_kho: number; id_kho: number; id_hang_hoa: number; so_luong_so: number; ket_qua: string }[] = [];
  for (const id_kho of khoIdsToProcess) {
    for (const hh of activeHangHoa) {
      const key = `${id_kho}|${hh.id}`;
      if (existingKeys.has(key)) continue;
      const so_luong_so = ton.get(key) ?? 0;
      toInsert.push({
        id_dot_kiem_ke_kho: idDotNum,
        id_kho: Number(id_kho),
        id_hang_hoa: Number(hh.id),
        so_luong_so,
        ket_qua: 'chua_kiem',
      });
      existingKeys.add(key);
    }
  }

  if (toInsert.length === 0) {
    throw new Error(i18n.t('kiemKeKho.service.taoDanhSachEmpty'));
  }
  const { error } = await db.from(TABLE_CHI_TIET).insert(toInsert);
  if (error) throwDbError(error);
  const { error: updateDotErr } = await db
    .from(TABLE_DOT)
    .update({ trang_thai: 'dang_kiem_ke' })
    .eq('id', idDotNum);
  if (updateDotErr) throwDbError(updateDotErr);
  return getChiTietByDotDb(id_dot_kiem_ke_kho);
}

export async function createChiTietKiemKeDb(
  id_dot_kiem_ke_kho: string,
  id_kho: string,
  id_hang_hoa: string,
  capCao = false
): Promise<ChiTietKiemKeKho> {
  const dot = await getDotKiemKeKhoByIdDb(id_dot_kiem_ke_kho);
  if (!dot) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  if (!coTheSuaChiTiet(dot.trang_thai, capCao)) {
    throw new Error(i18n.t('kiemKeKho.service.hoanThanhChiCapCao'));
  }
  if (!dot.id_kho.includes(id_kho)) throw new Error(i18n.t('kiemKeKho.service.khoNotInDot'));
  const existing = await getChiTietByDotDb(id_dot_kiem_ke_kho);
  if (existing.some((c) => c.id_kho === id_kho && c.id_hang_hoa === id_hang_hoa))
    throw new Error(i18n.t('kiemKeKho.service.chiTietAlreadyExists'));
  const ton = await layTonTheoNgayKho(dot.ngay_bat_dau, [id_kho]);
  const so_luong_so = ton.get(`${id_kho}|${id_hang_hoa}`) ?? 0;
  const { data: row, error } = await db
    .from(TABLE_CHI_TIET)
    .insert({
      id_dot_kiem_ke_kho: Number(id_dot_kiem_ke_kho),
      id_kho: Number(id_kho),
      id_hang_hoa: Number(id_hang_hoa),
      so_luong_so,
      so_luong_thuc_te: null,
      ket_qua: 'chua_kiem',
      ghi_chu_dong: null,
      id_nguoi_kiem: null,
      ngay_kiem: null,
    })
    .select(CHI_TIET_KK_KHO_COLUMNS)
    .single();
  if (error) throwDbError(error);
  const list = await getChiTietByDotDb(id_dot_kiem_ke_kho);
  const found = list.find((c) => c.id === String((row as ChiTietRow).id));
  if (!found) throw new Error(i18n.t('kiemKeKho.service.chiTietNotFound'));
  return found;
}

export async function deleteChiTietKiemKeDb(id_chi_tiet: string, capCao = false): Promise<void> {
  const idNum = Number(id_chi_tiet);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('kiemKeKho.service.chiTietNotFound'));
  const { data: row, error: fetchErr } = await db
    .from(TABLE_CHI_TIET)
    .select('id_dot_kiem_ke_kho,id_phieu_kho_dieu_chinh')
    .eq('id', idNum)
    .maybeSingle();
  if (fetchErr || !row) throw new Error(i18n.t('kiemKeKho.service.chiTietNotFound'));
  const r = row as { id_dot_kiem_ke_kho: number; id_phieu_kho_dieu_chinh: number | null };
  const dot = await getDotKiemKeKhoByIdDb(String(r.id_dot_kiem_ke_kho));
  if (!dot) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  if (!coTheSuaChiTiet(dot.trang_thai, capCao)) {
    throw new Error(i18n.t('kiemKeKho.service.hoanThanhChiCapCao'));
  }
  const dong = { id_phieu_kho_dieu_chinh: r.id_phieu_kho_dieu_chinh != null ? String(r.id_phieu_kho_dieu_chinh) : null };
  if (!coTheSuaDongKiemKe(dong, dot.trang_thai, capCao)) {
    throw new Error(i18n.t('kiemKeKho.service.daDieuChinhChiCapCao'));
  }
  const { error } = await db.from(TABLE_CHI_TIET).delete().eq('id', idNum);
  if (error) throwDbError(error);
}

export async function updateChiTietKetQuaDb(
  id_chi_tiet: string,
  data: ChiTietKiemKeKhoUpdate,
  id_nguoi_kiem: string,
  capCao = false
): Promise<ChiTietKiemKeKho> {
  const idNum = Number(id_chi_tiet);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('kiemKeKho.service.chiTietNotFound'));
  const { data: row, error: fetchErr } = await db.from(TABLE_CHI_TIET).select(CHI_TIET_KK_KHO_COLUMNS).eq('id', idNum).maybeSingle();
  if (fetchErr || !row) throw new Error(i18n.t('kiemKeKho.service.chiTietNotFound'));
  const r = row as ChiTietRow;
  // Dòng đã sinh phiếu điều chỉnh tồn: đổi số thực tế sẽ lệch với phiếu đã ghi — chỉ cấp cao.
  if (r.id_phieu_kho_dieu_chinh != null && !capCao) {
    throw new Error(i18n.t('kiemKeKho.service.daDieuChinhChiCapCao'));
  }
  const soLuongThucTe = data.so_luong_thuc_te !== undefined ? data.so_luong_thuc_te : r.so_luong_thuc_te;
  const ghiChuDong = data.ghi_chu_dong !== undefined ? data.ghi_chu_dong : r.ghi_chu_dong;
  // Gõ tay SL sổ: chỉ người tạo đợt / cấp cao (xem coTheSuaSoLuongSo).
  let soLuongSo = Number(r.so_luong_so);
  const doiSo = data.so_luong_so !== undefined && data.so_luong_so !== soLuongSo;
  if (doiSo) {
    const dot = await getDotKiemKeKhoByIdDb(String(r.id_dot_kiem_ke_kho));
    if (!dot) throw new Error(i18n.t('kiemKeKho.service.notFound'));
    const dong = { id_phieu_kho_dieu_chinh: r.id_phieu_kho_dieu_chinh != null ? String(r.id_phieu_kho_dieu_chinh) : null };
    if (!coTheSuaSoLuongSo(dong, dot, id_nguoi_kiem, capCao)) {
      throw new Error(i18n.t('kiemKeKho.service.suaSoChiNguoiTao'));
    }
    soLuongSo = data.so_luong_so as number;
  }
  const ketQua = computeKetQua(soLuongSo, soLuongThucTe ?? null);
  const { error: updateErr } = await db
    .from(TABLE_CHI_TIET)
    .update({
      ...(doiSo ? { so_luong_so: soLuongSo } : {}),
      so_luong_thuc_te: soLuongThucTe ?? null,
      ghi_chu_dong: ghiChuDong?.trim() || null,
      ket_qua: ketQua,
      id_nguoi_kiem: Number(id_nguoi_kiem),
      ngay_kiem: new Date().toISOString(),
    })
    .eq('id', idNum);
  if (updateErr) throwDbError(updateErr);
  const list = await getChiTietByDotDb(String(r.id_dot_kiem_ke_kho));
  const found = list.find((c) => c.id === id_chi_tiet);
  if (!found) throw new Error(i18n.t('kiemKeKho.service.chiTietNotFound'));
  return found;
}

function throwKiemKeRpcError(err: { message?: string; code?: string }): never {
  const m = String(err.message ?? '');
  const lower = m.toLowerCase();
  if (m.includes('kiem_ke_chi_tiet_not_found')) throw new Error(i18n.t('kiemKeKho.service.rpcChiTietNotFound'));
  if (m.includes('kiem_ke_dot_not_found')) throw new Error(i18n.t('kiemKeKho.service.rpcDotNotFound'));
  if (m.includes('kiem_ke_dot_not_dang_kiem_ke')) throw new Error(i18n.t('kiemKeKho.service.rpcDotNotDangKiemKe'));
  if (m.includes('kiem_ke_already_adjusted')) throw new Error(i18n.t('kiemKeKho.service.rpcAlreadyAdjusted'));
  if (m.includes('kiem_ke_no_thuc_te')) throw new Error(i18n.t('kiemKeKho.service.noThucTeForDieuChinh'));
  if (m.includes('kiem_ke_no_variance')) throw new Error(i18n.t('kiemKeKho.service.rpcNoVariance'));
  if (
    err.code === 'PGRST202' ||
    /could not find the function/i.test(m) ||
    (lower.includes('schema cache') && lower.includes('function'))
  ) {
    throw new Error(i18n.t('kiemKeKho.service.rpcFunctionNotFound'));
  }
  throw new Error(m || i18n.t('kiemKeKho.service.rpcUnknown'));
}

export async function dieuChinhTonTheoKetQuaDb(
  id_chi_tiet: string,
  p_nguoi_tao_id?: number | null
): Promise<void> {
  const idNum = Number(id_chi_tiet);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('kiemKeKho.service.chiTietNotFound'));
  const nv =
    p_nguoi_tao_id != null && Number.isFinite(Number(p_nguoi_tao_id)) ? Number(p_nguoi_tao_id) : null;
  const { error } = await db.rpc('kiem_ke_apply_dieu_chinh_chi_tiet', {
    p_id_chi_tiet: idNum,
    p_nguoi_tao_id: nv,
  });
  if (error) throwKiemKeRpcError(error);
}

export async function dieuChinhTonTheoDotDb(
  id_dot_kiem_ke_kho: string,
  p_nguoi_tao_id?: number | null
): Promise<number> {
  const idNum = Number(id_dot_kiem_ke_kho);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  const nv =
    p_nguoi_tao_id != null && Number.isFinite(Number(p_nguoi_tao_id)) ? Number(p_nguoi_tao_id) : null;
  const { data, error } = await db.rpc('kiem_ke_apply_dieu_chinh_dot', {
    p_id_dot: idNum,
    p_nguoi_tao_id: nv,
  });
  if (error) throwKiemKeRpcError(error);
  const n = typeof data === 'number' ? data : Number(data);
  return Number.isFinite(n) ? n : 0;
}

export async function hoanThanhDotDb(id_dot_kiem_ke_kho: string): Promise<DotKiemKeKho> {
  const dot = await getDotKiemKeKhoByIdDb(id_dot_kiem_ke_kho);
  if (!dot) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  if (dot.trang_thai !== 'dang_kiem_ke') throw new Error(i18n.t('kiemKeKho.service.onlyHoanThanhWhenDangKiem'));
  const idNum = Number(id_dot_kiem_ke_kho);
  const { error } = await db.from(TABLE_DOT).update({ trang_thai: 'hoan_thanh' }).eq('id', idNum);
  if (error) throwDbError(error);
  const updated = await getDotKiemKeKhoByIdDb(id_dot_kiem_ke_kho);
  if (!updated) throw new Error(i18n.t('kiemKeKho.service.notFound'));
  return updated;
}

/** Trả về số thứ tự tiếp theo cho mã đợt (app format: KK-YYYY-NNNN). */
export async function getNextMaDotDotKiemKeKhoDb(): Promise<number> {
  const { data, error } = await db.rpc('get_next_ma_dot_dot_kiem_ke_kho');
  if (error) throwDbError(error);
  if (typeof data === 'number' && Number.isFinite(data)) return data;
  const n = Number(data);
  return Number.isFinite(n) ? n : 1;
}