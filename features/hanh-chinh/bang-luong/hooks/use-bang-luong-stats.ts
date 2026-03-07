import { useMemo } from 'react';
import type { BangLuongRecord } from '../core/types';
import { DEPT_COLORS } from '../core/stats-constants';

export interface ByPeriodRow {
  period: string;
  total: number;
  sumTongLuong: number;
  avgTongLuong: number;
}

export interface ByDepartmentRow {
  dept: string;
  deptId: string | undefined;
  total: number;
  sumTongLuong: number;
  avgTongLuong: number;
}

export interface Summary {
  total: number;
  sumTongLuong: number;
  avgTongLuong: number;
}

export interface PeriodChartItem {
  period: string;
  total: number;
  sumTongLuong: number;
}

export interface DeptChartItem {
  name: string;
  value: number;
  fill?: string;
}

export interface UseBangLuongStatsParams {
  records: BangLuongRecord[];
  filterYearMonths: string[];
  filterDeptIds: string[];
}

export function useBangLuongStats({
  records,
  filterYearMonths,
  filterDeptIds,
}: UseBangLuongStatsParams) {
  const periodSet = useMemo(
    () => (filterYearMonths.length > 0 ? new Set(filterYearMonths) : null),
    [filterYearMonths]
  );

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const periodKey = `${r.nam}-${String(r.thang).padStart(2, '0')}`;
      const matchPeriod = periodSet === null || periodSet.has(periodKey);
      const matchDept =
        filterDeptIds.length === 0 ||
        (r.id_phong_ban != null && filterDeptIds.includes(r.id_phong_ban));
      return matchPeriod && matchDept;
    });
  }, [records, periodSet, filterDeptIds]);

  const byPeriod = useMemo((): ByPeriodRow[] => {
    const map = new Map<string, { total: number; sumTongLuong: number }>();
    for (const r of filtered) {
      const key = `${r.nam}-${String(r.thang).padStart(2, '0')}`;
      const cur = map.get(key) ?? { total: 0, sumTongLuong: 0 };
      cur.total += 1;
      cur.sumTongLuong += r.tong_luong;
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .map(([period, v]) => ({
        period,
        ...v,
        avgTongLuong: v.total ? Math.round(v.sumTongLuong / v.total) : 0,
      }))
      .sort((a, b) => b.period.localeCompare(a.period));
  }, [filtered]);

  const byDepartment = useMemo((): ByDepartmentRow[] => {
    const map = new Map<
      string,
      { deptId?: string; total: number; sumTongLuong: number }
    >();
    for (const r of filtered) {
      const key = r.ten_phong_ban ?? r.id_phong_ban ?? '—';
      const cur = map.get(key) ?? {
        deptId: r.id_phong_ban,
        total: 0,
        sumTongLuong: 0,
      };
      cur.total += 1;
      cur.sumTongLuong += r.tong_luong;
      if (r.id_phong_ban) cur.deptId = r.id_phong_ban;
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .map(([dept, v]) => ({
        dept,
        deptId: v.deptId,
        ...v,
        avgTongLuong: v.total ? Math.round(v.sumTongLuong / v.total) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const summary = useMemo((): Summary => {
    const total = filtered.length;
    const sumTongLuong = filtered.reduce((s, r) => s + r.tong_luong, 0);
    return {
      total,
      sumTongLuong,
      avgTongLuong: total > 0 ? Math.round(sumTongLuong / total) : 0,
    };
  }, [filtered]);

  const periodChartData = useMemo((): PeriodChartItem[] => {
    return byPeriod.map((row) => ({
      period: row.period,
      total: row.total,
      sumTongLuong: row.sumTongLuong,
    }));
  }, [byPeriod]);

  const deptChartData = useMemo((): DeptChartItem[] => {
    return byDepartment.map((row, i) => ({
      name: row.dept,
      value: row.total,
      fill: DEPT_COLORS[i % DEPT_COLORS.length],
    }));
  }, [byDepartment]);

  return {
    filtered,
    byPeriod,
    byDepartment,
    summary,
    periodChartData,
    deptChartData,
    DEPT_COLORS,
  };
}
