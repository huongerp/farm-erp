import { useMemo } from 'react';
import type { DangKyThamGia } from '@/features/nhan-su/dang-ky-dao-tao/core/types';

export interface ChartItem {
  name: string;
  value: number;
}

export interface BaoCaoDaoTaoSummary {
  tongDangKy: number;
  dangHoc: number;
  hoanThanh: number;
  huy: number;
  /** Tỷ lệ hoàn thành (số đăng ký đã hoàn thành / tổng không hủy) */
  tyLeHoanThanh: number;
}

export interface ByKhoaRow {
  id_khoa_hoc: string;
  ma_khoa_hoc: string;
  ten_khoa_hoc: string;
  so_dang_ky: number;
  so_hoan_thanh: number;
  so_dang_hoc: number;
  ty_le_hoan_thanh: number;
}

export interface BaoCaoDaoTaoStatsResult {
  summary: BaoCaoDaoTaoSummary;
  byKhoa: ByKhoaRow[];
  chartSummary: ChartItem[];
  chartByKhoa: ChartItem[];
}

export function useBaoCaoDaoTaoStats(list: DangKyThamGia[]): BaoCaoDaoTaoStatsResult {
  return useMemo(() => {
    const notHuy = list.filter((d) => d.trang_thai !== 4);
    const hoanThanh = list.filter((d) => d.trang_thai === 3);
    const dangHoc = list.filter((d) => d.trang_thai === 1 || d.trang_thai === 2);
    const huy = list.filter((d) => d.trang_thai === 4);
    const tyLeHoanThanh = notHuy.length > 0 ? (hoanThanh.length / notHuy.length) * 100 : 0;

    const summary: BaoCaoDaoTaoSummary = {
      tongDangKy: list.length,
      dangHoc: dangHoc.length,
      hoanThanh: hoanThanh.length,
      huy: huy.length,
      tyLeHoanThanh,
    };

    const byKhoaMap = new Map<
      string,
      { ma: string; ten: string; dangKy: number; hoanThanh: number; dangHoc: number }
    >();
    for (const d of list) {
      const key = d.id_khoa_hoc;
      const cur = byKhoaMap.get(key);
      const ma = d.ma_khoa_hoc ?? key;
      const ten = d.ten_khoa_hoc ?? key;
      if (!cur) {
        byKhoaMap.set(key, {
          ma,
          ten,
          dangKy: 0,
          hoanThanh: 0,
          dangHoc: 0,
        });
      }
      const row = byKhoaMap.get(key)!;
      row.dangKy += 1;
      if (d.trang_thai === 3) row.hoanThanh += 1;
      if (d.trang_thai === 1 || d.trang_thai === 2) row.dangHoc += 1;
    }

    const byKhoa: ByKhoaRow[] = Array.from(byKhoaMap.entries()).map(([id_khoa_hoc, row]) => ({
      id_khoa_hoc,
      ma_khoa_hoc: row.ma,
      ten_khoa_hoc: row.ten,
      so_dang_ky: row.dangKy,
      so_hoan_thanh: row.hoanThanh,
      so_dang_hoc: row.dangHoc,
      ty_le_hoan_thanh: row.dangKy > 0 ? (row.hoanThanh / row.dangKy) * 100 : 0,
    }));

    const chartSummary: ChartItem[] = [
      { name: 'TongDangKy', value: summary.tongDangKy },
      { name: 'DangHoc', value: summary.dangHoc },
      { name: 'HoanThanh', value: summary.hoanThanh },
      { name: 'Huy', value: summary.huy },
    ];

    const chartByKhoa: ChartItem[] = byKhoa.map((r) => ({
      name: r.ten_khoa_hoc || r.ma_khoa_hoc,
      value: r.so_dang_ky,
    }));

    return { summary, byKhoa, chartSummary, chartByKhoa };
  }, [list]);
}
