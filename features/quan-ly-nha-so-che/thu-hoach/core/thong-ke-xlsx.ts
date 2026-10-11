/**
 * Bảng XLSX của báo cáo thống kê thu hoạch: mỗi farm 3 dòng KH / TT / CL, cùng cột với bản in.
 */
import type { PivotThongKe, FarmDayAgg } from './stats-pivot';

export interface NhanXlsxThongKe {
  tieuDe: string;
  moTaLoc: string;
  farm: string;
  chiTieu: string;
  kh: string;
  tt: string;
  cl: string;
  tongCot: string;
  tongHang: string;
}

export type OXlsx = string | number;

function baDong(nhan: string, nhanCot: NhanXlsxThongKe, o: (key: string) => FarmDayAgg, keys: string[], tong: FarmDayAgg): OXlsx[][] {
  const dong = (ten: string, gia: (a: FarmDayAgg) => number, dau: string): OXlsx[] => [
    dau,
    ten,
    ...keys.map((k) => gia(o(k))),
    gia(tong),
  ];
  return [
    dong(nhanCot.kh, (a) => a.keHoach, nhan),
    dong(nhanCot.tt, (a) => a.thucTe, ''),
    dong(nhanCot.cl, (a) => a.thucTe - a.keHoach, ''),
  ];
}

/** Mảng 2 chiều cho `XLSX.utils.aoa_to_sheet`: tiêu đề, mô tả lọc, dòng trống, header, dữ liệu. */
export function taoAoaThongKe(
  pivot: PivotThongKe,
  nhanCot: string[],
  tenFarm: (fk: string) => string,
  nhan: NhanXlsxThongKe
): OXlsx[][] {
  const keys = pivot.cot.map((c) => c.key);
  const rong: FarmDayAgg = { keHoach: 0, thucTe: 0 };
  const aoa: OXlsx[][] = [
    [nhan.tieuDe],
    [nhan.moTaLoc],
    [],
    [nhan.farm, nhan.chiTieu, ...nhanCot, nhan.tongCot],
  ];
  for (const fk of pivot.farmKeys) {
    const line = pivot.matrix.get(fk)!;
    aoa.push(...baDong(tenFarm(fk), nhan, (k) => line.get(k) ?? rong, keys, pivot.rowTotals.get(fk)!));
  }
  aoa.push(...baDong(nhan.tongHang, nhan, (k) => pivot.colTotals.get(k) ?? rong, keys, pivot.grandTotal));
  return aoa;
}
