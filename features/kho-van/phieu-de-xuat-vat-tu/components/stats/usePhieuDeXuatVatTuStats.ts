import { useMemo } from 'react';
import type { PhieuDeXuatVatTu } from '../../core/types';

export interface PhieuDeXuatVatTuStatsSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface PhieuDeXuatVatTuStatsByTrangThai {
  id: string;
  ten: string;
  count: number;
}

/** Dùng cho Bar/Pie chart: name + value */
export interface StatsChartItem {
  name: string;
  value: number;
}

export function usePhieuDeXuatVatTuStats(list: PhieuDeXuatVatTu[]) {
  return useMemo(() => {
    const pending = list.filter((d) => d.trang_thai === 0).length;
    const approved = list.filter((d) => d.trang_thai === 1).length;
    const rejected = list.filter((d) => d.trang_thai === 2).length;
    const byTrangThai: PhieuDeXuatVatTuStatsByTrangThai[] = [
      { id: '0', ten: 'status.pending', count: pending },
      { id: '1', ten: 'status.approved', count: approved },
      { id: '2', ten: 'status.rejected', count: rejected },
    ];

    const byNoiDeXuatMap = new Map<string, { name: string; count: number }>();
    list.forEach((d) => {
      const name = d.ten_noi_de_xuat || d.id_noi_de_xuat || '—';
      const cur = byNoiDeXuatMap.get(d.id_noi_de_xuat);
      if (cur) cur.count += 1;
      else byNoiDeXuatMap.set(d.id_noi_de_xuat, { name, count: 1 });
    });
    const byNoiDeXuat: StatsChartItem[] = Array.from(byNoiDeXuatMap.values())
      .map(({ name, count }) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value);

    const byNguoiDeXuatMap = new Map<string, { name: string; count: number }>();
    list.forEach((d) => {
      const name = d.ten_nguoi_de_xuat || d.id_nguoi_de_xuat || '—';
      const cur = byNguoiDeXuatMap.get(d.id_nguoi_de_xuat);
      if (cur) cur.count += 1;
      else byNguoiDeXuatMap.set(d.id_nguoi_de_xuat, { name, count: 1 });
    });
    const byNguoiDeXuat: StatsChartItem[] = Array.from(byNguoiDeXuatMap.values())
      .map(({ name, count }) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value);

    const byNguoiDuyetMap = new Map<string, { name: string; count: number }>();
    list.forEach((d) => {
      if (!d.id_nguoi_duyet) return;
      const name = d.ten_nguoi_duyet || d.id_nguoi_duyet || '—';
      const cur = byNguoiDuyetMap.get(d.id_nguoi_duyet);
      if (cur) cur.count += 1;
      else byNguoiDuyetMap.set(d.id_nguoi_duyet, { name, count: 1 });
    });
    const byNguoiDuyet: StatsChartItem[] = Array.from(byNguoiDuyetMap.values())
      .map(({ name, count }) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value);

    const byMonthMap = new Map<string, number>();
    list.forEach((d) => {
      if (!d.ngay) return;
      const monthKey = d.ngay.slice(0, 7);
      byMonthMap.set(monthKey, (byMonthMap.get(monthKey) ?? 0) + 1);
    });
    const byMonth: StatsChartItem[] = Array.from(byMonthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, count]) => {
        const [y, m] = monthKey.split('-');
        const name = `${m}/${y}`;
        return { name: name, value: count };
      });

    return {
      summary: {
        total: list.length,
        pending,
        approved,
        rejected,
      } as PhieuDeXuatVatTuStatsSummary,
      byTrangThai,
      byNoiDeXuat,
      byNguoiDeXuat,
      byNguoiDuyet,
      byMonth,
    };
  }, [list]);
}
