import { useMemo } from 'react';
import type { ChamDiemKpiRecord } from '../core/types';
import { DEPT_COLORS } from '../core/stats-constants';

export interface ByPeriodRow {
  period: string;
  total: number;
  dat: number;
  khongDat: number;
  sumScore: number;
  avg: number;
}

export interface ByDepartmentRow {
  dept: string;
  deptId: string | undefined;
  total: number;
  dat: number;
  khongDat: number;
  sumScore: number;
  avg: number;
}

export interface Summary {
  total: number;
  dat: number;
  khongDat: number;
  avgScore: number;
}

export interface PeriodChartItem {
  period: string;
  total: number;
  dat: number;
  khongDat: number;
  avg: number;
}

export interface DeptChartItem {
  name: string;
  value: number;
  fill?: string;
}

export interface UseChamDiemKpiStatsParams {
  records: ChamDiemKpiRecord[];
  /** Empty = all periods; else filter by these 'YYYY-MM' */
  filterYearMonths: string[];
  filterDeptIds: string[];
}

export function useChamDiemKpiStats({
  records,
  filterYearMonths,
  filterDeptIds,
}: UseChamDiemKpiStatsParams) {
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
    const map = new Map<string, { total: number; dat: number; khongDat: number; sumScore: number }>();
    for (const r of filtered) {
      const key = `${r.nam}-${String(r.thang).padStart(2, '0')}`;
      const cur = map.get(key) ?? { total: 0, dat: 0, khongDat: 0, sumScore: 0 };
      cur.total += 1;
      if (r.danh_gia === 'dat') cur.dat += 1;
      else cur.khongDat += 1;
      cur.sumScore += r.tong_kpi;
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .map(([period, v]) => ({
        period,
        ...v,
        avg: v.total ? v.sumScore / v.total : 0,
      }))
      .sort((a, b) => b.period.localeCompare(a.period));
  }, [filtered]);

  const byDepartment = useMemo((): ByDepartmentRow[] => {
    const map = new Map<
      string,
      { deptId?: string; total: number; dat: number; khongDat: number; sumScore: number }
    >();
    for (const r of filtered) {
      const key = r.ten_phong_ban ?? r.id_phong_ban ?? '—';
      const cur = map.get(key) ?? {
        deptId: r.id_phong_ban,
        total: 0,
        dat: 0,
        khongDat: 0,
        sumScore: 0,
      };
      cur.total += 1;
      if (r.danh_gia === 'dat') cur.dat += 1;
      else cur.khongDat += 1;
      cur.sumScore += r.tong_kpi;
      if (r.id_phong_ban) cur.deptId = r.id_phong_ban;
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .map(([dept, v]) => ({
        dept,
        deptId: v.deptId,
        ...v,
        avg: v.total ? v.sumScore / v.total : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const summary = useMemo((): Summary => {
    const total = filtered.length;
    const dat = filtered.filter((r) => r.danh_gia === 'dat').length;
    const khongDat = filtered.filter((r) => r.danh_gia === 'khong_dat').length;
    const avgScore =
      total > 0 ? filtered.reduce((s, r) => s + r.tong_kpi, 0) / total : 0;
    return { total, dat, khongDat, avgScore };
  }, [filtered]);

  const periodChartData = useMemo((): PeriodChartItem[] => {
    return byPeriod.map((row) => ({
      period: row.period,
      total: row.total,
      dat: row.dat,
      khongDat: row.khongDat,
      avg: row.avg,
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
