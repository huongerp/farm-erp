import type {
  BangLuongRecord,
  ChamDiemKpiRecord,
  CongTruLuongItem,
  EmployeeAttendanceRow,
  LuongNhanVienConfig,
} from '../core/types';
import { NGAY_CONG_CHUAN_THANG, NGUONG_DAT_KPI, TY_LE_LUONG_KPI_KHONG_DAT } from '../core/constants';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import type { Employee } from '@/features/he-thong/nhan-vien/core/types';
import {
  db,
  fetchAllRows,
  fetchTablePage,
  throwSupabaseError,
  type PaginatedTableResult,
} from '../../../../lib/db';
import { applyPostgrestSearch } from '../../../../lib/postgrest-search';
import { postgrestQuotedIlikePattern } from '../../../../lib/postgrest-or-ilike';
import {
  BANG_LUONG_SORTABLE_DB_COLUMNS,
  BANG_LUONG_SORT_MAC_DINH,
  tachKyLuong,
  type BangLuongListServerQuery,
} from './bang-luong-list-query';
import i18n from '../../../../lib/i18n';

const TABLE = 'fp_hr_bang_luong';
const TABLE_NHAN_VIEN = 'fp_var_nhan_vien';
const TABLE_PHONG_BAN = 'fp_var_phong_ban';

const BANG_LUONG_ROW_COLUMNS =
  'id,nhan_vien_id,nam,thang,ngay_cong,ngay_cong_chuan,luong_co_ban,luong_co_ban_tinh,luong_kpi,diem_kpi,kpi_dat,ty_le_kpi_khong_dat,luong_kpi_tinh,luong_trach_nhiem,luong_trach_nhiem_tinh,phu_cap,phu_cap_tinh,cong_tru_khac,cong_tru_net,tong_luong,ghi_chu,tg_tao,tg_cap_nhat';

type Row = Record<string, unknown>;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Không còn module chấm điểm KPI — trả rỗng; có thể nối bảng Supabase sau. */
async function getChamDiemKpiRecords(): Promise<ChamDiemKpiRecord[]> {
  return [];
}

/** Không còn module chấm công — trả rỗng; có thể nối bảng Supabase sau. */
async function getEmployeeAttendance(_monthKey: string): Promise<EmployeeAttendanceRow[]> {
  return [];
}

/** DB lưu cong_tru_khac là numeric; đọc ra chuyển thành mảng 1 phần tử cho UI. */
function parseCongTruKhac(val: unknown): CongTruLuongItem[] {
  if (typeof val === 'number' && !Number.isNaN(val)) {
    const n = val;
    return [{ id: '', loai: n >= 0 ? 'cong' : 'tru', so_tien: Math.abs(n) }];
  }
  if (Array.isArray(val) && val.length > 0) {
    return val.map((i: any) => ({
      id: String(i?.id ?? ''),
      loai: (i?.loai === 'tru' ? 'tru' : 'cong') as CongTruLuongItem['loai'],
      so_tien: Number(i?.so_tien) || 0,
      ly_do: i?.ly_do ? String(i.ly_do) : undefined,
    }));
  }
  return [];
}

