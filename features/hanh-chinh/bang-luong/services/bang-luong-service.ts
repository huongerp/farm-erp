import type { BangLuongRecord, CongTruLuongItem, LuongNhanVienConfig } from '../core/types';
import type { ChamDiemKpiRecord } from '../../cham-diem-kpi/core/types';
import type { EmployeeAttendanceRow } from '../../cham-cong/core/types';
import { NGAY_CONG_CHUAN_THANG, TY_LE_LUONG_KPI_KHONG_DAT } from '../core/constants';
import { NGUONG_DAT_KPI } from '../../cham-diem-kpi/core/constants';
import { getEmployeeAttendance } from '../../cham-cong/services/attendance-service';
import { getChamDiemKpiRecords } from '../../cham-diem-kpi/services/cham-diem-kpi-service';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import type { Employee } from '@/features/he-thong/nhan-vien/core/types';
import { MOCK_LUONG_NHAN_VIEN, MOCK_BANG_LUONG_CONG_TRU } from '@/mocks/hanh-chinh';
import { supabase } from '../../../../lib/supabase';
import i18n from '../../../../lib/i18n';

const TABLE = 'fp_hr_bang_luong';
const TABLE_NHAN_VIEN = 'fp_var_nhan_vien';
const TABLE_PHONG_BAN = 'fp_var_phong_ban';

type Row = Record<string, unknown>;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  const { data: nvRows } = await supabase
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
    const { data: pbRows } = await supabase.from(TABLE_PHONG_BAN).select('id, ten_phong_ban').in('id', pbUniq);
    (pbRows ?? []).forEach((r: Row) => {
      phongBanMap[Number(r.id)] = (r.ten_phong_ban as string) ?? '';
    });
  }
  return { nhanVienMap, phongBanMap };
}

/** Các kỳ (nam-thang) cần tính bảng lương (có dữ liệu chấm công / KPI) */
const PAYROLL_PERIODS = ['2024-12', '2025-01', '2025-02'] as const;

/** In-memory store: seed từ tính toán lần đầu, sau đó dùng save/delete */
let dbBangLuong: BangLuongRecord[] = [];
let dbSeeded = false;

function buildKpiMap(records: ChamDiemKpiRecord[]): Map<string, ChamDiemKpiRecord> {
  const map = new Map<string, ChamDiemKpiRecord>();
  for (const r of records) {
    map.set(`${r.id_nhan_vien}-${r.nam}-${r.thang}`, r);
  }
  return map;
}

function getSalaryConfig(id_nhan_vien: string): LuongNhanVienConfig | null {
  return MOCK_LUONG_NHAN_VIEN.find((c) => c.id_nhan_vien === id_nhan_vien) ?? null;
}

function getCongTruForPeriod(
  id_nhan_vien: string,
  nam: number,
  thang: number
): CongTruLuongItem[] {
  return MOCK_BANG_LUONG_CONG_TRU.filter(
    (r) => r.id_nhan_vien === id_nhan_vien && r.nam === nam && r.thang === thang
  ).map((r) => ({
    id: r.id,
    loai: r.loai,
    so_tien: r.so_tien,
    ly_do: r.ly_do,
  }));
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

  dbBangLuong = results.sort((a, b) => {
    const keyA = `${a.nam}-${String(a.thang).padStart(2, '0')}-${a.id_nhan_vien}`;
    const keyB = `${b.nam}-${String(b.thang).padStart(2, '0')}-${b.id_nhan_vien}`;
    return keyB.localeCompare(keyA);
  });
  dbSeeded = true;
}

export async function getBangLuongRecords(): Promise<BangLuongRecord[]> {
  const { data: rows, error } = await supabase
    .from(TABLE)
    .select('*')
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
  const { data: row, error } = await supabase.from(TABLE).select('*').eq('id', idNum).maybeSingle();
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
  const { data: row, error } = await supabase
    .from(TABLE)
    .select('*')
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
  const { data: inserted, error } = await supabase.from(TABLE).insert(row).select('*').single();
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
  const { data: updated, error } = await supabase
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
    .select('*')
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
  const { data: inserted, error } = await supabase.from(TABLE).insert(row).select('*').single();
  if (error) throw new Error(error.message ?? i18n.t('bangLuong.service.error'));
  const { nhanVienMap, phongBanMap } = await fetchNhanVienPhongBanMaps([nvId]);
  return rowToRecord(inserted as Row, nhanVienMap, phongBanMap);
}

/** Xóa theo id */
export async function deleteBangLuong(ids: string[]): Promise<void> {
  const numIds = ids.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE).delete().in('id', numIds);
  if (error) throw new Error(error.message ?? i18n.t('bangLuong.service.error'));
}
