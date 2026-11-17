/**
 * Kỳ của chip «Ngày» (`components/ui/DateRangePicker`) cho các nhật ký ghi theo ngày (Pha phèn,
 * Phun cùi). Thuần — `homNay` (YYYY-MM-DD) truyền vào để test được. Tuần bắt đầu Thứ 2 như
 * `lib/date-presets.ts`; tháng / năm tính từ đầu kỳ tới hôm nay.
 */

export const KY_NGAY_TAT_CA = 'all';
export const KY_NGAY_TUY_CHON = 'custom';

/** Thứ tự hiển thị trong chip. */
export const KY_NGAY_PRESET = [
  KY_NGAY_TAT_CA,
  'today',
  'yesterday',
  '7days',
  'thisWeek',
  'lastWeek',
  'thisMonth',
  'lastMonth',
  'thisYear',
  KY_NGAY_TUY_CHON,
] as const;

const pad = (n: number) => String(n).padStart(2, '0');

export function congNgayIso(ymd: string, soNgay: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + soNgay)).toISOString().slice(0, 10);
}

/** Khoảng ngày (YYYY-MM-DD, rỗng = không giới hạn) của một kỳ; `custom` trả nguyên khoảng tự chọn. */
export function khoangTheoKyNgay(ky: string, homNay: string, tu = '', den = ''): { tu: string; den: string } {
  const [y, m, d] = homNay.split('-').map(Number);
  switch (ky) {
    case 'today':
      return { tu: homNay, den: homNay };
    case 'yesterday': {
      const hq = congNgayIso(homNay, -1);
      return { tu: hq, den: hq };
    }
    case '7days':
      return { tu: congNgayIso(homNay, -6), den: homNay };
    case 'thisWeek':
    case 'lastWeek': {
      const thu = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = CN
      const dauTuan = congNgayIso(homNay, -((thu + 6) % 7));
      if (ky === 'thisWeek') return { tu: dauTuan, den: homNay };
      return { tu: congNgayIso(dauTuan, -7), den: congNgayIso(dauTuan, -1) };
    }
    case 'thisMonth':
      return { tu: `${y}-${pad(m)}-01`, den: homNay };
    case 'lastMonth': {
      const cuoi = congNgayIso(`${y}-${pad(m)}-01`, -1);
      return { tu: `${cuoi.slice(0, 7)}-01`, den: cuoi };
    }
    case 'thisYear':
      return { tu: `${y}-01-01`, den: homNay };
    case KY_NGAY_TUY_CHON:
      return { tu, den };
    default:
      return { tu: '', den: '' };
  }
}

/** Kỳ khớp khoảng đang lọc (để chip sáng đúng); rỗng → `all`, không khớp kỳ nào → `custom`. */
export function kyNgayCuaKhoang(tu: string, den: string, homNay: string): string {
  if (!tu && !den) return KY_NGAY_TAT_CA;
  for (const k of KY_NGAY_PRESET) {
    if (k === KY_NGAY_TAT_CA || k === KY_NGAY_TUY_CHON) continue;
    const r = khoangTheoKyNgay(k, homNay);
    if (r.tu === tu && r.den === den) return k;
  }
  return KY_NGAY_TUY_CHON;
}