function rowToRecord(
  row: Row,
  nhanVienMap: Record<number, { ho_va_ten: string; ma_nhan_vien?: string; phong_ban_id?: number }>,
  phongBanMap: Record<number, string>
): BangLuongRecord {
  const nvId = row.nhan_vien_id != null ? Number(row.nhan_vien_id) : null;
  const nv = nvId != null ? nhanVienMap[nvId] : null;
  const pbId = nv?.phong_ban_id;
  const ten_phong_ban = pbId != null ? phongBanMap[pbId] : undefined;
  return {
    id: String(row.id),
    id_nhan_vien: String(row.nhan_vien_id ?? ''),
    ten_nhan_vien: nv?.ho_va_ten,
    ma_nhan_vien: nv?.ma_nhan_vien,
    id_phong_ban: pbId != null ? String(pbId) : undefined,
    ten_phong_ban,
    nam: Number(row.nam) || 0,
    thang: Number(row.thang) || 0,
    ngay_cong: Number(row.ngay_cong) || 0,
    ngay_cong_chuan: Number(row.ngay_cong_chuan) || 22,
    luong_co_ban: Number(row.luong_co_ban) || 0,
    luong_co_ban_tinh: Number(row.luong_co_ban_tinh) || 0,
    luong_kpi: Number(row.luong_kpi) || 0,
    diem_kpi: Number(row.diem_kpi) || 0,
    kpi_dat: Boolean(row.kpi_dat),
    ty_le_kpi_khong_dat: Number(row.ty_le_kpi_khong_dat) || 0.7,
    luong_kpi_tinh: Number(row.luong_kpi_tinh) || 0,
    luong_trach_nhiem: Number(row.luong_trach_nhiem) || 0,
    luong_trach_nhiem_tinh: Number(row.luong_trach_nhiem_tinh) || 0,
    phu_cap: Number(row.phu_cap) || 0,
    phu_cap_tinh: Number(row.phu_cap_tinh) || 0,
    cong_tru_khac: parseCongTruKhac(row.cong_tru_khac),
    cong_tru_net: Number(row.cong_tru_net) || 0,
    tong_luong: Number(row.tong_luong) || 0,
    ghi_chu: row.ghi_chu != null ? String(row.ghi_chu) : undefined,
    tg_tao: (row.tg_tao as string) ?? new Date().toISOString(),
    tg_cap_nhat: (row.tg_cap_nhat as string) ?? new Date().toISOString(),
  };
}

async function fetchNhanVienPhongBanMaps(
  nhanVienIds: number[]
): Promise<{
  nhanVienMap: Record<number, { ho_va_ten: string; ma_nhan_vien?: string; phong_ban_id?: number }>;
  phongBanMap: Record<number, string>;
}> {
  const nhanVienMap: Record<number, { ho_va_ten: string; ma_nhan_vien?: string; phong_ban_id?: number }> = {};
  const phongBanMap: Record<number, string> = {};
  if (nhanVienIds.length === 0) return { nhanVienMap, phongBanMap };
  const uniq = [...new Set(nhanVienIds)];
  const { data: nvRows } = await db
    .from(TABLE_NHAN_VIEN)
    .select('id, ho_va_ten, phong_ban_id')
    .in('id', uniq);
  const phongBanIds = (nvRows ?? [])
    .map((r: Row) => r.phong_ban_id)
    .filter((id): id is number => id != null) as number[];
  (nvRows ?? []).forEach((r: Row) => {
    const id = Number(r.id);
    nhanVienMap[id] = {
      ho_va_ten: (r.ho_va_ten as string) ?? '',
      ma_nhan_vien: `NV${id}`,
      phong_ban_id: r.phong_ban_id != null ? Number(r.phong_ban_id) : undefined,
    };
  });
  if (phongBanIds.length > 0) {
    const pbUniq = [...new Set(phongBanIds)];
    const { data: pbRows } = await db.from(TABLE_PHONG_BAN).select('id, ten_phong_ban').in('id', pbUniq);
    (pbRows ?? []).forEach((r: Row) => {
      phongBanMap[Number(r.id)] = (r.ten_phong_ban as string) ?? '';
    });
  }
  return { nhanVienMap, phongBanMap };
}

/** Các kỳ (nam-thang) cần tính bảng lương (có dữ liệu chấm công / KPI) */
const PAYROLL_PERIODS = ['2024-12', '2025-01', '2025-02'] as const;

/** Guard chỉ seed một lần; kết quả tính toán hiện chưa được cache lại (xem getBangLuongRecords). */
let dbSeeded = false;

function buildKpiMap(records: ChamDiemKpiRecord[]): Map<string, ChamDiemKpiRecord> {
  const map = new Map<string, ChamDiemKpiRecord>();
  for (const r of records) {
    map.set(`${r.id_nhan_vien}-${r.nam}-${r.thang}`, r);
  }
  return map;
}

function getSalaryConfig(_id_nhan_vien: string): LuongNhanVienConfig | null {
  return null;
}

function getCongTruForPeriod(
  _id_nhan_vien: string,
  _nam: number,
  _thang: number
): CongTruLuongItem[] {
  return [];
}

function computeCongTruNet(items: CongTruLuongItem[]): number {
  return items.reduce((sum, i) => sum + (i.loai === 'cong' ? i.so_tien : -i.so_tien), 0);
}

