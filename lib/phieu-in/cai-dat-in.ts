/**
 * Cài đặt in dùng chung cho mọi phiếu (khung `PhieuInPage`): khổ, hướng, lề từng cạnh, phông,
 * cỡ chữ, độ rộng / ẩn cột từng bảng, đầu/chân trang, logo, ô ký, số liên, QR.
 * Thuần — không phụ thuộc React hay DOM.
 *
 * Lưu trên TỪNG MÁY theo mẫu (`use-cai-dat-in-store.ts`), CHỈ lưu phần khác mặc định của mẫu
 * (`phanKhacMacDinh`): đổi mặc định trong code thì người chưa từng chỉnh vẫn nhận mặc định mới.
 *
 * Cỡ chữ lưu dạng TỈ LỆ so với cỡ gốc của mẫu (không lưu pt): mẫu A5 nhỏ chữ hơn A4,
 * đổi khổ mà giữ pt tuyệt đối thì phiếu A5 sẽ to bất thường.
 */

export type KhoGiayIn = 'a4' | 'a5' | 'a3';
export type HuongGiayIn = 'doc' | 'ngang';

export const KHO_GIAY_IN = ['a5', 'a4', 'a3'] as const satisfies readonly KhoGiayIn[];
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

/** Khổ giấy dọc (mm): [ngắn, dài]. */
const KICH_THUOC_KHO: Record<KhoGiayIn, [number, number]> = {
  a5: [148, 210],
  a4: [210, 297],
  a3: [297, 420],
};

export const LE_MIN_MM = 0;
export const LE_MAX_MM = 40;
export const TI_LE_CHU_MIN = 0.6;
export const TI_LE_CHU_MAX = 1.6;
export const SO_LIEN_MAX = 3;
/** Bước tăng/giảm cỡ chữ trên bảng cài đặt (pt). */
export const BUOC_CO_CHU_PT = 0.5;
/** Cột hẹp nhất khi kéo (% bề rộng bảng). */
export const COT_MIN_PCT = 3;

export interface LeTrang {
  tren: number;
  phai: number;
  duoi: number;
  trai: number;
}

export const CANH_LE = ['tren', 'phai', 'duoi', 'trai'] as const satisfies readonly (keyof LeTrang)[];

export interface DauChanTrang {
  /** «Trang x/y» góc dưới phải. */
  soTrang: boolean;
  /** Giờ in góc dưới trái. */
  gioIn: boolean;
  /** Tên người in góc dưới trái. */
  nguoiIn: boolean;
  /** Bảng bị tách sang trang sau thì lặp lại hàng tiêu đề. */
  lapTieuDeBang: boolean;
}

export interface CaiDatIn {
  kho: KhoGiayIn;
  huong: HuongGiayIn;
  le: LeTrang;
  font: FontIn;
  /** Tỉ lệ cỡ chữ so với cỡ gốc của mẫu (1 = như thiết kế). */
  tiLeChu: number;
  /** Bề rộng cột theo bảng: khoá = thứ tự bảng trong một liên, giá trị = % (tổng 100). */
  cot: Record<string, number[]>;
  /** Chỉ số cột (vị trí cột thật) bị ẩn theo bảng. */
  anCot: Record<string, number[]>;
  dauChan: DauChanTrang;
  /** Khối gắn `data-in-logo`. */
  hienLogo: boolean;
  /** Khối gắn `data-in-chu-ky`. */
  hienChuKy: boolean;
  /** Số liên (1–3), mỗi liên bắt đầu trang mới. */
  soLien: number;
  /** Mã QR mở bản gốc ở góc trang đầu. */
  qr: boolean;
}

export const CAI_DAT_IN_GOC: CaiDatIn = {
  kho: 'a4',
  huong: 'doc',
  le: { tren: 12, phai: 12, duoi: 12, trai: 12 },
  font: 'mac-dinh',
  tiLeChu: 1,
  cot: {},
  anCot: {},
  // Mẫu cũ in «In lúc …» cuối phiếu → giữ giờ in bật sẵn (nay nằm ở chân trang mọi trang).
  dauChan: { soTrang: true, gioIn: true, nguoiIn: false, lapTieuDeBang: true },
  hienLogo: true,
  hienChuKy: true,
  soLien: 1,
  qr: false,
};

/**
 * Mặc định riêng của một mẫu — chỉ khai phần khác `CAI_DAT_IN_GOC`. `leMm` (một số cho cả bốn
 * cạnh) là cách khai cũ, vẫn nhận; `le` khai từng cạnh thì đè lên.
 */
export type MacDinhMau = Partial<Omit<CaiDatIn, 'le' | 'dauChan'>> & {
  leMm?: number;
  le?: Partial<LeTrang>;
  dauChan?: Partial<DauChanTrang>;
};

const thuoc = <T extends string>(ds: readonly T[], v: unknown): v is T =>
  typeof v === 'string' && (ds as readonly string[]).includes(v);

const kep = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const soHuuHan = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const laBool = (v: unknown, macDinh: boolean): boolean => (typeof v === 'boolean' ? v : macDinh);

const laObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Mảng % hợp lệ: ≥ 2 cột, toàn số dương, tổng ≈ 100. Sai thì bỏ (dùng bố cục gốc của mẫu). */
export function laMangCotHopLe(v: unknown): v is number[] {
  if (!Array.isArray(v) || v.length < 2) return false;
  if (!v.every((x) => soHuuHan(x) && x > 0)) return false;
  const tong = (v as number[]).reduce((s, x) => s + x, 0);
  return Math.abs(tong - 100) < 0.5;
}

