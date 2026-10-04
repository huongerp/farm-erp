/**
 * Cài đặt tem in — lưu THEO TỪNG MÁY (localStorage): máy in tem cắm vào máy nào thì khổ
 * tem đặt ở máy đó. Mọi đọc/ghi bọc try/catch; hỏng hoặc trống → giá trị mặc định.
 */

export type CheDoIn = 'cuon' | 'a4';

export interface TruongTem {
  soPhieu: boolean;
  thung: boolean;
  ngay: boolean;
  farm: boolean;
  thanhPham: boolean;
  cayHang: boolean;
  nhan: boolean;
}

export interface CaiDatTem {
  /** Khổ tem (mm). */
  rong: number;
  cao: number;
  /** `cuon`: mỗi trang = một tem (máy in tem); `a4`: xếp lưới trên A4 để in thử. */
  cheDo: CheDoIn;
  /** Lề trong tem (mm). */
  le: number;
  /** Cỡ QR, % phần cạnh dành cho QR (50–100). */
  tiLeQr: number;
  /** Cỡ chữ dòng chính (pt). */
  coChu: number;
  truong: TruongTem;
  /** Chữ nhãn khi không có logo, vd "QC". */
  nhan: string;
  /** Logo dạng data URL (thay chữ nhãn), null = dùng chữ. */
  logo: string | null;
}

export const STORAGE_KEY_TEM = 'gscl-cai-dat-tem';

/** Logo lưu base64 trong localStorage — chặn ảnh lớn. */
export const LOGO_MAX_BYTES = 150 * 1024;

export const KHO_TEM_GOI_Y: ReadonlyArray<readonly [number, number]> = [
  [40, 30],
  [50, 30],
  [50, 40],
  [60, 40],
  [70, 50],
  [100, 50],
];

export const CAI_DAT_TEM_MAC_DINH: CaiDatTem = {
  rong: 50,
  cao: 30,
  cheDo: 'cuon',
  le: 1.5,
  tiLeQr: 90,
  coChu: 8,
  truong: { soPhieu: true, thung: true, ngay: true, farm: true, thanhPham: true, cayHang: true, nhan: true },
  nhan: 'QC',
  logo: null,
};

const kep = (v: unknown, min: number, max: number, macDinh: number) => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return macDinh;
  return Math.min(max, Math.max(min, n));
};

/** Dữ liệu bất kỳ (JSON cũ, người dùng gõ) → cài đặt hợp lệ. */
export function chuanHoaCaiDatTem(raw: unknown): CaiDatTem {
  const d = CAI_DAT_TEM_MAC_DINH;
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof CaiDatTem, unknown>>;
  const tr = (r.truong && typeof r.truong === 'object' ? r.truong : {}) as Partial<Record<keyof TruongTem, unknown>>;
  const truong = Object.fromEntries(
    (Object.keys(d.truong) as (keyof TruongTem)[]).map((k) => [k, typeof tr[k] === 'boolean' ? tr[k] : d.truong[k]])
  ) as unknown as TruongTem;
  const logo = typeof r.logo === 'string' && r.logo.startsWith('data:image/') && r.logo.length <= LOGO_MAX_BYTES * 1.4 ? r.logo : null;
  return {
    rong: kep(r.rong, 20, 150, d.rong),
    cao: kep(r.cao, 15, 150, d.cao),
    cheDo: r.cheDo === 'a4' ? 'a4' : 'cuon',
    le: kep(r.le, 0, 10, d.le),
    tiLeQr: kep(r.tiLeQr, 50, 100, d.tiLeQr),
    coChu: kep(r.coChu, 5, 20, d.coChu),
    truong,
    nhan: typeof r.nhan === 'string' ? r.nhan.slice(0, 12) : d.nhan,
    logo,
  };
}

export function docCaiDatTem(): CaiDatTem {
  try {
    const s = localStorage.getItem(STORAGE_KEY_TEM);
    return chuanHoaCaiDatTem(s ? JSON.parse(s) : null);
  } catch {
    return CAI_DAT_TEM_MAC_DINH;
  }
}

export function ghiCaiDatTem(c: CaiDatTem): boolean {
  try {
    localStorage.setItem(STORAGE_KEY_TEM, JSON.stringify(chuanHoaCaiDatTem(c)));
    return true;
  } catch {
    return false;
  }
}

export interface BoCucTem {
  /** QR bên trái, chữ bên phải (tem dẹt) — ngược lại QR ở trên, chữ ở dưới. */
  ngang: boolean;
  /** Cạnh QR (mm). */
  qrMm: number;
  /** Cỡ chữ dòng phụ (pt). */
  coChuPhu: number;
}

/** Tem rộng hơn cao ≥ 1,3 lần thì xếp ngang (QR trái); QR chiếm phần cạnh ngắn. */
export function bocCucTem(c: CaiDatTem): BoCucTem {
  const trongRong = Math.max(5, c.rong - 2 * c.le);
  const trongCao = Math.max(5, c.cao - 2 * c.le);
  const ngang = c.rong >= c.cao * 1.3;
  const canh = ngang ? Math.min(trongCao, trongRong * 0.5) : Math.min(trongRong, trongCao * 0.62);
  return {
    ngang,
    qrMm: Math.round(canh * (c.tiLeQr / 100) * 10) / 10,
    coChuPhu: Math.max(5, Math.round(c.coChu * 0.78 * 10) / 10),
  };
}
