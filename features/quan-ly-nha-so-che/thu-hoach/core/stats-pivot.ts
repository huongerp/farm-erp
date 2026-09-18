import type { FarmThuHoach } from './types';
import type { ThuHoachDaySuffix } from './types';
import { THU_HOACH_DAY_SUFFIXES } from './types';

/** Gộp theo farm (chi nhánh): mỗi ô = tổng KH + TT theo thứ (có thể nhiều bản ghi sau lọc). */
export interface FarmDayAgg {
  keHoach: number;
  thucTe: number;
}

export interface FarmWeekdayTableResult {
  farmKeys: string[];
  farmLabels: Map<string, string>;
  matrix: Map<string, Map<ThuHoachDaySuffix, FarmDayAgg>>;
  rowTotals: Map<string, FarmDayAgg>;
  colTotals: Map<ThuHoachDaySuffix, FarmDayAgg>;
  grandTotal: FarmDayAgg;
}

export function aggregateFarmByWeekday(rows: FarmThuHoach[]): FarmWeekdayTableResult {
  const matrix = new Map<string, Map<ThuHoachDaySuffix, FarmDayAgg>>();
  const farmLabels = new Map<string, string>();

  for (const row of rows) {
    const fk =
      row.id_chi_nhanh != null && String(row.id_chi_nhanh) !== '' ? String(row.id_chi_nhanh) : '__none__';
    const label = row.ten_chi_nhanh?.trim() || (fk === '__none__' ? '—' : fk);
    if (!matrix.has(fk)) {
      matrix.set(fk, new Map());
      farmLabels.set(fk, label);
    } else if (row.ten_chi_nhanh?.trim()) {
      farmLabels.set(fk, row.ten_chi_nhanh.trim());
    }
    const line = matrix.get(fk)!;
    for (const d of THU_HOACH_DAY_SUFFIXES) {
      const kh = Number(row[`ke_hoach_${d}` as keyof FarmThuHoach] ?? 0);
      const tt = Number(row[`thuc_te_${d}` as keyof FarmThuHoach] ?? 0);
      const cur = line.get(d) ?? { keHoach: 0, thucTe: 0 };
      cur.keHoach += kh;
      cur.thucTe += tt;
      line.set(d, cur);
    }
  }

  const farmKeys = [...matrix.keys()].sort((a, b) =>
    (farmLabels.get(a) ?? a).localeCompare(farmLabels.get(b) ?? b, 'vi')
  );

  const rowTotals = new Map<string, FarmDayAgg>();
  const colTotals = new Map<ThuHoachDaySuffix, FarmDayAgg>();
  for (const d of THU_HOACH_DAY_SUFFIXES) {
    colTotals.set(d, { keHoach: 0, thucTe: 0 });
  }

  let grandKh = 0;
  let grandTt = 0;

  for (const fk of farmKeys) {
    const line = matrix.get(fk)!;
    let rk = 0;
    let rt = 0;
    for (const d of THU_HOACH_DAY_SUFFIXES) {
      const c = line.get(d) ?? { keHoach: 0, thucTe: 0 };
      rk += c.keHoach;
      rt += c.thucTe;
      const ct = colTotals.get(d)!;
      ct.keHoach += c.keHoach;
      ct.thucTe += c.thucTe;
    }
    rowTotals.set(fk, { keHoach: rk, thucTe: rt });
    grandKh += rk;
    grandTt += rt;
  }

  return {
    farmKeys,
    farmLabels,
    matrix,
    rowTotals,
    colTotals,
    grandTotal: { keHoach: grandKh, thucTe: grandTt },
  };
}