function chuanHoaCot(raw: unknown): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  if (!laObj(raw)) return out;
  for (const [k, v] of Object.entries(raw)) if (laMangCotHopLe(v)) out[k] = v;
  return out;
}

function chuanHoaAnCot(raw: unknown): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  if (!laObj(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (!Array.isArray(v)) continue;
    const ds = [...new Set(v.filter((x): x is number => Number.isInteger(x) && x >= 0))].sort((a, b) => a - b);
    if (ds.length > 0) out[k] = ds;
  }
  return out;
}

const leDeu = (mm: number): LeTrang => ({ tren: mm, phai: mm, duoi: mm, trai: mm });

/** Lề mặc định của mẫu: `leMm` cũ (đều bốn cạnh) rồi `le` từng cạnh đè lên. */
function leCuaMau(md: MacDinhMau): LeTrang {
  const nen = soHuuHan(md.leMm) ? leDeu(md.leMm) : CAI_DAT_IN_GOC.le;
  return { ...nen, ...md.le };
}

/** Mặc định đầy đủ của một mẫu (chưa có gì người dùng lưu). */
export function macDinhDayDu(md: MacDinhMau = {}): CaiDatIn {
  const { leMm: _leMm, le: _le, dauChan, ...con } = md;
  return {
    ...CAI_DAT_IN_GOC,
    ...con,
    le: leCuaMau(md),
    dauChan: { ...CAI_DAT_IN_GOC.dauChan, ...dauChan },
    cot: { ...(md.cot ?? {}) },
    anCot: { ...(md.anCot ?? {}) },
  };
}

/**
 * Gộp cài đặt người dùng đã lưu (`raw`, có thể thiếu / hỏng / bản cũ từ localStorage) lên
 * mặc định của mẫu, kẹp giá trị về khoảng hợp lệ. Bản lưu cũ có `leMm` (một số) → lề đều.
 */
export function chuanHoaCaiDatIn(raw: unknown, macDinh: MacDinhMau = {}): CaiDatIn {
  const goc = macDinhDayDu(macDinh);
  const r = laObj(raw) ? raw : {};
  const leLuu: Record<string, unknown> = laObj(r.le) ? r.le : soHuuHan(r.leMm) ? { ...leDeu(r.leMm) } : {};
  const le = {} as LeTrang;
  for (const k of CANH_LE) {
    const v = leLuu[k];
    le[k] = kep(Math.round((soHuuHan(v) ? v : goc.le[k]) * 2) / 2, LE_MIN_MM, LE_MAX_MM);
  }
  const dc = laObj(r.dauChan) ? r.dauChan : {};
  return {
    kho: thuoc(KHO_GIAY_IN, r.kho) ? r.kho : goc.kho,
    huong: thuoc(HUONG_GIAY_IN, r.huong) ? r.huong : goc.huong,
    le,
    font: thuoc(FONT_IN, r.font) ? r.font : goc.font,
    tiLeChu: kep(soHuuHan(r.tiLeChu) ? r.tiLeChu : goc.tiLeChu, TI_LE_CHU_MIN, TI_LE_CHU_MAX),
    cot: r.cot === undefined ? goc.cot : { ...goc.cot, ...chuanHoaCot(r.cot) },
    anCot: r.anCot === undefined ? goc.anCot : chuanHoaAnCot(r.anCot),
    dauChan: {
      soTrang: laBool(dc.soTrang, goc.dauChan.soTrang),
      gioIn: laBool(dc.gioIn, goc.dauChan.gioIn),
      nguoiIn: laBool(dc.nguoiIn, goc.dauChan.nguoiIn),
      lapTieuDeBang: laBool(dc.lapTieuDeBang, goc.dauChan.lapTieuDeBang),
    },
    hienLogo: laBool(r.hienLogo, goc.hienLogo),
    hienChuKy: laBool(r.hienChuKy, goc.hienChuKy),
    soLien: Math.round(kep(soHuuHan(r.soLien) ? r.soLien : goc.soLien, 1, SO_LIEN_MAX)),
    qr: laBool(r.qr, goc.qr),
  };
}

/**
 * Phần khác giữa cài đặt và mặc định của mẫu — thứ được lưu xuống máy. `{}` khi trùng hết
 * (để «Khôi phục mặc định» / chỉnh về đúng mặc định thì xoá hẳn khỏi bộ nhớ).
 */
export function phanKhacMacDinh(c: CaiDatIn, macDinh: MacDinhMau = {}): Partial<CaiDatIn> {
  const md = macDinhDayDu(macDinh);
  const out: Partial<CaiDatIn> = {};
  for (const k of Object.keys(c) as (keyof CaiDatIn)[]) {
    if (JSON.stringify(c[k]) !== JSON.stringify(md[k])) (out as Record<string, unknown>)[k] = c[k];
  }
  return out;
}

/** Bốn cạnh lề bằng nhau không (bật khoá «lề đều» trên bảng cài đặt). */
export function laLeDeu(le: LeTrang): boolean {
  return le.tren === le.phai && le.phai === le.duoi && le.duoi === le.trai;
}

/** Kích thước giấy (mm) theo khổ + hướng. */
export function kichThuocGiayIn(kho: KhoGiayIn, huong: HuongGiayIn): { wMm: number; hMm: number } {
  const [ngan, dai] = KICH_THUOC_KHO[kho] ?? KICH_THUOC_KHO.a4;
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

/** Ô bảng rút gọn (chỉ cần span) — để tính lưới mà không phụ thuộc DOM. */
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
 * đầu của từng ô. Dùng để gắn `data-in-o` đúng vị trí cột thật — ẩn cột theo đó thì dòng
 * «Tổng cộng» gộp ô không bị ẩn nhầm như `nth-child`.
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
