/**
 * Cài đặt in dùng chung cho mọi phiếu (khung `PhieuInPage`): khổ, hướng, lề, font, cỡ chữ
 * và bề rộng cột từng bảng. Thuần — không phụ thuộc React hay DOM.
 *
 * Cỡ chữ lưu dạng TỈ LỆ so với cỡ gốc của mẫu (không lưu pt): mẫu A5 nhỏ chữ hơn A4,
 * đổi khổ mà giữ pt tuyệt đối thì phiếu A5 sẽ to bất thường.
 */
import type { HuongGiayIn, KhoGiayIn } from './xuat-phieu';

export const KHO_GIAY_IN = ['a4', 'a5'] as const satisfies readonly KhoGiayIn[];
export const HUONG_GIAY_IN = ['doc', 'ngang'] as const satisfies readonly HuongGiayIn[];
export const FONT_IN = ['mac-dinh', 'times', 'arial', 'tahoma', 'verdana'] as const;
export type FontIn = (typeof FONT_IN)[number];

/** Chuỗi `font-family` cho từng lựa chọn; `mac-dinh` = để mẫu tự quyết. */
export const FONT_IN_CSS: Record<Exclude<FontIn, 'mac-dinh'>, string> = {
  times: "'Times New Roman', Times, serif",
  arial: 'Arial, Helvetica, sans-serif',
  tahoma: 'Tahoma, Geneva, sans-serif',
  verdana: 'Verdana, Geneva, sans-serif',
};

export const LE_MIN_MM = 5;
export const LE_MAX_MM = 25;
export const TI_LE_CHU_MIN = 0.6;
export const TI_LE_CHU_MAX = 1.6;
/** Bước tăng/giảm cỡ chữ trên bảng cài đặt (pt). */
export const BUOC_CO_CHU_PT = 0.5;
/** Cột hẹp nhất khi kéo (% bề rộng bảng). */
export const COT_MIN_PCT = 3;

export interface CaiDatIn {
  kho: KhoGiayIn;
  huong: HuongGiayIn;
  leMm: number;
  font: FontIn;
  /** Tỉ lệ cỡ chữ so với cỡ gốc của mẫu (1 = như thiết kế). */
  tiLeChu: number;
  /** Bề rộng cột theo bảng: khoá = thứ tự bảng trong phiếu, giá trị = % (tổng 100). */
  cot: Record<string, number[]>;
}

export const CAI_DAT_IN_GOC: CaiDatIn = {
  kho: 'a4',
  huong: 'doc',
  leMm: 12,
  font: 'mac-dinh',
  tiLeChu: 1,
  cot: {},
};

const thuoc = <T extends string>(ds: readonly T[], v: unknown): v is T =>
  typeof v === 'string' && (ds as readonly string[]).includes(v);

const kep = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const soHuuHan = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Mảng % hợp lệ: ≥ 2 cột, toàn số dương, tổng ≈ 100. Sai thì bỏ (dùng bố cục gốc của mẫu). */
export function laMangCotHopLe(v: unknown): v is number[] {
  if (!Array.isArray(v) || v.length < 2) return false;
  if (!v.every((x) => soHuuHan(x) && x > 0)) return false;
  const tong = (v as number[]).reduce((s, x) => s + x, 0);
  return Math.abs(tong - 100) < 0.5;
}

/**
 * Gộp cài đặt người dùng đã lưu (`raw`, có thể thiếu / hỏng từ localStorage) lên mặc định
 * của mẫu, kẹp giá trị về khoảng hợp lệ.
 */
export function chuanHoaCaiDatIn(raw: unknown, macDinh: Partial<CaiDatIn> = {}): CaiDatIn {
  const goc: CaiDatIn = { ...CAI_DAT_IN_GOC, ...macDinh, cot: { ...(macDinh.cot ?? {}) } };
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const cot: Record<string, number[]> = { ...goc.cot };
  if (r.cot && typeof r.cot === 'object') {
    for (const [k, v] of Object.entries(r.cot as Record<string, unknown>)) {
      if (laMangCotHopLe(v)) cot[k] = v;
    }
  }
  return {
    kho: thuoc(KHO_GIAY_IN, r.kho) ? r.kho : goc.kho,
    huong: thuoc(HUONG_GIAY_IN, r.huong) ? r.huong : goc.huong,
    leMm: kep(Math.round(soHuuHan(r.leMm) ? r.leMm : goc.leMm), LE_MIN_MM, LE_MAX_MM),
    font: thuoc(FONT_IN, r.font) ? r.font : goc.font,
    tiLeChu: kep(soHuuHan(r.tiLeChu) ? r.tiLeChu : goc.tiLeChu, TI_LE_CHU_MIN, TI_LE_CHU_MAX),
    cot,
  };
}

