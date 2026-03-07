import { useMemo } from 'react';
import type { TaiSan } from '../../core/types';

export interface StatsByGroup {
  id: string;
  ten: string;
  count: number;
}

export interface StatsSummary {
  total: number;
  activeCount: number;
  inactiveCount: number;
  totalNguyenGia: number;
}

export function useTaiSanStats(list: TaiSan[]) {
  return useMemo(() => {
    const byNhom = new Map<string, { ten: string; count: number }>();
    const byNoiLuu = new Map<string, { ten: string; count: number }>();
    const byTrangThai = new Map<string, { ten: string; count: number }>();
    let totalNguyenGia = 0;
    let activeCount = 0;

    list.forEach((item) => {
      if (item.ten_nhom) {
        const cur = byNhom.get(item.id_nhom) || { ten: item.ten_nhom, count: 0 };
        cur.count += 1;
        byNhom.set(item.id_nhom, cur);
      }
      if (item.ten_noi_luu) {
        const cur = byNoiLuu.get(item.id_noi_luu) || { ten: item.ten_noi_luu, count: 0 };
        cur.count += 1;
        byNoiLuu.set(item.id_noi_luu, cur);
      }
      if (item.ten_trang_thai) {
        const cur = byTrangThai.get(item.id_trang_thai) || { ten: item.ten_trang_thai, count: 0 };
        cur.count += 1;
        byTrangThai.set(item.id_trang_thai, cur);
      }
      if (item.nguyen_gia != null) totalNguyenGia += item.nguyen_gia;
      if (item.trang_thai === 1) activeCount += 1;
    });

    const byNhomList: StatsByGroup[] = Array.from(byNhom.entries()).map(([id, v]) => ({ id, ...v }));
    const byNoiLuuList: StatsByGroup[] = Array.from(byNoiLuu.entries()).map(([id, v]) => ({ id, ...v }));
    const byTrangThaiList: StatsByGroup[] = Array.from(byTrangThai.entries()).map(([id, v]) => ({ id, ...v }));

    return {
      summary: {
        total: list.length,
        activeCount,
        inactiveCount: list.length - activeCount,
        totalNguyenGia,
      } as StatsSummary,
      byNhom: byNhomList,
      byNoiLuu: byNoiLuuList,
      byTrangThai: byTrangThaiList,
      /** Cho Pie/Bar: { name, value } */
      chartByNhom: byNhomList.map((x) => ({ name: x.ten, value: x.count })),
      chartByNoiLuu: byNoiLuuList.map((x) => ({ name: x.ten, value: x.count })),
      chartByTrangThai: byTrangThaiList.map((x) => ({ name: x.ten, value: x.count })),
    };
  }, [list]);
}
