/**
 * Kỳ lọc của chip Thời gian (DateRangePicker) ở tab Phiếu.
 *
 * Khác `lib/date-presets.ts`: tháng / quý / năm lấy TRỌN kỳ thay vì cắt ở hôm nay —
 * phiếu xin nghỉ thường đăng ký trước cho những ngày cuối kỳ, cắt ở hôm nay sẽ lọc mất.
 */

export const KY_PRESETS = ['all', 'thisMonth', 'lastMonth', 'thisQuarter', 'thisYear'] as const;
export const KY_CUSTOM = 'custom';

/** Khoảng ngày `yyyy-mm-dd`; thiếu một đầu = không giới hạn đầu đó. */
export interface KyLoc {
  from?: string;
  to?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const ngay = (y: number, m0: number, d: number) => `${y}-${pad(m0 + 1)}-${pad(d)}`;
/** Ngày 0 của tháng kế = ngày cuối tháng này (tự đúng năm nhuận). */
const cuoiThang = (y: number, m0: number) => new Date(y, m0 + 1, 0).getDate();

/** null = không lọc theo thời gian. */
export function khoangKyLoc(preset: string, tuNgay: string, denNgay: string, homNay: Date): KyLoc | null {
  const y = homNay.getFullYear();
  const m = homNay.getMonth();
  switch (preset) {
    case 'thisMonth':
      return { from: ngay(y, m, 1), to: ngay(y, m, cuoiThang(y, m)) };
    case 'lastMonth': {
      const ly = m === 0 ? y - 1 : y;
      const lm = m === 0 ? 11 : m - 1;
      return { from: ngay(ly, lm, 1), to: ngay(ly, lm, cuoiThang(ly, lm)) };
    }
    case 'thisQuarter': {
      const dau = Math.floor(m / 3) * 3;
      return { from: ngay(y, dau, 1), to: ngay(y, dau + 2, cuoiThang(y, dau + 2)) };
    }
    case 'thisYear':
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    case KY_CUSTOM: {
      if (!tuNgay && !denNgay) return null;
      return { ...(tuNgay ? { from: tuNgay } : {}), ...(denNgay ? { to: denNgay } : {}) };
    }
    default:
      return null;
  }
}

/** Phiếu (từ ngày → đến ngày) chạm vào kỳ — cùng điều kiện với lọc ở server. */
export function phieuChamKy(p: { ngay: string; den_ngay: string }, ky: KyLoc | null): boolean {
  if (!ky) return true;
  if (ky.to && p.ngay > ky.to) return false;
  if (ky.from && (p.den_ngay || p.ngay) < ky.from) return false;
  return true;
}
