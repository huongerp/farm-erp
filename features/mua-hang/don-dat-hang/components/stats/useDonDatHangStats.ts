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

/** Logic thuần (dùng cho Thống kê RPC + fallback client). */
export function computeDonDatHangStats(list: DonDatHang[]) {
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
}

export function useDonDatHangStats(list: DonDatHang[]) {
  return useMemo(() => computeDonDatHangStats(list), [list]);
}

export interface ChiTietCategoryRow {
  id_hang_hoa: string;
  phan_loai: string | null;
  ten_danh_muc_cap1?: string;
  ten_danh_muc_cap2?: string;
}

/** Tính thống kê theo danh mục cấp 1, cấp 2 và phân loại từ dữ liệu chi tiết. */
export function computeDonDatHangCategoryStats(rows: ChiTietCategoryRow[]) {
  const cap1Map = new Map<string, number>();
  const cap2Map = new Map<string, number>();
  const phanLoaiMap = new Map<string, number>();

  rows.forEach((r) => {
    const cap1 = r.ten_danh_muc_cap1?.trim() || '—';
    cap1Map.set(cap1, (cap1Map.get(cap1) ?? 0) + 1);

    const cap2 = r.ten_danh_muc_cap2?.trim() || '—';
    cap2Map.set(cap2, (cap2Map.get(cap2) ?? 0) + 1);

    const pl = r.phan_loai?.trim() || '—';
    phanLoaiMap.set(pl, (phanLoaiMap.get(pl) ?? 0) + 1);
  });

  const toSorted = (m: Map<string, number>): StatsChartItem[] =>
    Array.from(m.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

  return {
    byDanhMucCap1: toSorted(cap1Map),
    byDanhMucCap2: toSorted(cap2Map),
    byPhanLoai: toSorted(phanLoaiMap),
  };
}