function buildOneRecord(
  id_nhan_vien: string,
  nam: number,
  thang: number,
  att: EmployeeAttendanceRow,
  emp: Employee | undefined,
  config: LuongNhanVienConfig | null,
  kpiRecord: ChamDiemKpiRecord | null,
  cong_tru_khac: CongTruLuongItem[],
  now: string
): BangLuongRecord {
  const luong_co_ban = config?.luong_co_ban ?? 0;
  const luong_kpi = config?.luong_kpi ?? 0;
  const luong_trach_nhiem = config?.luong_trach_nhiem ?? 0;
  const phu_cap = config?.phu_cap ?? 0;
  const ngay_cong = att.total_days;
  const ngay_cong_chuan = NGAY_CONG_CHUAN_THANG;
  const he_so = ngay_cong_chuan > 0 ? ngay_cong / ngay_cong_chuan : 0;
  const luong_co_ban_tinh = Math.round(luong_co_ban * he_so);
  const luong_trach_nhiem_tinh = Math.round(luong_trach_nhiem * he_so);
  const phu_cap_tinh = Math.round(phu_cap * he_so);
  const diem_kpi = kpiRecord?.tong_kpi ?? 0;
  const kpi_dat = diem_kpi >= NGUONG_DAT_KPI;
  const ty_le = kpi_dat ? 1 : TY_LE_LUONG_KPI_KHONG_DAT;
  const luong_kpi_tinh = Math.round(luong_kpi * he_so * ty_le);
  const cong_tru_net = computeCongTruNet(cong_tru_khac);
  const tong_luong =
    luong_co_ban_tinh + luong_kpi_tinh + luong_trach_nhiem_tinh + phu_cap_tinh + cong_tru_net;
  const id = `bl-${id_nhan_vien}-${nam}-${thang}`;
  return {
    id,
    id_nhan_vien,
    ten_nhan_vien: emp?.ho_ten ?? att.user_name ?? undefined,
    ma_nhan_vien: emp?.ma_nhan_vien,
    id_phong_ban: emp?.id_phong_ban ?? undefined,
    ten_phong_ban: emp?.ten_phong_ban ?? att.department_name ?? undefined,
    nam,
    thang,
    ngay_cong,
    ngay_cong_chuan,
    luong_co_ban,
    luong_co_ban_tinh,
    luong_kpi,
    diem_kpi,
    kpi_dat,
    ty_le_kpi_khong_dat: TY_LE_LUONG_KPI_KHONG_DAT,
    luong_kpi_tinh,
    luong_trach_nhiem,
    luong_trach_nhiem_tinh,
    phu_cap,
    phu_cap_tinh,
    cong_tru_khac,
    cong_tru_net,
    tong_luong,
    tg_tao: now,
    tg_cap_nhat: now,
  };
}

async function seedDb(): Promise<void> {
  if (dbSeeded) return;
  await delay(300);
  const [employees, kpiRecords, ...attendanceByMonth] = await Promise.all([
    getEmployees(),
    getChamDiemKpiRecords(),
    getEmployeeAttendance('2024-12'),
    getEmployeeAttendance('2025-01'),
    getEmployeeAttendance('2025-02'),
  ]);
  const kpiMap = buildKpiMap(kpiRecords);
  const now = new Date().toISOString();
  const results: BangLuongRecord[] = [];

  PAYROLL_PERIODS.forEach((monthKey, periodIndex) => {
    const [yearStr, monthStr] = monthKey.split('-');
    const nam = parseInt(yearStr, 10);
    const thang = parseInt(monthStr, 10);
    const attendanceRows = attendanceByMonth[periodIndex] as Awaited<ReturnType<typeof getEmployeeAttendance>>;
    for (const att of attendanceRows) {
      const id_nhan_vien = att.user_id;
      const emp = employees.find((e) => e.id === id_nhan_vien);
      const config = getSalaryConfig(id_nhan_vien);
      const kpiRecord = kpiMap.get(`${id_nhan_vien}-${nam}-${thang}`) ?? null;
      const cong_tru_khac = getCongTruForPeriod(id_nhan_vien, nam, thang);
      results.push(
        buildOneRecord(id_nhan_vien, nam, thang, att, emp, config, kpiRecord, cong_tru_khac, now)
      );
    }
  });

  dbSeeded = true;
}

