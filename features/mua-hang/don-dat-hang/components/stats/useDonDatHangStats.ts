import { useMemo } from 'react';
import type { DonDatHang } from '../../core/types';
import { TRANG_THAI_DON_DAT_HANG, TRANG_THAI_KEY } from '../../core/constants';
import { TRANG_THAI_NHAP, TRANG_THAI_HUY } from '../../core/types';

export interface DonDatHangStatsSummary {
  total: number;
  draft: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export interface DonDatHangStatsByTrangThai {
  id: string;
  ten: string;
  count: number;
}

export interface StatsChartItem {
  name: string;
  value: number;
}

export function useDonDatHangStats(list: DonDatHang[]) {
  return useMemo(() => {
    const draft = list.filter((d) => d.trang_thai === TRANG_THAI_NHAP).length;
    const inProgress = list.filter((d) =>
      ['Chờ duyệt', 'Đã gửi', 'Đã xác nhận', 'Đang giao'].includes(d.trang_thai)
    ).length;
    const completed = list.filter((d) =>
      ['Đã nhận đủ', 'Đã đóng'].includes(d.trang_thai)
    ).length;
    const cancelled = list.filter((d) => d.trang_thai === TRANG_THAI_HUY).length;

    const byTrangThai: DonDatHangStatsByTrangThai[] = TRANG_THAI_DON_DAT_HANG.map((s) => ({
      id: s,
      ten: `status.${TRANG_THAI_KEY[s]}`,
      count: list.filter((d) => d.trang_thai === s).length,
    }));

    const bySupplierMap = new Map<string, { name: string; count: number }>();
    list.forEach((d) => {
      const name = d.ten_nha_cung_cap || d.id_nha_cung_cap || '—';
      const cur = bySupplierMap.get(d.id_nha_cung_cap);
      if (cur) cur.count += 1;
      else bySupplierMap.set(d.id_nha_cung_cap, { name, count: 1 });
    });
    const bySupplier: StatsChartItem[] = Array.from(bySupplierMap.values())
      .map(({ name, count }) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value);

    const byBuyerMap = new Map<string, { name: string; count: number }>();
    list.forEach((d) => {
      const name = d.ten_nguoi_dat || d.id_nguoi_dat || '—';
      const cur = byBuyerMap.get(d.id_nguoi_dat);
      if (cur) cur.count += 1;
      else byBuyerMap.set(d.id_nguoi_dat, { name, count: 1 });
    });
    const byBuyer: StatsChartItem[] = Array.from(byBuyerMap.values())
      .map(({ name, count }) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value);

    const byMonthMap = new Map<string, number>();
    list.forEach((d) => {
      if (!d.ngay_dat) return;
      const monthKey = d.ngay_dat.slice(0, 7);
      byMonthMap.set(monthKey, (byMonthMap.get(monthKey) ?? 0) + 1);
    });
    const byMonth: StatsChartItem[] = Array.from(byMonthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, count]) => {
        const [y, m] = monthKey.split('-');
        return { name: `${m}/${y}`, value: count };
      });

    return {
      summary: {
        total: list.length,
        draft,
        inProgress,
        completed,
        cancelled,
      } as DonDatHangStatsSummary,
      byTrangThai,
      bySupplier,
      byBuyer,
      byMonth,
    };
  }, [list]);
}
