import { useMemo } from 'react';
import type { PhieuBaoTriSuaChua } from '../../core/types';
import type { LoaiChiPhi } from '../../../thiet-lap-tai-san/core/types';
import { getHangMucLabel } from '../../core/constants';
import i18n from '../../../../../lib/i18n';

export interface StatsByHangMuc {
  id: string;
  ten: string;
  count: number;
}

export interface StatsByGroup {
  id: string;
  ten: string;
  count: number;
}

export interface PhieuBaoTriStatsSummary {
  total: number;
  countToday: number;
  countThisWeek: number;
  countBaoTri: number;
  countSuaChua: number;
  uniqueTaiSan: number;
}

function getMonthKey(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatMonthLabel(key: string): string {
  if (!key) return '';
  const [y, m] = key.split('-');
  return `${m}/${y}`;
}

export function usePhieuBaoTriStats(list: PhieuBaoTriSuaChua[], loaiChiPhi: LoaiChiPhi[] = []) {
  return useMemo(() => {
    const idToMa = new Map(loaiChiPhi.map((l) => [l.id, l.ma]));
    const idToTen = new Map(loaiChiPhi.map((l) => [l.id, l.ten]));

    const byHangMuc = new Map<string, { ten: string; count: number }>();
    const byTaiSan = new Map<string, { ten: string; count: number }>();
    const byMonth = new Map<string, number>();
    const taiSanIds = new Set<string>();

    let countToday = 0;
    let countThisWeek = 0;
    let countBaoTri = 0;
    let countSuaChua = 0;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const weekStart = todayStart - 6 * oneDayMs;

    list.forEach((p) => {
      const id = p.id_hang_muc;
      const ten =
        p.ten_hang_muc ?? idToTen.get(id) ?? getHangMucLabel(id, i18n.t);
      const curHm = byHangMuc.get(id) ?? { ten, count: 0 };
      curHm.count += 1;
      curHm.ten = ten;
      byHangMuc.set(id, curHm);

      const ma = idToMa.get(id);
      if (p.id_hang_muc === 'bao_tri' || ma === 'BAO_TRI') countBaoTri += 1;
      else if (p.id_hang_muc === 'sua_chua' || ma === 'SUA_CHUA') countSuaChua += 1;

      if (p.id_tai_san) {
        taiSanIds.add(p.id_tai_san);
        const tenTs = p.ten_tai_san || p.ma_tai_san || p.id_tai_san;
        const curTs = byTaiSan.get(p.id_tai_san) || { ten: tenTs, count: 0 };
        curTs.count += 1;
        byTaiSan.set(p.id_tai_san, curTs);
      }

      const monthKey = getMonthKey(p.ngay);
      if (monthKey) byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + 1);

      const d = new Date(p.ngay).getTime();
      if (d >= todayStart) countToday += 1;
      if (d >= weekStart) countThisWeek += 1;
    });

    const byHangMucList: StatsByHangMuc[] = Array.from(byHangMuc.entries()).map(([hid, v]) => ({
      id: hid,
      ...v,
    }));
    const byTaiSanList: StatsByGroup[] = Array.from(byTaiSan.entries()).map(([id, v]) => ({ id, ...v }));

    const monthKeys = Array.from(byMonth.keys()).sort();
    const chartByMonth = monthKeys.map((key) => ({
      name: formatMonthLabel(key),
      value: byMonth.get(key) ?? 0,
    }));

    return {
      summary: {
        total: list.length,
        countToday,
        countThisWeek,
        countBaoTri,
        countSuaChua,
        uniqueTaiSan: taiSanIds.size,
      } as PhieuBaoTriStatsSummary,
      byHangMuc: byHangMucList,
      byTaiSan: byTaiSanList,
      chartByHangMuc: byHangMucList.map((x) => ({ name: x.ten, value: x.count })),
      chartByMonth,
      chartByTaiSan: byTaiSanList.map((x) => ({ name: x.ten, value: x.count })),
    };
  }, [list, loaiChiPhi]);
}
