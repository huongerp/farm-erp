/**
 * Service kiểm kê tài sản – đọc/ghi Supabase (fp_ts_dot_kiem_ke_tai_san, fp_ts_dot_kiem_ke_tai_san_chi_tiet).
 * Trạng thái lưu tiếng Việt: Nháp | Đang kiểm kê | Hoàn thành; Đang hoạt động | Ngừng hoạt động;
 * Kết quả: Chưa kiểm | Khớp | Chênh nơi lưu | Chênh người giữ | Chênh trạng thái | Thiếu.
 */
import { supabase, throwSupabaseError } from '../../../../lib/supabase';
import type {
  DotKiemKe,
  ChiTietKiemKe,
  DotKiemKeCreate,
  ChiTietKiemKeUpdate,
  TrangThaiDotKiemKe,
  KetQuaKiemKe,
} from '../core/types';
/** Bộ lọc phạm vi khi tạo danh sách kiểm kê (chi nhánh, vị trí, người giữ) */
export interface TaoDanhSachKiemKeFilters {
  id_chi_nhanh?: string[];
  id_noi_luu?: string[];
  id_nguoi_giu?: string[];
}

export interface GetDotKiemKeListParams {
  filter?: 'all' | 'mine';
  id_nguoi?: string;
  q?: string;
  trang_thai_dot?: TrangThaiDotKiemKe[];
  dateFrom?: string;
  dateTo?: string;
  id_nguoi_phu_trach?: string[];
}

export interface ThemChiTietPhatHienPayload {
  id_tai_san: string;
  id_noi_luu_thuc_te: string | null;
  id_nguoi_giu_thuc_te: string | null;
  id_trang_thai_thuc_te: string | null;
  ghi_chu_dong?: string | null;
}
import { getTaiSanList, updateTaiSanFromKiemKe } from '../../danh-muc-tai-san/services/danh-muc-tai-san-service';
import { getAssetStorageLocations } from '../../thiet-lap-tai-san/services/noi-luu-service';
import { getEmployeesRef } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import { getAssetStatuses } from '../../thiet-lap-tai-san/services/trang-thai-service';

const TABLE_DOT = 'fp_ts_dot_kiem_ke_tai_san';
const TABLE_CT = 'fp_ts_dot_kiem_ke_tai_san_chi_tiet';

const DOT_LIST_SELECT =
  'id, ma_dot, ten_dot, ngay_bat_dau, ngay_ket_thuc, trang_thai, id_nguoi_phu_trach, id_nhom, id_noi_luu, id_nguoi_giu, ghi_chu, trang_thai_active, tg_tao, tg_cap_nhat';

const CT_LIST_SELECT =
  'id, id_dot_kiem_ke, id_tai_san, ma_tai_san, ten_tai_san, id_noi_luu_so, ten_noi_luu_so, id_nguoi_giu_so, ten_nguoi_giu_so, id_trang_thai_so, ten_trang_thai_so, id_noi_luu_thuc_te, ten_noi_luu_thuc_te, id_nguoi_giu_thuc_te, ten_nguoi_giu_thuc_te, id_trang_thai_thuc_te, ten_trang_thai_thuc_te, ket_qua, ghi_chu_dong, id_nguoi_kiem, ngay_kiem, tg_tao, tg_cap_nhat';

const TRANG_THAI_NHAP: TrangThaiDotKiemKe = 'Nháp';
const TRANG_THAI_DANG_KIEM_KE: TrangThaiDotKiemKe = 'Đang kiểm kê';
const TRANG_THAI_HOAN_THANH: TrangThaiDotKiemKe = 'Hoàn thành';
const CAN_EDIT_DOT: TrangThaiDotKiemKe[] = [TRANG_THAI_NHAP, TRANG_THAI_DANG_KIEM_KE];
const CAN_DELETE_DOT: TrangThaiDotKiemKe[] = [TRANG_THAI_NHAP, TRANG_THAI_DANG_KIEM_KE];
const TRANG_THAI_ACTIVE_DEFAULT = 'Đang hoạt động';
const KET_QUA_CHUA_KIEM: KetQuaKiemKe = 'Chưa kiểm';

function toStr(n: number | null | undefined): string {
  if (n == null) return '';
  return String(n);
}
function toNum(s: string | null | undefined): number | null {
  if (s == null || s === '') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}