/** Kích thước giấy (mm) theo khổ + hướng. */
export function kichThuocGiayIn(kho: KhoGiayIn, huong: HuongGiayIn): { wMm: number; hMm: number } {
  const [ngan, dai] = kho === 'a5' ? [148, 210] : [210, 297];
  return huong === 'ngang' ? { wMm: dai, hMm: ngan } : { wMm: ngan, hMm: dai };
}

/** Giá trị cho CSS `@page { size: … }`, vd `A5 landscape`. */
export function cssPageSize(kho: KhoGiayIn, huong: HuongGiayIn): string {
  return `${kho.toUpperCase()} ${huong === 'ngang' ? 'landscape' : 'portrait'}`;
}

/** Cỡ chữ (pt) hiển thị trên bảng cài đặt, làm tròn theo bước. */
export function coChuHienThi(coChuGocPt: number, tiLeChu: number): number {
  return Math.round((coChuGocPt * tiLeChu) / BUOC_CO_CHU_PT) * BUOC_CO_CHU_PT;
}

/** Tăng / giảm một bước cỡ chữ (pt) → tỉ lệ mới, đã kẹp. */
export function doiCoChu(coChuGocPt: number, tiLeChu: number, soBuoc: number): number {
  const pt = coChuHienThi(coChuGocPt, tiLeChu) + soBuoc * BUOC_CO_CHU_PT;
  const tiLe = pt / coChuGocPt;
  return Math.round(kep(tiLe, TI_LE_CHU_MIN, TI_LE_CHU_MAX) * 1000) / 1000;
}

/** Đổi bề rộng đo được (px) ra % tổng 100, làm tròn 2 chữ số. */
export function sangPhanTram(rongPx: number[]): number[] {
  const tong = rongPx.reduce((s, x) => s + Math.max(0, x), 0);
  if (rongPx.length === 0 || tong <= 0) return rongPx.map(() => 100 / Math.max(1, rongPx.length));
  const pct = rongPx.map((x) => Math.round((Math.max(0, x) / tong) * 10000) / 100);
  // Dồn sai số làm tròn vào cột cuối để tổng đúng 100.
  const lech = 100 - pct.reduce((s, x) => s + x, 0);
  pct[pct.length - 1] = Math.round((pct[pct.length - 1] + lech) * 100) / 100;
  return pct;
}

/**
 * Kéo mép phải của cột `i` thêm `deltaPct` (%): cột `i` rộng ra, cột `i + 1` hẹp lại đúng
 * bằng chừng đó — tổng giữ 100, bảng không tràn khổ giấy. Không cột nào hẹp hơn `minPct`.
 */
export function keoCot(rong: number[], i: number, deltaPct: number, minPct = COT_MIN_PCT): number[] {
  if (i < 0 || i >= rong.length - 1) return rong;
  const trai = rong[i];
  const phai = rong[i + 1];
  const d = kep(deltaPct, minPct - trai, phai - minPct);
  if (d === 0) return rong;
  const out = [...rong];
  out[i] = Math.round((trai + d) * 100) / 100;
  out[i + 1] = Math.round((trai + phai - out[i]) * 100) / 100;
  return out;
}

/** Ô tiêu đề bảng rút gọn (chỉ cần span) — để tính lưới mà không phụ thuộc DOM. */
export interface OSpan {
  colSpan: number;
  rowSpan: number;
}

export interface ViTriO {
  hang: number;
  /** Ô thứ mấy trong hàng (thứ tự DOM). */
  o: number;
  /** Cột lá đầu tiên ô chiếm. */
  cotDau: number;
  soCot: number;
}

/**
 * Dựng lưới bảng có rowSpan/colSpan (thuật toán chuẩn HTML): trả số cột lá và cột lá bắt
 * đầu của từng ô. Dùng để biết mép cột ở bảng có tiêu đề nhiều tầng (GSCL, báo cáo sơ chế).
 */
export function dungLuoiBang(hang: OSpan[][]): { soCot: number; o: ViTriO[] } {
  const chiem: boolean[][] = [];
  const out: ViTriO[] = [];
  let soCot = 0;
  hang.forEach((cells, r) => {
    chiem[r] ??= [];
    let c = 0;
    cells.forEach((cell, idx) => {
      while (chiem[r][c]) c++;
      const cs = Math.max(1, Math.floor(cell.colSpan) || 1);
      const rs = Math.max(1, Math.floor(cell.rowSpan) || 1);
      for (let dr = 0; dr < rs; dr++) {
        chiem[r + dr] ??= [];
        for (let dc = 0; dc < cs; dc++) chiem[r + dr][c + dc] = true;
      }
      out.push({ hang: r, o: idx, cotDau: c, soCot: cs });
      c += cs;
      soCot = Math.max(soCot, c);
    });
  });
  return { soCot, o: out };
}
