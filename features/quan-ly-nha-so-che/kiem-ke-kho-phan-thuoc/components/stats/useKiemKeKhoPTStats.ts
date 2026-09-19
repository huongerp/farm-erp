import { useMemo } from 'react';
import type { TrangThaiDotKiemKePT } from '../../core/types';

export interface KiemKeKhoPTStatsSummary {
  total: number;
  draft: number;
  dangKiemKe: number;
  hoanThanh: number;
}

export interface KiemKeKhoPTStatsByTrangThai {
  id: string;
  ten: string;
  count: number;
}

/** Chỉ cần trạng thái — nhận được cả bản đầy đủ lẫn bản tóm tắt. */
export function useKiemKeKhoPTStats(list: { trang_thai: TrangThaiDotKiemKePT }[]) {
  return useMemo(() => {
    const draft = list.filter((d) => d.trang_thai === 'draft').length;
    const dangKiemKe = list.filter((d) => d.trang_thai === 'dang_kiem_ke').length;
    const hoanThanh = list.filter((d) => d.trang_thai === 'hoan_thanh').length;
    const byTrangThai: KiemKeKhoPTStatsByTrangThai[] = [
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
      } as KiemKeKhoPTStatsSummary,
      byTrangThai,
    };
  }, [list]);
}
