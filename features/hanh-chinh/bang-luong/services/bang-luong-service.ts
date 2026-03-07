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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  await seedDb();
  return [...dbBangLuong];
}

export async function getBangLuongById(id: string): Promise<BangLuongRecord | null> {
  await seedDb();
  return dbBangLuong.find((r) => r.id === id) ?? null;
}

export async function getBangLuongByNhanVienPeriod(
  id_nhan_vien: string,
  nam: number,
  thang: number
): Promise<BangLuongRecord | null> {
  await seedDb();
  return (
    dbBangLuong.find(
      (r) => r.id_nhan_vien === id_nhan_vien && r.nam === nam && r.thang === thang
    ) ?? null
  );
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

/** Thêm bản ghi (tính từ chấm công + KPI). Trùng id thì không thêm. */
export async function addBangLuong(
  id_nhan_vien: string,
  nam: number,
  thang: number
): Promise<BangLuongRecord> {
  await seedDb();
  const existing = dbBangLuong.find(
    (r) => r.id_nhan_vien === id_nhan_vien && r.nam === nam && r.thang === thang
  );
  if (existing) return existing;
  const record = await computeOneBangLuongRecord(id_nhan_vien, nam, thang);
  if (!record) throw new Error('bangLuong.service.noAttendance');
  dbBangLuong = [record, ...dbBangLuong].sort((a, b) => {
    const keyA = `${a.nam}-${String(a.thang).padStart(2, '0')}-${a.id_nhan_vien}`;
    const keyB = `${b.nam}-${String(b.thang).padStart(2, '0')}-${b.id_nhan_vien}`;
    return keyB.localeCompare(keyA);
  });
  return record;
}

/** Cập nhật bản ghi (chủ yếu cộng trừ lương khác), tính lại tổng. */
export async function saveBangLuong(record: BangLuongRecord): Promise<BangLuongRecord> {
  await delay(300);
  await seedDb();
  const idx = dbBangLuong.findIndex((r) => r.id === record.id);
  const cong_tru_net = computeCongTruNet(record.cong_tru_khac);
  const tong_luong =
    record.luong_co_ban_tinh +
    record.luong_kpi_tinh +
    record.luong_trach_nhiem_tinh +
    record.phu_cap_tinh +
    cong_tru_net;
  const updated: BangLuongRecord = {
    ...record,
    cong_tru_net,
    tong_luong,
    tg_cap_nhat: new Date().toISOString(),
  };
  if (idx >= 0) {
    dbBangLuong[idx] = updated;
    return updated;
  }
  dbBangLuong = [updated, ...dbBangLuong].sort((a, b) => {
    const keyA = `${a.nam}-${String(a.thang).padStart(2, '0')}-${a.id_nhan_vien}`;
    const keyB = `${b.nam}-${String(b.thang).padStart(2, '0')}-${b.id_nhan_vien}`;
    return keyB.localeCompare(keyA);
  });
  return updated;
}

/** Xóa theo id */
export async function deleteBangLuong(ids: string[]): Promise<void> {
  await delay(300);
  const set = new Set(ids);
  dbBangLuong = dbBangLuong.filter((r) => !set.has(r.id));
}