/** Cột của chính bảng lương tham gia ô tìm kiếm. */
const BANG_LUONG_SEARCH_SPEC = {
  text: ['ghi_chu'],
  numeric: ['id', 'nam', 'thang', 'tong_luong', 'ngay_cong'],
} as const;

/**
 * Id nhân viên khớp từ khoá (tên / mã / email).
 *
 * Tên nhân viên nằm ở bảng khác nên không `OR` chung với cột bảng lương được;
 * tra id trước rồi lọc `nhan_vien_id.in.(...)` — cùng cách phiếu đề xuất vật tư
 * đang làm với phạm vi kho.
 */
async function timNhanVienIdsTheoTuKhoa(term: string): Promise<number[]> {
  const t = term.trim();
  if (!t) return [];
  const esc = t.replace(/%/g, '\\%').replace(/_/g, '\\_');
  const pat = postgrestQuotedIlikePattern(`%${esc}%`);
  const { data, error } = await db
    .from(TABLE_NHAN_VIEN)
    .select('id')
    .or(`ho_va_ten.ilike.${pat},ma_nhan_vien.ilike.${pat},email.ilike.${pat}`)
    .limit(500);
  if (error) throwSupabaseError(error, { resource: `${TABLE_NHAN_VIEN}.search` });
  return (data ?? []).map((r) => Number((r as { id: unknown }).id)).filter(Number.isFinite);
}

/** Id nhân viên thuộc các phòng ban đã chọn. */
async function timNhanVienIdsTheoPhongBan(phongBanIds: string[]): Promise<number[]> {
  const ids = phongBanIds.map(Number).filter(Number.isFinite);
  if (ids.length === 0) return [];
  const { data, error } = await db.from(TABLE_NHAN_VIEN).select('id').in('phong_ban_id', ids);
  if (error) throwSupabaseError(error, { resource: `${TABLE_NHAN_VIEN}.byPhongBan` });
  return (data ?? []).map((r) => Number((r as { id: unknown }).id)).filter(Number.isFinite);
}

/** Lọc + sắp xếp dùng chung cho trang danh sách và cho lượt tải phục vụ xuất file. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyBangLuongListQuery(q: any, query: BangLuongListServerQuery, nhanVienIds: number[] | null): any {
  let sel = q;

  const ky = tachKyLuong(query.yearMonth);
  if (ky) sel = sel.eq('nam', ky.nam).eq('thang', ky.thang);

  if (query.nhanVienId) {
    const n = Number(query.nhanVienId);
    sel = Number.isFinite(n) ? sel.eq('nhan_vien_id', n) : sel.eq('id', -1);
  }
  if (query.loaiTruNhanVienId) {
    const n = Number(query.loaiTruNhanVienId);
    if (Number.isFinite(n)) sel = sel.neq('nhan_vien_id', n);
  }

  if (nhanVienIds != null) {
    // Không nhân viên nào khớp → danh sách rỗng, đừng bỏ qua điều kiện.
    sel = nhanVienIds.length === 0 ? sel.eq('id', -1) : sel.in('nhan_vien_id', nhanVienIds);
  }

  sel = applyPostgrestSearch(sel, query.searchTerm, BANG_LUONG_SEARCH_SPEC);

  const dbSortable = query.sortColumn != null && BANG_LUONG_SORTABLE_DB_COLUMNS.has(query.sortColumn);
  const sortCol = dbSortable ? query.sortColumn! : BANG_LUONG_SORT_MAC_DINH.column;
  const ascending = dbSortable ? query.sortDirection !== 'desc' : BANG_LUONG_SORT_MAC_DINH.ascending;

  sel = sel.order(sortCol, { ascending });
  if (sortCol === 'nam') sel = sel.order('thang', { ascending });
  return sel.order('id', { ascending: false });
}

/**
 * Gộp hai nguồn ràng buộc theo nhân viên (phòng ban + từ khoá) thành một danh sách
 * id; `null` nghĩa là không ràng buộc.
 */
