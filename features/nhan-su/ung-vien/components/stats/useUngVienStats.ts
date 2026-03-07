import { useMemo } from 'react';
import type { UngVien } from '../../core/types';

export interface StatsByGroup {
  id: string;
  ten: string;
  count: number;
}

export interface StatsSummary {
  total: number;
}

export function useUngVienStats(list: UngVien[]) {
  return useMemo(() => {
    const byStatus = new Map<string, { ten: string; count: number }>();
    const byViTri = new Map<string, { ten: string; count: number }>();
    const byNguon = new Map<string, { ten: string; count: number }>();

    list.forEach((item) => {
      const statusTen = item.ten_trang_thai ?? item.id_trang_thai_ung_vien;
      const curStatus = byStatus.get(item.id_trang_thai_ung_vien) || { ten: statusTen, count: 0 };
      curStatus.count += 1;
      byStatus.set(item.id_trang_thai_ung_vien, curStatus);

      const viTriTen = item.ma_de_xuat ? (item.ten_chuc_vu ? `${item.ma_de_xuat} · ${item.ten_chuc_vu}` : item.ma_de_xuat) : item.id_de_xuat_tuyen_dung;
      const curViTri = byViTri.get(item.id_de_xuat_tuyen_dung) || { ten: viTriTen, count: 0 };
      curViTri.count += 1;
      byViTri.set(item.id_de_xuat_tuyen_dung, curViTri);

      if (item.id_kenh_tuyen_dung) {
        const nguonTen = item.ten_kenh_tuyen_dung ?? item.id_kenh_tuyen_dung;
        const curNguon = byNguon.get(item.id_kenh_tuyen_dung) || { ten: nguonTen, count: 0 };
        curNguon.count += 1;
        byNguon.set(item.id_kenh_tuyen_dung, curNguon);
      }
    });

    const byStatusList: StatsByGroup[] = Array.from(byStatus.entries()).map(([id, v]) => ({ id, ...v }));
    const byViTriList: StatsByGroup[] = Array.from(byViTri.entries()).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.count - a.count);
    const byNguonList: StatsByGroup[] = Array.from(byNguon.entries()).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.count - a.count);

    return {
      summary: { total: list.length } as StatsSummary,
      byStatusList,
      byViTriList,
      byNguonList,
      chartByStatus: byStatusList.map((x) => ({ name: x.ten, value: x.count })),
      chartByViTri: byViTriList.map((x) => ({ name: x.ten, value: x.count })),
      chartByNguon: byNguonList.map((x) => ({ name: x.ten, value: x.count })),
    };
  }, [list]);
}
