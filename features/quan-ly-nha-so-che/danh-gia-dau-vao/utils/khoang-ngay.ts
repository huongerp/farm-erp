/** Kỳ của chip thời gian các tab Đánh giá đầu vào + khoảng In / Xuất lưới + tuần farm phủ khoảng (thuần). */
import { cacNgayTrongKhoang, congNgay, ngayDauTuanFarm, tuanFarmCuaNgay, tuanKeTiep } from '../core/tuan';
import type { TuanFarm } from '../core/types';

/** Kỳ của chip thời gian (thứ tự hiển thị). `all` = không giới hạn ngày. */
export const KY_TAT_CA = 'all';
export const KY_TUY_CHON = 'custom';
export const KY_DGDV = [
  KY_TAT_CA,
  'today',
  'yesterday',
  '7days',
  'thisWeek',
  'lastWeek',
  'thisMonth',
  'lastMonth',
  'thisQuarter',
  'thisYear',
  KY_TUY_CHON,
] as const;
export type KyDgdv = (typeof KY_DGDV)[number];

/** Khoảng tối đa một lần xem / in (mỗi ngày một khối lưới — quá dài thì nặng trình duyệt). */
export const SO_NGAY_TOI_DA = 31;

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Khoảng ngày (YYYY-MM-DD, rỗng = không giới hạn) của một kỳ. Tuần = tuần farm trọn T2 → CN;
 * tháng / quý / năm tính từ đầu kỳ tới hôm nay (như `lib/date-presets`). `custom` trả nguyên khoảng tự chọn.
 */
export function khoangTheoKy(ky: string, homNay: string, tu = '', den = ''): { tu: string; den: string } {
  const [y, m] = homNay.split('-').map(Number);
  switch (ky) {
    case 'today':
      return { tu: homNay, den: homNay };
    case 'yesterday': {
      const hq = congNgay(homNay, -1);
      return { tu: hq, den: hq };
    }
    case '7days':
      return { tu: congNgay(homNay, -6), den: homNay };
    case 'thisWeek':
    case 'lastWeek': {
      const t = ky === 'thisWeek' ? tuanFarmCuaNgay(homNay) : tuanKeTiep(tuanFarmCuaNgay(homNay), -1);
      const dau = ngayDauTuanFarm(t.nam, t.tuan);
      return { tu: dau, den: congNgay(dau, 6) };
    }
    case 'thisMonth':
      return { tu: `${y}-${pad(m)}-01`, den: homNay };
    case 'lastMonth': {
      const dauThangNay = `${y}-${pad(m)}-01`;
      const cuoi = congNgay(dauThangNay, -1);
      return { tu: `${cuoi.slice(0, 7)}-01`, den: cuoi };
    }
    case 'thisQuarter':
      return { tu: `${y}-${pad(Math.floor((m - 1) / 3) * 3 + 1)}-01`, den: homNay };
    case 'thisYear':
      return { tu: `${y}-01-01`, den: homNay };
    case KY_TUY_CHON:
      return { tu, den };
    default:
      return { tu: '', den: '' };
  }
}

/** Kỳ khớp khoảng đang lọc (để chip sáng đúng); rỗng → `all`, không khớp kỳ nào → `custom`. */
export function kyCuaKhoang(tu: string, den: string, homNay: string): KyDgdv {
  if (!tu && !den) return KY_TAT_CA;
  for (const k of KY_DGDV) {
    if (k === KY_TAT_CA || k === KY_TUY_CHON) continue;
    const x = khoangTheoKy(k, homNay);
    if (x.tu === tu && x.den === den) return k;
  }
  return KY_TUY_CHON;
}

/** Số ngày của khoảng (tính cả hai đầu); khoảng không giới hạn → Infinity. */
export function soNgayCuaKhoang(tu: string, den: string): number {
  if (!tu || !den) return Infinity;
  return cacNgayTrongKhoang(tu, den).length;
}

/** Chuẩn hoá khoảng: đảo nếu ngược, cắt còn `SO_NGAY_TOI_DA` ngày tính từ `tu`. */
export function chuanHoaKhoang(tu: string, den: string): { tu: string; den: string; biCat: boolean } {
  const [a, b] = den < tu ? [den, tu] : [tu, den];
  const maxDen = congNgay(a, SO_NGAY_TOI_DA - 1);
  return b > maxDen ? { tu: a, den: maxDen, biCat: true } : { tu: a, den: b, biCat: false };
}

/** Các tuần farm (không trùng, theo thứ tự) chứa ít nhất một ngày trong khoảng. */
export function cacTuanTrongKhoang(tu: string, den: string): TuanFarm[] {
  const kq: TuanFarm[] = [];
  for (const ngay of cacNgayTrongKhoang(tu, den)) {
    const t = tuanFarmCuaNgay(ngay);
    if (!kq.some((x) => x.nam === t.nam && x.tuan === t.tuan)) kq.push(t);
  }
  return kq;
}