async function nhanVienIdsChoQuery(query: BangLuongListServerQuery): Promise<number[] | null> {
  const [theoPhongBan, theoTuKhoa] = await Promise.all([
    query.phongBan.length > 0 ? timNhanVienIdsTheoPhongBan(query.phongBan) : Promise.resolve(null),
    query.searchTerm.trim() ? timNhanVienIdsTheoTuKhoa(query.searchTerm) : Promise.resolve(null),
  ]);
  if (theoPhongBan == null) return theoTuKhoa;
  if (theoTuKhoa == null) return theoPhongBan;
  const set = new Set(theoTuKhoa);
  return theoPhongBan.filter((id) => set.has(id));
}

export async function getBangLuongPage(
  query: BangLuongListServerQuery
): Promise<PaginatedTableResult<BangLuongRecord>> {
  const nhanVienIds = await nhanVienIdsChoQuery(query);
  const result = await fetchTablePage<Row>(query.page, query.pageSize, async (from, to) => {
    const res = await applyBangLuongListQuery(
      db.from(TABLE).select(BANG_LUONG_ROW_COLUMNS, { count: 'exact' }),
      query,
      nhanVienIds
    ).range(from, to);
    return { data: (res.data as Row[] | null) ?? null, error: res.error, count: res.count };
  });
  const ids = result.data.map((r) => Number(r.nhan_vien_id)).filter((n) => !Number.isNaN(n));
  const { nhanVienMap, phongBanMap } = await fetchNhanVienPhongBanMaps(ids);
  return { ...result, data: result.data.map((r) => rowToRecord(r, nhanVienMap, phongBanMap)) };
}

/** Toàn bộ bản ghi khớp bộ lọc — chỉ gọi khi mở hộp thoại Xuất file. */
export async function fetchAllBangLuongForListQuery(
  query: BangLuongListServerQuery
): Promise<BangLuongRecord[]> {
  const nhanVienIds = await nhanVienIdsChoQuery(query);
  const rows = await fetchAllRows<Row>((from, to) =>
    applyBangLuongListQuery(db.from(TABLE).select(BANG_LUONG_ROW_COLUMNS), query, nhanVienIds).range(from, to)
  );
  const ids = rows.map((r) => Number(r.nhan_vien_id)).filter((n) => !Number.isNaN(n));
  const { nhanVienMap, phongBanMap } = await fetchNhanVienPhongBanMaps(ids);
  return rows.map((r) => rowToRecord(r, nhanVienMap, phongBanMap));
}

export async function getBangLuongRecords(): Promise<BangLuongRecord[]> {
  const { data: rows, error } = await db
    .from(TABLE)
    .select(BANG_LUONG_ROW_COLUMNS)
    .order('nam', { ascending: false })
    .order('thang', { ascending: false });
  if (error) throw new Error(error.message ?? i18n.t('bangLuong.service.error'));
  const list = (rows ?? []) as Row[];
  const nhanVienIds = list.map((r) => Number(r.nhan_vien_id)).filter((n) => !Number.isNaN(n));
  const { nhanVienMap, phongBanMap } = await fetchNhanVienPhongBanMaps(nhanVienIds);
  return list.map((r) => rowToRecord(r, nhanVienMap, phongBanMap));
}

export async function getBangLuongById(id: string): Promise<BangLuongRecord | null> {
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await db.from(TABLE).select(BANG_LUONG_ROW_COLUMNS).eq('id', idNum).maybeSingle();
  if (error) throw new Error(error.message ?? i18n.t('bangLuong.service.error'));
  if (!row) return null;
  const nvId = Number((row as Row).nhan_vien_id);
  const { nhanVienMap, phongBanMap } = await fetchNhanVienPhongBanMaps([nvId]);
  return rowToRecord(row as Row, nhanVienMap, phongBanMap);
}

export async function getBangLuongByNhanVienPeriod(
  id_nhan_vien: string,
  nam: number,
  thang: number
): Promise<BangLuongRecord | null> {
  const nvId = parseInt(id_nhan_vien, 10);
  if (Number.isNaN(nvId)) return null;
  const { data: row, error } = await db
    .from(TABLE)
    .select(BANG_LUONG_ROW_COLUMNS)
    .eq('nhan_vien_id', nvId)
    .eq('nam', nam)
    .eq('thang', thang)
    .maybeSingle();
  if (error) throw new Error(error.message ?? i18n.t('bangLuong.service.error'));
  if (!row) return null;
  const { nhanVienMap, phongBanMap } = await fetchNhanVienPhongBanMaps([nvId]);
  return rowToRecord(row as Row, nhanVienMap, phongBanMap);
}

