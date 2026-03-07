import { useMemo } from 'react';
import type { TaiSan } from '../../../danh-muc-tai-san/core/types';

export interface KhauHaoStatsSummary {
  tongNguyenGia: number;
  tongKhauHaoLuyKe: number;
  tongGiaTriConLai: number;
  totalCount: number;
}

export interface KhauHaoStatsByNhom {
  id: string;
  tenNhom: string;
  count: number;
  nguyenGia: number;
  khauHaoLuyKe: number;
  giaTriConLai: number;
}

export interface ChartByNhomItem {
  name: string;
  value: number;
}

export function useKhauHaoStats(list: TaiSan[]) {
  return useMemo(() => {
    let tongNguyenGia = 0;
    let tongKhauHaoLuyKe = 0;
    let tongGiaTriConLai = 0;
    const byNhom = new Map<string, {
      tenNhom: string;
      count: number;
      nguyenGia: number;
      khauHaoLuyKe: number;
      giaTriConLai: number;
    }>();

    list.forEach((item) => {
      const ng = item.nguyen_gia ?? 0;
      const kh = item.khau_hao_luy_ke ?? 0;
      const gcl = item.gia_tri_con_lai ?? ng;
      tongNguyenGia += ng;
      tongKhauHaoLuyKe += kh;
      tongGiaTriConLai += gcl;

      const key = item.id_nhom || '';
      const tenNhom = item.ten_nhom || '—';
      const cur = byNhom.get(key) ?? {
        tenNhom,
        count: 0,
        nguyenGia: 0,
        khauHaoLuyKe: 0,
        giaTriConLai: 0,
      };
      cur.count += 1;
      cur.nguyenGia += ng;
      cur.khauHaoLuyKe += kh;
      cur.giaTriConLai += gcl;
      byNhom.set(key, cur);
    });

    const byNhomList: KhauHaoStatsByNhom[] = Array.from(byNhom.entries()).map(([id, v]) => ({
      id,
      tenNhom: v.tenNhom,
      count: v.count,
      nguyenGia: v.nguyenGia,
      khauHaoLuyKe: v.khauHaoLuyKe,
      giaTriConLai: v.giaTriConLai,
    }));

    const chartByNhom: ChartByNhomItem[] = byNhomList.map((x) => ({
      name: x.tenNhom,
      value: x.nguyenGia,
    }));

    return {
      summary: {
        tongNguyenGia,
        tongKhauHaoLuyKe,
        tongGiaTriConLai,
        totalCount: list.length,
      } as KhauHaoStatsSummary,
      byNhom: byNhomList,
      chartByNhom,
    };
  }, [list]);
}
