import { useMemo } from 'react';
import type { DotKiemKe } from '../../core/types';

export interface KiemKeStatsSummary {
  total: number;
  draft: number;
  dangKiemKe: number;
  hoanThanh: number;
}

export interface KiemKeStatsByTrangThai {
  id: string;
  ten: string;
  count: number;
}

export function useKiemKeStats(list: DotKiemKe[]) {
  return useMemo(() => {
    const draft = list.filter((d) => d.trang_thai === 'Nháp').length;
    const dangKiemKe = list.filter((d) => d.trang_thai === 'Đang kiểm kê').length;
    const hoanThanh = list.filter((d) => d.trang_thai === 'Hoàn thành').length;
    const byTrangThai: KiemKeStatsByTrangThai[] = [
      { id: 'Nháp', ten: 'Nháp', count: draft },
      { id: 'Đang kiểm kê', ten: 'Đang kiểm kê', count: dangKiemKe },
      { id: 'Hoàn thành', ten: 'Hoàn thành', count: hoanThanh },
    ];
    return {
      summary: {
        total: list.length,
        draft,
        dangKiemKe,
        hoanThanh,
      } as KiemKeStatsSummary,
      byTrangThai,
    };
  }, [list]);
}