/** Tính một bản ghi bảng lương cho (nhân viên, kỳ) — dùng khi Thêm mới */
export async function computeOneBangLuongRecord(
  id_nhan_vien: string,
  nam: number,
  thang: number
): Promise<BangLuongRecord | null> {
  await seedDb();
  const monthKey = `${nam}-${String(thang).padStart(2, '0')}`;
  const [employees, kpiRecords, attendanceRows] = await Promise.all([
    getEmployees(),
    getChamDiemKpiRecords(),
    getEmployeeAttendance(monthKey),
  ]);
  const att = attendanceRows.find((r) => r.user_id === id_nhan_vien);
  if (!att) return null;
  const emp = employees.find((e) => e.id === id_nhan_vien);
  const config = getSalaryConfig(id_nhan_vien);
  const kpiMap = buildKpiMap(kpiRecords);
  const kpiRecord = kpiMap.get(`${id_nhan_vien}-${nam}-${thang}`) ?? null;
  const cong_tru_khac = getCongTruForPeriod(id_nhan_vien, nam, thang);
  const now = new Date().toISOString();
  return buildOneRecord(
    id_nhan_vien,
    nam,
    thang,
    att,
    emp,
    config,
    kpiRecord,
    cong_tru_khac,
    now
  );
}

/** Thêm bản ghi (tính từ chấm công + KPI). Trùng kỳ thì bỏ qua hoặc lỗi. */
export async function addBangLuong(
  id_nhan_vien: string,
  nam: number,
  thang: number
): Promise<BangLuongRecord> {
  const nvId = parseInt(id_nhan_vien, 10);
  if (Number.isNaN(nvId)) throw new Error(i18n.t('bangLuong.service.noAttendance'));
  const existing = await getBangLuongByNhanVienPeriod(id_nhan_vien, nam, thang);
  if (existing) return existing;
  const record = await computeOneBangLuongRecord(id_nhan_vien, nam, thang);
  if (!record) throw new Error(i18n.t('bangLuong.service.noAttendance'));
  const row = {
    nhan_vien_id: nvId,
    nam,
    thang,
    ngay_cong: record.ngay_cong,
    ngay_cong_chuan: record.ngay_cong_chuan,
    luong_co_ban: record.luong_co_ban,
    luong_co_ban_tinh: record.luong_co_ban_tinh,
    luong_kpi: record.luong_kpi,
    diem_kpi: record.diem_kpi,
    kpi_dat: record.kpi_dat,
    ty_le_kpi_khong_dat: record.ty_le_kpi_khong_dat,
    luong_kpi_tinh: record.luong_kpi_tinh,
    luong_trach_nhiem: record.luong_trach_nhiem,
    luong_trach_nhiem_tinh: record.luong_trach_nhiem_tinh,
    phu_cap: record.phu_cap,
    phu_cap_tinh: record.phu_cap_tinh,
    cong_tru_khac: computeCongTruNet(record.cong_tru_khac),
    cong_tru_net: record.cong_tru_net,
    tong_luong: record.tong_luong,
    tg_cap_nhat: null,
  };
  const { data: inserted, error } = await db.from(TABLE).insert(row).select(BANG_LUONG_ROW_COLUMNS).single();
  if (error) throw new Error(error.message ?? i18n.t('bangLuong.service.error'));
  const { nhanVienMap, phongBanMap } = await fetchNhanVienPhongBanMaps([nvId]);
  return rowToRecord(inserted as Row, nhanVienMap, phongBanMap);
}

