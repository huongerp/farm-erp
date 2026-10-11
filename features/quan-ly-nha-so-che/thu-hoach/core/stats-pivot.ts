import type { ThuHoachDaySuffix } from './types';
import { THU_HOACH_DAY_SUFFIXES } from './types';
import type { DongNgay } from './ngay-thu-hoach';

/** Tổng KH + TT của một ô (nhiều ô ngày gộp lại). */
export interface FarmDayAgg {
  keHoach: number;
  thucTe: number;
}

/** Bảng thống kê: hàng = farm, cột = thứ trong tuần / tuần / tháng. */
export const CHE_DO_THONG_KE = ['thu', 'tuan', 'thang'] as const;
export type CheDoThongKe = (typeof CHE_DO_THONG_KE)[number];

export type CotPivot =
  | { key: string; loai: 'thu'; thu: ThuHoachDaySuffix }
  | { key: string; loai: 'tuan'; nam: number; tuan: number }
  | { key: string; loai: 'thang'; nam: number; thang: number };

export interface PivotThongKe {
  cot: CotPivot[];
  farmKeys: string[];
  farmLabels: Map<string, string>;
  matrix: Map<string, Map<string, FarmDayAgg>>;
  rowTotals: Map<string, FarmDayAgg>;
  colTotals: Map<string, FarmDayAgg>;
  grandTotal: FarmDayAgg;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

function cotCua(d: DongNgay, cheDo: CheDoThongKe): CotPivot {
  if (cheDo === 'thu') return { key: d.thu, loai: 'thu', thu: d.thu };
  if (cheDo === 'tuan') return { key: `${d.nam}-W${pad2(d.tuan)}`, loai: 'tuan', nam: d.nam, tuan: d.tuan };
  return { key: `${d.namLich}-${pad2(d.thang)}`, loai: 'thang', nam: d.namLich, thang: d.thang };
}

function cong(dich: FarmDayAgg, them: FarmDayAgg) {
  dich.keHoach += them.keHoach;
  dich.thucTe += them.thucTe;
}

/**
 * Gộp các ô ngày (đã lọc) thành bảng farm × cột. Chế độ `thu` luôn đủ 7 cột; `tuan` / `thang`
 * chỉ có các cột có dữ liệu, sắp tăng dần theo thời gian.
 */
export function pivotThongKe(dong: DongNgay[], cheDo: CheDoThongKe): PivotThongKe {
  const cotMap = new Map<string, CotPivot>();
  if (cheDo === 'thu') {
    for (const thu of THU_HOACH_DAY_SUFFIXES) cotMap.set(thu, { key: thu, loai: 'thu', thu });
  }
  const matrix = new Map<string, Map<string, FarmDayAgg>>();
  const farmLabels = new Map<string, string>();

  for (const d of dong) {
    const c = cotCua(d, cheDo);
    if (!cotMap.has(c.key)) cotMap.set(c.key, c);
    if (!farmLabels.has(d.farmKey) || d.farmLabel !== '—') farmLabels.set(d.farmKey, d.farmLabel);
    let line = matrix.get(d.farmKey);
    if (!line) {
      line = new Map();
      matrix.set(d.farmKey, line);
    }
    const o = line.get(c.key) ?? { keHoach: 0, thucTe: 0 };
    cong(o, d);
    line.set(c.key, o);
  }

  // Khoá tuần/tháng đã đệm 0 nên sắp chuỗi = sắp thời gian; chế độ thứ giữ thứ tự T2…CN.
  const cot = cheDo === 'thu' ? [...cotMap.values()] : [...cotMap.values()].sort((a, b) => a.key.localeCompare(b.key));
  const farmKeys = [...matrix.keys()].sort((a, b) =>
    (farmLabels.get(a) ?? a).localeCompare(farmLabels.get(b) ?? b, 'vi')
  );

  const rowTotals = new Map<string, FarmDayAgg>();
  const colTotals = new Map<string, FarmDayAgg>(cot.map((c) => [c.key, { keHoach: 0, thucTe: 0 }]));
  const grandTotal: FarmDayAgg = { keHoach: 0, thucTe: 0 };
  for (const fk of farmKeys) {
    const line = matrix.get(fk)!;
    const tong: FarmDayAgg = { keHoach: 0, thucTe: 0 };
    for (const c of cot) {
      const o = line.get(c.key);
      if (!o) continue;
      cong(tong, o);
      cong(colTotals.get(c.key)!, o);
    }
    rowTotals.set(fk, tong);
    cong(grandTotal, tong);
  }

  return { cot, farmKeys, farmLabels, matrix, rowTotals, colTotals, grandTotal };
}

/** Tình trạng đạt kế hoạch của một tổng KH/TT. `null` khi cả KH lẫn TT bằng 0. */
export const TINH_TRANG_DAT_KH = ['vuot', 'dat', 'thieu', 'chua_nhap'] as const;
export type TinhTrangDatKh = (typeof TINH_TRANG_DAT_KH)[number];

export function tinhTrangDatKh(agg: FarmDayAgg): TinhTrangDatKh | null {
  if (agg.keHoach === 0 && agg.thucTe === 0) return null;
  if (agg.thucTe === 0) return 'chua_nhap';
  if (agg.thucTe > agg.keHoach) return 'vuot';
  if (agg.thucTe === agg.keHoach) return 'dat';
  return 'thieu';
}
