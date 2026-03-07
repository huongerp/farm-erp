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
    const draft = list.filter((d) => d.trang_thai === 'draft').length;
    const dangKiemKe = list.filter((d) => d.trang_thai === 'dang_kiem_ke').length;
    const hoanThanh = list.filter((d) => d.trang_thai === 'hoan_thanh').length;
    const byTrangThai: KiemKeStatsByTrangThai[] = [
      { id: 'draft', ten: 'trangThaiDot.draft', count: draft },
      { id: 'dang_kiem_ke', ten: 'trangThaiDot.dang_kiem_ke', count: dangKiemKe },
      { id: 'hoan_thanh', ten: 'trangThaiDot.hoan_thanh', count: hoanThanh },
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
