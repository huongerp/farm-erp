import type { FarmThuHoach, ThuHoachDaySuffix } from './types';
import { THU_HOACH_DAY_SUFFIXES } from './types';

/** Nhãn cột bảng: T2…T7, CN */
export function thuHoachDayColumnLabel(s: ThuHoachDaySuffix): string {
  if (s === 'cn') return 'CN';
  return `T${s.slice(1)}`;
}

export function sumKeHoachWeek(row: Pick<FarmThuHoach, `ke_hoach_${(typeof THU_HOACH_DAY_SUFFIXES)[number]}`>): number {
  let s = 0;
  for (const d of THU_HOACH_DAY_SUFFIXES) {
    s += Number(row[`ke_hoach_${d}`] ?? 0);
  }
  return s;
}

export function sumThucTeWeek(row: Pick<FarmThuHoach, `thuc_te_${(typeof THU_HOACH_DAY_SUFFIXES)[number]}`>): number {
  let s = 0;
  for (const d of THU_HOACH_DAY_SUFFIXES) {
    s += Number(row[`thuc_te_${d}`] ?? 0);
  }
  return s;
}

export function sumChenhLechWeek(row: FarmThuHoach): number {
  return sumThucTeWeek(row) - sumKeHoachWeek(row);
}

export function parseIdToInt8(id: string | null | undefined): number | null {
  if (id == null || id === '') return null;
  const n = Number(id);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
