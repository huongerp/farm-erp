import { useMemo } from 'react';
import type { ThanhToanDoiTac } from '../../core/types';
import { MA_TRANG_THAI_CHO_THANH_TOAN, MA_TRANG_THAI_DA_THANH_TOAN, MA_TRANG_THAI_DA_HUY } from '../../core/constants';

export interface ThanhToanDoiTacStatsSummary {
  total: number;
  totalAmount: number;
  pending: number;
  paid: number;
  cancelled: number;
  other: number;
}

export interface ThanhToanDoiTacStatsByTrangThai {
  id: string;
  ten: string;
  count: number;
  amount: number;
}

export interface StatsChartItem {
  name: string;
  value: number;
}

export interface StatsChartItemAmount {
  name: string;
  value: number;
  amount: number;
}

export function useThanhToanDoiTacStats(list: ThanhToanDoiTac[]) {
  return useMemo(() => {
    const pending = list.filter((d) => d.ma_trang_thai === MA_TRANG_THAI_CHO_THANH_TOAN).length;
    const paid = list.filter((d) => d.ma_trang_thai === MA_TRANG_THAI_DA_THANH_TOAN).length;
    const cancelled = list.filter((d) => d.ma_trang_thai === MA_TRANG_THAI_DA_HUY).length;
    const other = list.filter(
      (d) =>
        d.ma_trang_thai !== MA_TRANG_THAI_CHO_THANH_TOAN &&
        d.ma_trang_thai !== MA_TRANG_THAI_DA_THANH_TOAN &&
        d.ma_trang_thai !== MA_TRANG_THAI_DA_HUY
    ).length;
    const totalAmount = list.reduce((sum, d) => sum + (d.so_tien ?? 0), 0);

    const byTrangThaiMap = new Map<string, { ten: string; count: number; amount: number }>();
    list.forEach((d) => {
      const id = d.id_trang_thai_thanh_toan;
      const ten = d.ten_trang_thai ?? id ?? '—';
      const cur = byTrangThaiMap.get(id);
      const amount = d.so_tien ?? 0;
      if (cur) {
        cur.count += 1;
        cur.amount += amount;
      } else {
        byTrangThaiMap.set(id, { ten, count: 1, amount });
      }
    });
    const byTrangThai: ThanhToanDoiTacStatsByTrangThai[] = Array.from(byTrangThaiMap.entries()).map(([id, v]) => ({
      id,
      ten: v.ten,
      count: v.count,
      amount: v.amount,
    }));

    const byDoiTacMap = new Map<string, { name: string; count: number; amount: number }>();
    list.forEach((d) => {
      const name = d.ten_doi_tac || d.id_doi_tac || '—';
      const cur = byDoiTacMap.get(d.id_doi_tac);
      const amount = d.so_tien ?? 0;
      if (cur) {
        cur.count += 1;
        cur.amount += amount;
      } else {
        byDoiTacMap.set(d.id_doi_tac, { name, count: 1, amount });
      }
    });
    const byDoiTac: StatsChartItemAmount[] = Array.from(byDoiTacMap.values())
      .map(({ name, count, amount }) => ({ name, value: count, amount }))
      .sort((a, b) => b.value - a.value);

    const byDonViMap = new Map<string, { name: string; count: number; amount: number }>();
    list.forEach((d) => {
      const key = d.id_don_vi ?? '__null__';
      const name = d.ten_don_vi || (d.id_don_vi ? d.id_don_vi : '—');
      const cur = byDonViMap.get(key);
      const amount = d.so_tien ?? 0;
      if (cur) {
        cur.count += 1;
        cur.amount += amount;
      } else {
        byDonViMap.set(key, { name, count: 1, amount });
      }
    });
    const byDonVi: StatsChartItemAmount[] = Array.from(byDonViMap.values())
      .map(({ name, count, amount }) => ({ name, value: count, amount }))
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
        return { name: `${m}/${y}`, value: count };
      });

    const byMonthAmountMap = new Map<string, number>();
    list.forEach((d) => {
      if (!d.ngay) return;
      const monthKey = d.ngay.slice(0, 7);
      const amt = d.so_tien ?? 0;
      byMonthAmountMap.set(monthKey, (byMonthAmountMap.get(monthKey) ?? 0) + amt);
    });
    const byMonthAmount: StatsChartItem[] = Array.from(byMonthAmountMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, amount]) => {
        const [y, m] = monthKey.split('-');
        return { name: `${m}/${y}`, value: amount };
      });

    return {
      summary: {
        total: list.length,
        totalAmount,
        pending,
        paid,
        cancelled,
        other,
      } as ThanhToanDoiTacStatsSummary,
      byTrangThai,
      byDoiTac,
      byDonVi,
      byMonth,
      byMonthAmount,
    };
  }, [list]);
}
