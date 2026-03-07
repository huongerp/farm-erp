import { useMemo } from 'react';
import type { LichPhongVan } from '../../core/types';
import type { TrangThaiLichPV, HinhThucPhongVan } from '../../core/types';
import { TRANG_THAI_LICH_PV_KEYS } from '../../core/constants';
import { HINH_THUC_OPTIONS } from '../../core/constants';
import { TRANG_THAI_DANH_GIA_KEYS } from '../../core/constants';

export interface LichPhongVanStatsSummary {
  total: number;
  cho: number;
  daDienRa: number;
  hoan: number;
  huy: number;
  online: number;
  offline: number;
  chuaDanhGia: number;
  dat: number;
  khongDat: number;
}

export interface StatsRow {
  id: string;
  labelKey: string;
  count: number;
}

export function useLichPhongVanStats(list: LichPhongVan[]) {
  return useMemo(() => {
    const summary: LichPhongVanStatsSummary = {
      total: list.length,
      cho: 0,
      daDienRa: 0,
      hoan: 0,
      huy: 0,
      online: 0,
      offline: 0,
      chuaDanhGia: 0,
      dat: 0,
      khongDat: 0,
    };

    list.forEach((item) => {
      const st = item.trang_thai as TrangThaiLichPV;
      if (st === 0) summary.cho++;
      else if (st === 1) summary.daDienRa++;
      else if (st === 2) summary.hoan++;
      else if (st === 3) summary.huy++;

      const ht = item.hinh_thuc as HinhThucPhongVan;
      if (ht === 'online') summary.online++;
      else summary.offline++;

      const dg = item.trang_thai_danh_gia ?? 0;
      if (dg === 0) summary.chuaDanhGia++;
      else if (dg === 1) summary.dat++;
      else summary.khongDat++;
    });

    const byTrangThai: StatsRow[] = [0, 1, 2, 3].map((key) => ({
      id: String(key),
      labelKey: TRANG_THAI_LICH_PV_KEYS[key],
      count: list.filter((i) => i.trang_thai === key).length,
    }));

    const byHinhThuc: StatsRow[] = HINH_THUC_OPTIONS.map((opt) => ({
      id: opt.value,
      labelKey: opt.labelKey,
      count: list.filter((i) => i.hinh_thuc === opt.value).length,
    }));

    const byTrangThaiDanhGia: StatsRow[] = [0, 1, 2].map((key) => ({
      id: String(key),
      labelKey: TRANG_THAI_DANH_GIA_KEYS[key],
      count: list.filter((i) => (i.trang_thai_danh_gia ?? 0) === key).length,
    }));

    return {
      summary,
      byTrangThai,
      byHinhThuc,
      byTrangThaiDanhGia,
    };
  }, [list]);
}