function toIdList(arr: number[] | null | undefined): string[] {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.map((n) => String(n));
}
function toNumList(arr: string[] | null | undefined): number[] {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
}

/** Khớp cột bảng fp_ts_dot_kiem_ke_tai_san — dùng `DOT_LIST_SELECT`, map qua rowToDot */
interface DbDotRow {
  id: number;
  ma_dot: string;
  ten_dot: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  trang_thai: string;
  id_nguoi_phu_trach: number;
  id_nhom: number[] | null;
  id_noi_luu: number[] | null;
  id_nguoi_giu?: number[] | null;
  ghi_chu: string | null;
  trang_thai_active: string;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

/** Khớp cột bảng fp_ts_dot_kiem_ke_tai_san_chi_tiet — dùng `CT_LIST_SELECT`, map qua rowToChiTiet; ten_nguoi_kiem enrich từ getEmployees */
interface DbChiTietRow {
  id: number;
  id_dot_kiem_ke: number;
  id_tai_san: number;
  ma_tai_san: string | null;
  ten_tai_san: string | null;
  id_noi_luu_so: number;
  ten_noi_luu_so: string | null;
  id_nguoi_giu_so: number | null;
  ten_nguoi_giu_so: string | null;
  id_trang_thai_so: number;
  ten_trang_thai_so: string | null;
  id_noi_luu_thuc_te: number | null;
  ten_noi_luu_thuc_te: string | null;
  id_nguoi_giu_thuc_te: number | null;
  ten_nguoi_giu_thuc_te: string | null;
  id_trang_thai_thuc_te: number | null;
  ten_trang_thai_thuc_te: string | null;
  ket_qua: string;
  ghi_chu_dong: string | null;
  id_nguoi_kiem: number | null;
  ngay_kiem: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function rowToDot(row: DbDotRow, enrich?: { ten_nguoi_phu_trach?: string | null; ma_nguoi_phu_trach?: string | null }): DotKiemKe {
  return {
    id: String(row.id),
    ma_dot: row.ma_dot,
    ten_dot: row.ten_dot,
    ngay_bat_dau: row.ngay_bat_dau,
    ngay_ket_thuc: row.ngay_ket_thuc,
    trang_thai: row.trang_thai as TrangThaiDotKiemKe,
    id_nguoi_phu_trach: String(row.id_nguoi_phu_trach),
    ten_nguoi_phu_trach: enrich?.ten_nguoi_phu_trach ?? null,
    ma_nguoi_phu_trach: enrich?.ma_nguoi_phu_trach ?? null,
    id_nhom: toIdList(row.id_nhom ?? []),
    id_noi_luu: toIdList(row.id_noi_luu ?? []),
    id_nguoi_giu: toIdList((row as DbDotRow).id_nguoi_giu ?? []),
    ghi_chu: row.ghi_chu ?? null,
    trang_thai_active: (row.trang_thai_active || TRANG_THAI_ACTIVE_DEFAULT) as DotKiemKe['trang_thai_active'],
    tg_tao: row.tg_tao ?? '',
    tg_cap_nhat: row.tg_cap_nhat ?? '',
  };
}

function rowToChiTiet(row: DbChiTietRow): ChiTietKiemKe {
  return {
    id: String(row.id),
    id_dot_kiem_ke: String(row.id_dot_kiem_ke),
    id_tai_san: String(row.id_tai_san),
    ma_tai_san: row.ma_tai_san ?? undefined,
    ten_tai_san: row.ten_tai_san ?? undefined,
    id_noi_luu_so: String(row.id_noi_luu_so),
    ten_noi_luu_so: row.ten_noi_luu_so ?? null,
    id_nguoi_giu_so: row.id_nguoi_giu_so != null ? String(row.id_nguoi_giu_so) : null,
    ten_nguoi_giu_so: row.ten_nguoi_giu_so ?? null,
    id_trang_thai_so: String(row.id_trang_thai_so),
    ten_trang_thai_so: row.ten_trang_thai_so ?? null,
    id_noi_luu_thuc_te: row.id_noi_luu_thuc_te != null ? String(row.id_noi_luu_thuc_te) : null,
    ten_noi_luu_thuc_te: row.ten_noi_luu_thuc_te ?? null,
    id_nguoi_giu_thuc_te: row.id_nguoi_giu_thuc_te != null ? String(row.id_nguoi_giu_thuc_te) : null,
    ten_nguoi_giu_thuc_te: row.ten_nguoi_giu_thuc_te ?? null,
    id_trang_thai_thuc_te: row.id_trang_thai_thuc_te != null ? String(row.id_trang_thai_thuc_te) : null,
    ten_trang_thai_thuc_te: row.ten_trang_thai_thuc_te ?? null,
    ket_qua: (row.ket_qua || KET_QUA_CHUA_KIEM) as KetQuaKiemKe,
    ghi_chu_dong: row.ghi_chu_dong ?? null,
    id_nguoi_kiem: row.id_nguoi_kiem != null ? String(row.id_nguoi_kiem) : null,
    ten_nguoi_kiem: null,
    ngay_kiem: row.ngay_kiem ?? null,
    tg_tao: row.tg_tao ?? '',
    tg_cap_nhat: row.tg_cap_nhat ?? '',
  };
}

async function enrichDots(dots: DotKiemKe[]): Promise<DotKiemKe[]> {
  if (dots.length === 0) return dots;
  const employees = await getEmployeesRef();
  const empMap = new Map(employees.map((e) => [e.id, { ten: e.ho_ten, ma: e.ma_nhan_vien }]));
  return dots.map((d) => ({
    ...d,
    ten_nguoi_phu_trach: d.ten_nguoi_phu_trach ?? empMap.get(d.id_nguoi_phu_trach)?.ten ?? null,
    ma_nguoi_phu_trach: d.ma_nguoi_phu_trach ?? empMap.get(d.id_nguoi_phu_trach)?.ma ?? null,
  }));
}

async function enrichChiTietList(items: ChiTietKiemKe[]): Promise<ChiTietKiemKe[]> {
  if (items.length === 0) return items;
  const employees = await getEmployeesRef();
  const empMap = new Map(employees.map((e) => [e.id, e.ho_ten]));
  return items.map((c) => ({
    ...c,
    ten_nguoi_kiem: c.id_nguoi_kiem ? (c.ten_nguoi_kiem ?? empMap.get(c.id_nguoi_kiem) ?? null) : null,
  }));
}

function computeKetQua(c: ChiTietKiemKe): KetQuaKiemKe {
  const hasThucTe =
    c.id_noi_luu_thuc_te != null ||
    c.id_nguoi_giu_thuc_te != null ||
    c.id_trang_thai_thuc_te != null;
  if (!hasThucTe) return 'Chưa kiểm';
  const sameNoiLuu = (c.id_noi_luu_so || '') === (c.id_noi_luu_thuc_te || '');
  const sameNguoi = (c.id_nguoi_giu_so || '') === (c.id_nguoi_giu_thuc_te || '');
  const sameTrangThai = (c.id_trang_thai_so || '') === (c.id_trang_thai_thuc_te || '');
  if (sameNoiLuu && sameNguoi && sameTrangThai) return 'Khớp';
  if (!sameNoiLuu) return 'Chênh nơi lưu';
  if (!sameNguoi) return 'Chênh người giữ';
  if (!sameTrangThai) return 'Chênh trạng thái';
  return 'Khớp';
}

/** Trả về số thứ tự tiếp theo cho mã đợt (app format: KK-TS-NNN) */
export async function getNextMaDotDotKiemKeTaiSan(): Promise<number> {
  const { data, error } = await supabase.rpc('get_next_ma_dot_dot_kiem_ke_tai_san');
  if (error) throwSupabaseError(error);
  if (typeof data === 'number' && Number.isFinite(data)) return data;
  const n = Number(data);
  return Number.isFinite(n) ? n : 1;
}

export async function getDotKiemKeListSupabase(params: GetDotKiemKeListParams = {}): Promise<DotKiemKe[]> {
  let query = supabase.from(TABLE_DOT).select(DOT_LIST_SELECT).order('tg_cap_nhat', { ascending: false });
  if (params.filter === 'mine' && params.id_nguoi) {
    query = query.eq('id_nguoi_phu_trach', toNum(params.id_nguoi)!);
  }
  if (params.trang_thai_dot?.length) {
    query = query.in('trang_thai', params.trang_thai_dot);
  }
  if (params.dateFrom) {
    query = query.gte('ngay_ket_thuc', params.dateFrom);
  }
  if (params.dateTo) {
    query = query.lte('ngay_bat_dau', params.dateTo);
  }
  if (params.id_nguoi_phu_trach?.length) {
    const ids = params.id_nguoi_phu_trach.map((s) => toNum(s)).filter((n): n is number => n != null);
    if (ids.length) query = query.in('id_nguoi_phu_trach', ids);
  }
  const { data, error } = await query;
  if (error) throwSupabaseError(error);
  const list = (data ?? []).map((row) => rowToDot(row as DbDotRow));
  return enrichDots(list);
}

export async function getDotKiemKeByIdSupabase(id: string): Promise<DotKiemKe | null> {
  const numId = toNum(id);
  if (numId == null) return null;
  const { data, error } = await supabase.from(TABLE_DOT).select(DOT_LIST_SELECT).eq('id', numId).single();
  if (error || !data) return null;
  const [enriched] = await enrichDots([rowToDot(data as DbDotRow)]);
  return enriched;
}

export async function getChiTietByDotSupabase(id_dot_kiem_ke: string): Promise<ChiTietKiemKe[]> {
  const numDot = toNum(id_dot_kiem_ke);
  if (numDot == null) return [];
  const { data, error } = await supabase
    .from(TABLE_CT)
    .select(CT_LIST_SELECT)
    .eq('id_dot_kiem_ke', numDot)
    .order('id', { ascending: true });
  if (error) throwSupabaseError(error);
  const list = (data ?? []).map((row) => rowToChiTiet(row as DbChiTietRow));
  return enrichChiTietList(list);
}

export async function createDotKiemKeSupabase(data: DotKiemKeCreate): Promise<DotKiemKe> {
  const payload = {
    ma_dot: data.ma_dot,
    ten_dot: data.ten_dot,
    ngay_bat_dau: data.ngay_bat_dau,
    ngay_ket_thuc: data.ngay_ket_thuc,
    trang_thai: TRANG_THAI_NHAP,
    id_nguoi_phu_trach: toNum(data.id_nguoi_phu_trach)!,
    id_nhom: toNumList(data.id_nhom ?? []),
    id_noi_luu: toNumList(data.id_noi_luu ?? []),
    id_nguoi_giu: toNumList(data.id_nguoi_giu ?? []),
    ghi_chu: data.ghi_chu ?? null,
    trang_thai_active: TRANG_THAI_ACTIVE_DEFAULT,
  };
  const { data: inserted, error } = await supabase.from(TABLE_DOT).insert(payload).select(DOT_LIST_SELECT).single();
  if (error) throwSupabaseError(error);
  const [enriched] = await enrichDots([rowToDot(inserted as DbDotRow)]);
  return enriched;
}

export async function updateDotKiemKeSupabase(id: string, data: Partial<DotKiemKeCreate>): Promise<DotKiemKe> {
  const numId = toNum(id);
  if (numId == null) throw new Error('Đợt kiểm kê không tồn tại');
  const { data: current, error: e0 } = await supabase.from(TABLE_DOT).select('trang_thai').eq('id', numId).single();
  if (e0 || !current) throw new Error('Đợt kiểm kê không tồn tại');
  const trangThai = (current as { trang_thai: string }).trang_thai as TrangThaiDotKiemKe;
  if (!CAN_EDIT_DOT.includes(trangThai)) {
    throw new Error('Chỉ được sửa đợt ở trạng thái Nháp hoặc Đang kiểm kê');
  }
  const payload: Record<string, unknown> = {};
  if (data.ma_dot != null) payload.ma_dot = data.ma_dot;
  if (data.ten_dot != null) payload.ten_dot = data.ten_dot;
  if (data.ngay_bat_dau != null) payload.ngay_bat_dau = data.ngay_bat_dau;
  if (data.ngay_ket_thuc != null) payload.ngay_ket_thuc = data.ngay_ket_thuc;
  if (data.id_nguoi_phu_trach != null) payload.id_nguoi_phu_trach = toNum(data.id_nguoi_phu_trach);
  if (data.id_nhom != null) payload.id_nhom = toNumList(data.id_nhom);
  if (data.id_noi_luu != null) payload.id_noi_luu = toNumList(data.id_noi_luu);
  if (data.id_nguoi_giu != null) payload.id_nguoi_giu = toNumList(data.id_nguoi_giu);
  if (data.ghi_chu !== undefined) payload.ghi_chu = data.ghi_chu;
  const { error } = await supabase.from(TABLE_DOT).update(payload).eq('id', numId);
  if (error) throwSupabaseError(error);
  const updated = await getDotKiemKeByIdSupabase(id);
  if (!updated) throw new Error('Đợt kiểm kê không tồn tại');
  return updated;
}

export async function deleteDotKiemKeSupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((s) => toNum(s)).filter((n): n is number => n != null);
  if (numIds.length === 0) return;
  const { data: rows } = await supabase.from(TABLE_DOT).select('id, trang_thai').in('id', numIds);
  const allowed = (rows ?? []).filter((r: { trang_thai: string }) =>
    CAN_DELETE_DOT.includes(r.trang_thai as TrangThaiDotKiemKe)
  );
  if (allowed.length !== numIds.length) {
    throw new Error('Chỉ được xóa đợt ở trạng thái Nháp hoặc Đang kiểm kê');
  }
  const { error } = await supabase.from(TABLE_DOT).delete().in('id', numIds);
  if (error) throwSupabaseError(error);
}

export async function changeTrangThaiDotSupabase(id: string, trang_thai: TrangThaiDotKiemKe): Promise<DotKiemKe> {
  const numId = toNum(id);
  if (numId == null) throw new Error('Đợt kiểm kê không tồn tại');
  const { error } = await supabase.from(TABLE_DOT).update({ trang_thai }).eq('id', numId);
  if (error) throwSupabaseError(error);
  const updated = await getDotKiemKeByIdSupabase(id);
  if (!updated) throw new Error('Đợt kiểm kê không tồn tại');
  return updated;
}

export async function taoDanhSachKiemKeSupabase(
  id_dot_kiem_ke: string,
  filters?: TaoDanhSachKiemKeFilters
): Promise<ChiTietKiemKe[]> {
  const dot = await getDotKiemKeByIdSupabase(id_dot_kiem_ke);
  if (!dot) throw new Error('Đợt kiểm kê không tồn tại');
  if (!CAN_EDIT_DOT.includes(dot.trang_thai)) throw new Error('Chỉ tạo danh sách khi đợt ở trạng thái Nháp hoặc Đang kiểm kê');
  const [assets, locations] = await Promise.all([getTaiSanList(), getAssetStorageLocations()]);
  let filtered = assets.filter((a) => (a as { trang_thai?: number }).trang_thai === 1);
  if (dot.id_nhom.length) {
    filtered = filtered.filter((a) => dot.id_nhom.includes(a.id_nhom));
  }
  if (dot.id_noi_luu.length) {
    filtered = filtered.filter((a) => dot.id_noi_luu.includes(a.id_noi_luu));
  }
  if (dot.id_nguoi_giu?.length) {
    filtered = filtered.filter((a) => a.id_nhan_vien_dang_giu != null && dot.id_nguoi_giu!.includes(a.id_nhan_vien_dang_giu));
  }
  if (filters?.id_chi_nhanh?.length) {
    const noiLuuIdsInBranches = new Set(
      locations.filter((l) => filters!.id_chi_nhanh!.includes(l.id_chi_nhanh)).map((l) => l.id)
    );
    filtered = filtered.filter((a) => noiLuuIdsInBranches.has(a.id_noi_luu));
  }
  if (filters?.id_noi_luu?.length) {
    const setNoiLuu = new Set(filters.id_noi_luu);
    filtered = filtered.filter((a) => setNoiLuu.has(a.id_noi_luu));
  }
  if (filters?.id_nguoi_giu?.length) {
    const setNguoi = new Set(filters.id_nguoi_giu);
    filtered = filtered.filter((a) => a.id_nhan_vien_dang_giu != null && setNguoi.has(a.id_nhan_vien_dang_giu));
  }
  const existing = await getChiTietByDotSupabase(id_dot_kiem_ke);
  const existingIds = new Set(existing.map((c) => c.id_tai_san));
  const toAdd = filtered.filter((a) => !existingIds.has(a.id));
  const numDot = toNum(id_dot_kiem_ke)!;
  const rows = toAdd.map((a) => ({
    id_dot_kiem_ke: numDot,
    id_tai_san: toNum(a.id)!,
    ma_tai_san: a.ma_tai_san ?? null,
    ten_tai_san: a.ten_tai_san ?? null,
    id_noi_luu_so: toNum(a.id_noi_luu)!,
    ten_noi_luu_so: a.ten_noi_luu ?? null,
    id_nguoi_giu_so: toNum(a.id_nhan_vien_dang_giu ?? null),
    ten_nguoi_giu_so: a.ten_nhan_vien_dang_giu ?? null,
    id_trang_thai_so: toNum(a.id_trang_thai)!,
    ten_trang_thai_so: a.ten_trang_thai ?? null,
    id_noi_luu_thuc_te: null,
    ten_noi_luu_thuc_te: null,
    id_nguoi_giu_thuc_te: null,
    ten_nguoi_giu_thuc_te: null,
    id_trang_thai_thuc_te: null,
    ten_trang_thai_thuc_te: null,
    ket_qua: KET_QUA_CHUA_KIEM,
    ghi_chu_dong: null,
    id_nguoi_kiem: null,
    ngay_kiem: null,
  }));
  if (rows.length) {
    const { error } = await supabase.from(TABLE_CT).insert(rows);
    if (error) throwSupabaseError(error);
  }
  await supabase.from(TABLE_DOT).update({ trang_thai: TRANG_THAI_DANG_KIEM_KE }).eq('id', numDot);
  return getChiTietByDotSupabase(id_dot_kiem_ke);
}

export async function updateChiTietKetQuaSupabase(
  id_chi_tiet: string,
  data: ChiTietKiemKeUpdate,
  id_nguoi_kiem: string
): Promise<ChiTietKiemKe> {
  const numCtId = toNum(id_chi_tiet);
  if (numCtId == null) throw new Error('Chi tiết không tồn tại');
  const { data: row, error: e0 } = await supabase.from(TABLE_CT).select(CT_LIST_SELECT).eq('id', numCtId).single();
  if (e0 || !row) throw new Error('Chi tiết không tồn tại');
  const current = rowToChiTiet(row as DbChiTietRow);
  const [locations, employees, statuses] = await Promise.all([
    getAssetStorageLocations(),
    getEmployeesRef(),
    getAssetStatuses(),
  ]);
  const locMap = new Map(locations.map((l) => [l.id, l.ten_noi_luu]));
  const empMap = new Map(employees.map((e) => [e.id, e.ho_ten]));
  const statusMap = new Map(statuses.map((s) => [s.id, s.ten]));
  const updated: ChiTietKiemKe = {
    ...current,
    id_noi_luu_thuc_te: data.id_noi_luu_thuc_te !== undefined ? data.id_noi_luu_thuc_te : current.id_noi_luu_thuc_te,
    ten_noi_luu_thuc_te:
      data.id_noi_luu_thuc_te != null ? (locMap.get(data.id_noi_luu_thuc_te) ?? null) : data.id_noi_luu_thuc_te === null ? null : current.ten_noi_luu_thuc_te,
    id_nguoi_giu_thuc_te: data.id_nguoi_giu_thuc_te !== undefined ? data.id_nguoi_giu_thuc_te : current.id_nguoi_giu_thuc_te,
    ten_nguoi_giu_thuc_te:
      data.id_nguoi_giu_thuc_te != null ? (empMap.get(data.id_nguoi_giu_thuc_te) ?? null) : data.id_nguoi_giu_thuc_te === null ? null : current.ten_nguoi_giu_thuc_te,
    id_trang_thai_thuc_te: data.id_trang_thai_thuc_te !== undefined ? data.id_trang_thai_thuc_te : current.id_trang_thai_thuc_te,
    ten_trang_thai_thuc_te:
      data.id_trang_thai_thuc_te != null ? (statusMap.get(data.id_trang_thai_thuc_te) ?? null) : data.id_trang_thai_thuc_te === null ? null : current.ten_trang_thai_thuc_te,
    ghi_chu_dong: data.ghi_chu_dong !== undefined ? data.ghi_chu_dong : current.ghi_chu_dong,
    id_nguoi_kiem,
    ten_nguoi_kiem: empMap.get(id_nguoi_kiem) ?? null,
    ngay_kiem: new Date().toISOString(),
  };
  updated.ket_qua = computeKetQua(updated);
  const payload = {
    id_noi_luu_thuc_te: toNum(updated.id_noi_luu_thuc_te),
    ten_noi_luu_thuc_te: updated.ten_noi_luu_thuc_te,
    id_nguoi_giu_thuc_te: toNum(updated.id_nguoi_giu_thuc_te),
    ten_nguoi_giu_thuc_te: updated.ten_nguoi_giu_thuc_te,
    id_trang_thai_thuc_te: toNum(updated.id_trang_thai_thuc_te),
    ten_trang_thai_thuc_te: updated.ten_trang_thai_thuc_te,
    ket_qua: updated.ket_qua,
    ghi_chu_dong: updated.ghi_chu_dong,
    id_nguoi_kiem: toNum(id_nguoi_kiem),
    ngay_kiem: updated.ngay_kiem,
  };
  const { error } = await supabase.from(TABLE_CT).update(payload).eq('id', numCtId);
  if (error) throwSupabaseError(error);
  const { data: after } = await supabase.from(TABLE_CT).select(CT_LIST_SELECT).eq('id', numCtId).single();
  const [out] = await enrichChiTietList([rowToChiTiet((after ?? row) as DbChiTietRow)]);
  return out;
}

export async function deleteChiTietKiemKeSupabase(id_chi_tiet: string): Promise<void> {
  const numId = toNum(id_chi_tiet);
  if (numId == null) throw new Error('Không tìm thấy dòng chi tiết');
  const { data: row, error: fetchErr } = await supabase
    .from(TABLE_CT)
    .select('id_dot_kiem_ke')
    .eq('id', numId)
    .maybeSingle();
  if (fetchErr || !row) throw new Error('Không tìm thấy dòng chi tiết');
  const dot = await getDotKiemKeByIdSupabase(String((row as { id_dot_kiem_ke: number }).id_dot_kiem_ke));
  if (!dot) throw new Error('Đợt kiểm kê không tồn tại');
  if (dot.trang_thai === TRANG_THAI_HOAN_THANH) throw new Error('Chỉ được xóa dòng khi đợt ở trạng thái Nháp hoặc Đang kiểm kê');
  const { error } = await supabase.from(TABLE_CT).delete().eq('id', numId);
  if (error) throwSupabaseError(error);
}

export async function themChiTietPhatHienSupabase(
  id_dot_kiem_ke: string,
  payload: ThemChiTietPhatHienPayload,
  id_nguoi_kiem: string
): Promise<ChiTietKiemKe> {
  const dot = await getDotKiemKeByIdSupabase(id_dot_kiem_ke);
  if (!dot) throw new Error('Đợt kiểm kê không tồn tại');
  if (dot.trang_thai !== TRANG_THAI_DANG_KIEM_KE) throw new Error('Chỉ thêm khi đợt đang kiểm kê');
  const existing = await getChiTietByDotSupabase(id_dot_kiem_ke);
  if (existing.some((c) => c.id_tai_san === payload.id_tai_san)) throw new Error('Tài sản đã có trong danh sách đợt');
  const assets = await getTaiSanList();
  const asset = assets.find((a) => a.id === payload.id_tai_san);
  if (!asset) throw new Error('Tài sản không tồn tại');
  const [locations, employees, statuses] = await Promise.all([
    getAssetStorageLocations(),
    getEmployeesRef(),
    getAssetStatuses(),
  ]);
  const locMap = new Map(locations.map((l) => [l.id, l.ten_noi_luu]));
  const empMap = new Map(employees.map((e) => [e.id, e.ho_ten]));
  const statusMap = new Map(statuses.map((s) => [s.id, s.ten]));
  const c: ChiTietKiemKe = {
    id: '',
    id_dot_kiem_ke,
    id_tai_san: asset.id,
    ma_tai_san: asset.ma_tai_san,
    ten_tai_san: asset.ten_tai_san,
    id_noi_luu_so: asset.id_noi_luu,
    ten_noi_luu_so: asset.ten_noi_luu ?? null,
    id_nguoi_giu_so: asset.id_nhan_vien_dang_giu ?? null,
    ten_nguoi_giu_so: asset.ten_nhan_vien_dang_giu ?? null,
    id_trang_thai_so: asset.id_trang_thai,
    ten_trang_thai_so: asset.ten_trang_thai ?? null,
    id_noi_luu_thuc_te: payload.id_noi_luu_thuc_te,
    ten_noi_luu_thuc_te: payload.id_noi_luu_thuc_te ? (locMap.get(payload.id_noi_luu_thuc_te) ?? null) : null,
    id_nguoi_giu_thuc_te: payload.id_nguoi_giu_thuc_te,
    ten_nguoi_giu_thuc_te: payload.id_nguoi_giu_thuc_te ? (empMap.get(payload.id_nguoi_giu_thuc_te) ?? null) : null,
    id_trang_thai_thuc_te: payload.id_trang_thai_thuc_te,
    ten_trang_thai_thuc_te: payload.id_trang_thai_thuc_te ? (statusMap.get(payload.id_trang_thai_thuc_te) ?? null) : null,
    ghi_chu_dong: payload.ghi_chu_dong ?? null,
    id_nguoi_kiem,
    ten_nguoi_kiem: empMap.get(id_nguoi_kiem) ?? null,
    ngay_kiem: new Date().toISOString(),
    tg_tao: '',
    tg_cap_nhat: '',
  };
  c.ket_qua = computeKetQua(c);
  const insertRow = {
    id_dot_kiem_ke: toNum(id_dot_kiem_ke)!,
    id_tai_san: toNum(asset.id)!,
    ma_tai_san: asset.ma_tai_san ?? null,
    ten_tai_san: asset.ten_tai_san ?? null,
    id_noi_luu_so: toNum(asset.id_noi_luu)!,
    ten_noi_luu_so: asset.ten_noi_luu ?? null,
    id_nguoi_giu_so: toNum(asset.id_nhan_vien_dang_giu ?? null),
    ten_nguoi_giu_so: asset.ten_nhan_vien_dang_giu ?? null,
    id_trang_thai_so: toNum(asset.id_trang_thai)!,
    ten_trang_thai_so: asset.ten_trang_thai ?? null,
    id_noi_luu_thuc_te: toNum(payload.id_noi_luu_thuc_te ?? null),
    ten_noi_luu_thuc_te: c.ten_noi_luu_thuc_te,
    id_nguoi_giu_thuc_te: toNum(payload.id_nguoi_giu_thuc_te ?? null),
    ten_nguoi_giu_thuc_te: c.ten_nguoi_giu_thuc_te,
    id_trang_thai_thuc_te: toNum(payload.id_trang_thai_thuc_te ?? null),
    ten_trang_thai_thuc_te: c.ten_trang_thai_thuc_te,
    ket_qua: c.ket_qua,
    ghi_chu_dong: c.ghi_chu_dong,
    id_nguoi_kiem: toNum(id_nguoi_kiem),
    ngay_kiem: c.ngay_kiem,
  };
  const { data: inserted, error } = await supabase.from(TABLE_CT).insert(insertRow).select(CT_LIST_SELECT).single();
  if (error) throwSupabaseError(error);
  const [out] = await enrichChiTietList([rowToChiTiet(inserted as DbChiTietRow)]);
  return out;
}

export async function capNhatSoTheoKetQuaSupabase(id_chi_tiet: string): Promise<void> {
  const numCtId = toNum(id_chi_tiet);
  if (numCtId == null) throw new Error('Chi tiết không tồn tại');
  const { data: row, error } = await supabase.from(TABLE_CT).select(CT_LIST_SELECT).eq('id', numCtId).single();
  if (error || !row) throw new Error('Chi tiết không tồn tại');
  const c = rowToChiTiet(row as DbChiTietRow);
  if (
    c.id_noi_luu_thuc_te == null &&
    c.id_nguoi_giu_thuc_te == null &&
    c.id_trang_thai_thuc_te == null
  ) {
    throw new Error('Chưa có kết quả kiểm thực tế để đồng bộ');
  }
  await updateTaiSanFromKiemKe(c.id_tai_san, {
    id_noi_luu: c.id_noi_luu_thuc_te ?? undefined,
    id_nhan_vien_dang_giu: c.id_nguoi_giu_thuc_te ?? undefined,
    id_trang_thai: c.id_trang_thai_thuc_te ?? undefined,
  });
}

export async function hoanThanhDotSupabase(id_dot_kiem_ke: string): Promise<DotKiemKe> {
  const dot = await getDotKiemKeByIdSupabase(id_dot_kiem_ke);
  if (!dot) throw new Error('Đợt kiểm kê không tồn tại');
  if (dot.trang_thai !== TRANG_THAI_DANG_KIEM_KE) throw new Error('Chỉ hoàn thành đợt đang kiểm kê');
  const numId = toNum(id_dot_kiem_ke)!;
  const { error } = await supabase.from(TABLE_DOT).update({ trang_thai: TRANG_THAI_HOAN_THANH }).eq('id', numId);
  if (error) throwSupabaseError(error);
  const updated = await getDotKiemKeByIdSupabase(id_dot_kiem_ke);
  if (!updated) throw new Error('Đợt kiểm kê không tồn tại');
  return updated;
}
