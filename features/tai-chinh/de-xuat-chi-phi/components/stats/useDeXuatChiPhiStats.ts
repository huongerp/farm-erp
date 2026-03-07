import { useMemo } from 'react';
import type { DeXuatChiPhi } from '../../core/types';

function getTongTien(item: DeXuatChiPhi): number {
  if (!item.chi_tiet?.length) return 0;
  return item.chi_tiet.reduce((s, d) => s + (d.so_tien ?? 0), 0);
}

export interface DeXuatChiPhiStatsSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  thuCount: number;
  chiCount: number;
  tongTienThu: number;
  tongTienChi: number;
}

export interface DeXuatChiPhiStatsByTrangThai {
  id: string;
  ten: string;
  count: number;
}

export interface DeXuatChiPhiStatsByLoai {
  id: string;
  ten: string;
  count: number;
  tongTien: number;
}

export interface StatsChartItem {
  name: string;
  value: number;
}

export function useDeXuatChiPhiStats(list: DeXuatChiPhi[]) {
  return useMemo(() => {
    const pending = list.filter((d) => d.trang_thai === 0).length;
    const approved = list.filter((d) => d.trang_thai === 1).length;
    const rejected = list.filter((d) => d.trang_thai === 2).length;
    const thuCount = list.filter((d) => d.loai === 'thu').length;
    const chiCount = list.filter((d) => d.loai === 'chi').length;
    let tongTienThu = 0;
    let tongTienChi = 0;
    list.forEach((d) => {
      const t = getTongTien(d);
      if (d.loai === 'thu') tongTienThu += t;
      else tongTienChi += t;
    });

    const byTrangThai: DeXuatChiPhiStatsByTrangThai[] = [
      { id: '0', ten: 'status.pending', count: pending },
      { id: '1', ten: 'status.approved', count: approved },
      { id: '2', ten: 'status.rejected', count: rejected },
    ];

    const byLoai: DeXuatChiPhiStatsByLoai[] = [
      { id: 'thu', ten: 'loai.thu', count: thuCount, tongTien: tongTienThu },
      { id: 'chi', ten: 'loai.chi', count: chiCount, tongTien: tongTienChi },
    ];

    const byMonthMap = new Map<string, { count: number; thu: number; chi: number }>();
    list.forEach((d) => {
      if (!d.ngay) return;
      const monthKey = d.ngay.slice(0, 7);
      const cur = byMonthMap.get(monthKey) ?? { count: 0, thu: 0, chi: 0 };
      cur.count += 1;
      const t = getTongTien(d);
      if (d.loai === 'thu') cur.thu += t;
      else cur.chi += t;
      byMonthMap.set(monthKey, cur);
    });
    const byMonth: StatsChartItem[] = Array.from(byMonthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, v]) => {
        const [y, m] = monthKey.split('-');
        return { name: `${m}/${y}`, value: v.count };
      });

    const byNguoiDeXuatMap = new Map<string, number>();
    list.forEach((d) => {
      const name = d.ten_nguoi_de_xuat || d.id_nguoi_de_xuat || '—';
      byNguoiDeXuatMap.set(name, (byNguoiDeXuatMap.get(name) ?? 0) + 1);
    });
    const byNguoiDeXuat: StatsChartItem[] = Array.from(byNguoiDeXuatMap.entries())
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value);

    return {
      summary: {
        total: list.length,
        pending,
        approved,
        rejected,
        thuCount,
        chiCount,
        tongTienThu,
        tongTienChi,
      } as DeXuatChiPhiStatsSummary,
      byTrangThai,
      byLoai,
      byMonth,
      byNguoiDeXuat,
    };
  }, [list]);
}
