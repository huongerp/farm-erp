import { useMemo } from 'react';
import type { DeXuatTuyenDung } from '../../core/types';

const STATUS_KEYS: Record<number, string> = {
  0: 'deXuatTuyenDung.status.nhap',
  1: 'deXuatTuyenDung.status.choDuyet',
  2: 'deXuatTuyenDung.status.daDuyet',
  3: 'deXuatTuyenDung.status.tuChoi',
};

export interface StatsByGroup {
  id: string;
  ten: string;
  count: number;
}

export interface StatsSummary {
  total: number;
  byStatus: Record<0 | 1 | 2 | 3, number>;
}

export function useDeXuatTuyenDungStats(
  list: DeXuatTuyenDung[],
  positionMap: Map<string, string>
) {
  return useMemo(() => {
    const byStatus: Record<0 | 1 | 2 | 3, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
    const byChucVu = new Map<string, { ten: string; count: number }>();

    list.forEach((item) => {
      byStatus[item.trang_thai as 0 | 1 | 2 | 3] += 1;
      const ten = item.ten_chuc_vu ?? positionMap.get(item.id_chuc_vu) ?? item.id_chuc_vu ?? '—';
      const cur = byChucVu.get(item.id_chuc_vu) || { ten, count: 0 };
      cur.count += 1;
      byChucVu.set(item.id_chuc_vu, cur);
    });

    const byChucVuList: StatsByGroup[] = Array.from(byChucVu.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.count - a.count);

    return {
      summary: {
        total: list.length,
        byStatus,
      } as StatsSummary,
      byStatusList: ([0, 1, 2, 3] as const).map((s) => ({
        id: String(s),
        ten: STATUS_KEYS[s],
        count: byStatus[s],
      })),
      byChucVu: byChucVuList,
      chartByStatus: ([0, 1, 2, 3] as const).map((s) => ({
        nameKey: STATUS_KEYS[s],
        value: byStatus[s],
      })),
      chartByChucVu: byChucVuList.map((x) => ({ name: x.ten, value: x.count })),
    };
  }, [list, positionMap]);
}
