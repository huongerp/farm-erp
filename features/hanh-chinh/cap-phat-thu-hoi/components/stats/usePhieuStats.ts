import { useMemo } from 'react';
import type { PhieuCapPhatThuHoi } from '../../core/types';
import type { LoaiPhieu } from '../../core/types';
import { getLoaiPhieuLabel } from '../../core/constants';
import i18n from '../../../../../lib/i18n';

export interface StatsByType {
  id: LoaiPhieu;
  ten: string;
  count: number;
}

export interface StatsByGroup {
  id: string;
  ten: string;
  count: number;
}

export interface PhieuStatsSummary {
  total: number;
  countThisMonth: number;
  countToday: number;
  countThisWeek: number;
  countCapPhat: number;
  countThuHoi: number;
  countLuanChuyen: number;
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

export function usePhieuStats(list: PhieuCapPhatThuHoi[]) {
  return useMemo(() => {
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const byType = new Map<LoaiPhieu, { ten: string; count: number }>();
    const types: LoaiPhieu[] = [
      'cap_phat',
      'thu_hoi',
      'luan_chuyen_vi_tri',
      'luan_chuyen_nguoi',
      'luan_chuyen_ca_hai',
    ];
    types.forEach((loai) => {
      byType.set(loai, { ten: getLoaiPhieuLabel(loai, i18n.t), count: 0 });
    });

    const byNguoiThucHien = new Map<string, { ten: string; count: number }>();
    const byMonth = new Map<string, number>();

    let countThisMonth = 0;
    let countToday = 0;
    let countThisWeek = 0;
    let countCapPhat = 0;
    let countThuHoi = 0;
    let countLuanChuyen = 0;

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const weekStart = todayStart - 6 * oneDayMs;

    list.forEach((p) => {
      const curType = byType.get(p.loai_phieu);
      if (curType) {
        curType.count += 1;
        byType.set(p.loai_phieu, curType);
      }
      if (p.loai_phieu === 'cap_phat') countCapPhat += 1;
      else if (p.loai_phieu === 'thu_hoi') countThuHoi += 1;
      else countLuanChuyen += 1;

      const tenNguoi = p.ten_nguoi_thuc_hien || p.id_nguoi_thuc_hien || '—';
      const curNguoi = byNguoiThucHien.get(p.id_nguoi_thuc_hien) || { ten: tenNguoi, count: 0 };
      curNguoi.count += 1;
      byNguoiThucHien.set(p.id_nguoi_thuc_hien, curNguoi);

      const monthKey = getMonthKey(p.ngay_thuc_hien);
      if (monthKey) {
        byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + 1);
      }
      if (monthKey === thisMonthKey) countThisMonth += 1;

      const d = new Date(p.ngay_thuc_hien).getTime();
      if (d >= todayStart) countToday += 1;
      if (d >= weekStart) countThisWeek += 1;
    });

    const byTypeList: StatsByType[] = Array.from(byType.entries()).map(([id, v]) => ({ id, ...v }));
    const byNguoiThucHienList: StatsByGroup[] = Array.from(byNguoiThucHien.entries()).map(([id, v]) => ({ id, ...v }));

    const monthKeys = Array.from(byMonth.keys()).sort();
    const chartByMonth = monthKeys.map((key) => ({
      name: formatMonthLabel(key),
      value: byMonth.get(key) ?? 0,
    }));

    return {
      summary: {
        total: list.length,
        countThisMonth,
        countToday,
        countThisWeek,
        countCapPhat,
        countThuHoi,
        countLuanChuyen,
      } as PhieuStatsSummary,
      byType: byTypeList,
      byNguoiThucHien: byNguoiThucHienList,
      chartByType: byTypeList.map((x) => ({ name: x.ten, value: x.count })),
      chartByNguoiThucHien: byNguoiThucHienList.map((x) => ({ name: x.ten, value: x.count })),
      chartByMonth,
    };
  }, [list]);
}
