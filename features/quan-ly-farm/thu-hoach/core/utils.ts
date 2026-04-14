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

/** Chuẩn hóa giá trị `thu_du_kien` từ DB (jsonb / text[] / chuỗi). */
export function parseThuDuKienFromDb(raw: unknown): ThuHoachDaySuffix[] {
  if (raw == null || raw === '') return [];
  let arr: unknown[] = [];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (typeof raw === 'string') {
    const s = raw.trim();
    if (s.startsWith('[')) {
      try {
        const p = JSON.parse(s) as unknown;
        arr = Array.isArray(p) ? p : [];
      } catch {
        arr = [];
      }
    } else {
      arr = s.split(/[,;\s]+/).filter(Boolean);
    }
  }
  const set = new Set<string>();
  for (const x of arr) {
    set.add(String(x).trim().toLowerCase());
  }
  return THU_HOACH_DAY_SUFFIXES.filter((d) => set.has(d));
}

/** Nhãn ngắn cột bảng (T2…CN) cho mảng thứ dự kiến. */
export function formatThuDuKienShort(days: readonly ThuHoachDaySuffix[]): string {
  if (days.length === 0) return '—';
  return days.map((d) => thuHoachDayColumnLabel(d)).join(', ');
}

export function parseIdToInt8(id: string | null | undefined): number | null {
  if (id == null || id === '') return null;
  const n = Number(id);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