/** Cập nhật bản ghi (tất cả trường được phép sửa). */
export async function saveBangLuong(record: BangLuongRecord): Promise<BangLuongRecord> {
  const cong_tru_net = computeCongTruNet(record.cong_tru_khac);
  const tong_luong =
    record.luong_co_ban_tinh +
    record.luong_kpi_tinh +
    record.luong_trach_nhiem_tinh +
    record.phu_cap_tinh +
    cong_tru_net;
  const idNum = parseInt(record.id, 10);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('bangLuong.service.error'));
  const { data: updated, error } = await db
    .from(TABLE)
    .update({
      ngay_cong: record.ngay_cong,
      ngay_cong_chuan: record.ngay_cong_chuan,
      luong_co_ban: record.luong_co_ban,
      luong_co_ban_tinh: record.luong_co_ban_tinh,
      luong_kpi: record.luong_kpi,
      diem_kpi: record.diem_kpi,
      kpi_dat: record.kpi_dat,
      ty_le_kpi_khong_dat: record.ty_le_kpi_khong_dat,
      luong_kpi_tinh: record.luong_kpi_tinh,
      luong_trach_nhiem: record.luong_trach_nhiem,
      luong_trach_nhiem_tinh: record.luong_trach_nhiem_tinh,
      phu_cap: record.phu_cap,
      phu_cap_tinh: record.phu_cap_tinh,
      cong_tru_khac: computeCongTruNet(record.cong_tru_khac),
      cong_tru_net,
      tong_luong,
      ghi_chu: record.ghi_chu ?? null,
      tg_cap_nhat: new Date().toISOString(),
    })
    .eq('id', idNum)
    .select(BANG_LUONG_ROW_COLUMNS)
    .single();
  if (error) throw new Error(error.message ?? i18n.t('bangLuong.service.error'));
  const nvId = Number((updated as Row).nhan_vien_id);
  const { nhanVienMap, phongBanMap } = await fetchNhanVienPhongBanMaps([nvId]);
  return rowToRecord(updated as Row, nhanVienMap, phongBanMap);
}

/** Tạo bản ghi từ form (nhập tay toàn bộ trường). */
export async function createBangLuongFromRecord(
  record: Omit<BangLuongRecord, 'id' | 'ten_nhan_vien' | 'ma_nhan_vien' | 'id_phong_ban' | 'ten_phong_ban' | 'tg_tao' | 'tg_cap_nhat'>
): Promise<BangLuongRecord> {
  const nvId = parseInt(record.id_nhan_vien, 10);
  if (Number.isNaN(nvId)) throw new Error(i18n.t('bangLuong.service.error'));
  const existing = await getBangLuongByNhanVienPeriod(record.id_nhan_vien, record.nam, record.thang);
  if (existing) throw new Error(i18n.t('bangLuong.service.duplicatePeriod'));
  const cong_tru_net = computeCongTruNet(record.cong_tru_khac);
  const tong_luong =
    record.luong_co_ban_tinh +
    record.luong_kpi_tinh +
    record.luong_trach_nhiem_tinh +
    record.phu_cap_tinh +
    cong_tru_net;
  const row = {
    nhan_vien_id: nvId,
    nam: record.nam,
    thang: record.thang,
    ngay_cong: record.ngay_cong,
    ngay_cong_chuan: record.ngay_cong_chuan,
    luong_co_ban: record.luong_co_ban,
    luong_co_ban_tinh: record.luong_co_ban_tinh,
    luong_kpi: record.luong_kpi,
    diem_kpi: record.diem_kpi,
    kpi_dat: record.kpi_dat,
    ty_le_kpi_khong_dat: record.ty_le_kpi_khong_dat,
    luong_kpi_tinh: record.luong_kpi_tinh,
    luong_trach_nhiem: record.luong_trach_nhiem,
    luong_trach_nhiem_tinh: record.luong_trach_nhiem_tinh,
    phu_cap: record.phu_cap,
    phu_cap_tinh: record.phu_cap_tinh,
    cong_tru_khac: computeCongTruNet(record.cong_tru_khac),
    cong_tru_net,
    tong_luong,
    ghi_chu: record.ghi_chu ?? null,
  };
  const { data: inserted, error } = await db.from(TABLE).insert(row).select(BANG_LUONG_ROW_COLUMNS).single();
  if (error) throw new Error(error.message ?? i18n.t('bangLuong.service.error'));
  const { nhanVienMap, phongBanMap } = await fetchNhanVienPhongBanMaps([nvId]);
  return rowToRecord(inserted as Row, nhanVienMap, phongBanMap);
}

/** Xóa theo id */
export async function deleteBangLuong(ids: string[]): Promise<void> {
  const numIds = ids.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', numIds);
  if (error) throw new Error(error.message ?? i18n.t('bangLuong.service.error'));
}
