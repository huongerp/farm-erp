/**
 * BẢN SERVER của `lib/export/dinh-dang-o.ts` — worker đồng bộ đọc dữ liệu thô từ PostgREST
 * và phải ra ĐÚNG ô mà dialog Xuất ghi cho cùng giá trị (nếu không, mỗi lượt đồng bộ lại thấy
 * "dòng có thay đổi"). Service build trong Docker riêng nên không import chéo được — sửa
 * file này thì sửa cả bản client; test parity ở `lib/export/dinh-dang-o.test.ts` canh lệch.
 */

export type KieuCotXuat = 'text' | 'number' | 'money' | 'percent' | 'date' | 'datetime' | 'boolean';

export interface ExportColumn {
  key: string;
  label: string;
  /** Không khai → suy từ giá trị (chỉ nhận dạng chắc chắn: number, boolean, chuỗi ISO). */
  type?: KieuCotXuat;
}

export interface OXuat {
  hienThi: string;
  excel: string | number | Date;
  sheet: string | number;
}

/** Việt Nam UTC+7 cố định, không có giờ mùa hè — quy đổi bằng hằng số là đúng. */
const LECH_VN_MS = 7 * 60 * 60 * 1000;
/** 1970-01-01 là ngày thứ 25569 tính từ mốc 1899-12-30 của Sheet/Excel. */
const NGAY_EPOCH = 25569;
const MS_MOI_NGAY = 86_400_000;

const LA_NGAY = /^\d{4}-\d{2}-\d{2}$/;
const LA_THOI_DIEM = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;
const LA_SO_TRAN = /^-?\d+(\.\d+)?$/;

function hai(n: number): string {
  return String(n).padStart(2, '0');
}

/** Ngày trần (không giờ) → serial nguyên. Tháng tính từ 1. */
export function serialNgay(nam: number, thang: number, ngay: number): number {
  return Date.UTC(nam, thang - 1, ngay) / MS_MOI_NGAY + NGAY_EPOCH;
}

/**
 * Thời điểm → serial theo giờ Việt Nam, cắt tới PHÚT: đúng độ chi tiết đang hiển
 * thị và tránh lệch chữ số cuối khiến đồng bộ nền tưởng dòng "có thay đổi".
 */
export function serialThoiDiem(msUtc: number): number {
  const phut = Math.floor((msUtc + LECH_VN_MS) / 60_000);
  return NGAY_EPOCH + phut / 1440;
}

/**
 * `Date` mà phần UTC chính là giờ treo tường Việt Nam (cắt tới phút). ExcelJS đổi
 * `Date` sang serial theo UTC — đưa thẳng `Date` gốc thì Excel hiện giờ UTC (lệch 7 tiếng).
 */
function dateTreoTuongVN(msUtc: number): Date {
  return new Date(Math.floor((msUtc + LECH_VN_MS) / 60_000) * 60_000);
}

function suyKieu(gt: unknown): KieuCotXuat {
  if (typeof gt === 'boolean') return 'boolean';
  if (gt instanceof Date) return 'datetime';
  if (typeof gt === 'number') return 'number';
  if (typeof gt === 'string') {
    if (LA_THOI_DIEM.test(gt)) return 'datetime';
    if (LA_NGAY.test(gt)) return 'date';
  }
  return 'text';
}

/**
 * Chuỗi về số — chỉ nhận số trần (`1234.5`, PostgREST trả numeric lớn dạng chuỗi).
 * Chuỗi đã format kiểu VN (`1.234,5`) KHÔNG đoán: dấu chấm là nghìn hay thập phân
 * thì không biết chắc, để nguyên chữ còn hơn ra số sai.
 */
function veSo(gt: unknown): number | null {
  if (typeof gt === 'number') return Number.isFinite(gt) ? gt : null;
  if (typeof gt !== 'string') return null;
  const s = gt.trim();
  if (!LA_SO_TRAN.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function veMsUtc(gt: unknown): number | null {
  if (gt instanceof Date) return Number.isNaN(gt.getTime()) ? null : gt.getTime();
  if (typeof gt !== 'string') return null;
  const ms = new Date(gt).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function chu(s: string): OXuat {
  return { hienThi: s, excel: s, sheet: s };
}

export function dinhDangOXuat(gt: unknown, kieu?: KieuCotXuat): OXuat {
  if (gt === null || gt === undefined || gt === '') return chu('');

  const k = kieu ?? suyKieu(gt);

  if (k === 'boolean') {
    const b = typeof gt === 'boolean' ? gt : String(gt) === 'true';
    return chu(b ? 'Có' : 'Không');
  }

  if (k === 'date') {
    // Ngày trần: đọc thẳng phần ngày của chuỗi, KHÔNG quy múi giờ.
    if (typeof gt === 'string' && LA_NGAY.test(gt.slice(0, 10)) && !LA_THOI_DIEM.test(gt)) {
      const y = Number(gt.slice(0, 4));
      const m = Number(gt.slice(5, 7));
      const d = Number(gt.slice(8, 10));
      return {
        hienThi: `${hai(d)}/${hai(m)}/${y}`,
        excel: new Date(Date.UTC(y, m - 1, d)),
        sheet: serialNgay(y, m, d),
      };
    }
    // Có giờ (timestamptz, Date) nhưng cột chỉ cần ngày → lấy ngày theo giờ VN.
    const ms = veMsUtc(gt);
    if (ms === null) return chu(String(gt));
    const v = new Date(ms + LECH_VN_MS);
    const y = v.getUTCFullYear();
    const m = v.getUTCMonth() + 1;
    const d = v.getUTCDate();
    return {
      hienThi: `${hai(d)}/${hai(m)}/${y}`,
      excel: new Date(Date.UTC(y, m - 1, d)),
      sheet: serialNgay(y, m, d),
    };
  }

  if (k === 'datetime') {
    const ms = veMsUtc(gt);
    if (ms === null) return chu(String(gt));
    const v = dateTreoTuongVN(ms);
    return {
      hienThi:
        `${hai(v.getUTCDate())}/${hai(v.getUTCMonth() + 1)}/${v.getUTCFullYear()} ` +
        `${hai(v.getUTCHours())}:${hai(v.getUTCMinutes())}`,
      excel: v,
      sheet: serialThoiDiem(ms),
    };
  }

  if (k === 'number' || k === 'money' || k === 'percent') {
    const n = veSo(gt);
    if (n === null) return chu(String(gt));
    const hienThi =
      k === 'percent'
        ? `${n.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`
        : n.toLocaleString('vi-VN', { maximumFractionDigits: k === 'money' ? 0 : 3 });
    return { hienThi, excel: n, sheet: n };
  }

  if (Array.isArray(gt)) {
    return chu(gt.map((x) => dinhDangOXuat(x).hienThi).filter((v) => v !== '').join(', '));
  }

  if (typeof gt === 'object') {
    try {
      return chu(JSON.stringify(gt));
    } catch {
      return chu('');
    }
  }

  // 'text': chuỗi giữ nguyên chuỗi (mã `0123` thành số là mất số 0 đầu). Số khai
  // 'text' (vd cột id) vẫn là ô số trên Excel/Sheet để sort được, chỉ csv/pdf không
  // phân cách nghìn.
  const s = String(gt);
  if (typeof gt === 'number' && Number.isFinite(gt)) return { hienThi: s, excel: gt, sheet: gt };
  return chu(s);
}

/** Mẫu số Excel cho MỘT ô — `undefined` để mặc định. */
export function mauSoExcel(kieu: KieuCotXuat | undefined, gt: OXuat['excel']): string | undefined {
  if (gt instanceof Date) return kieu === 'date' ? 'dd/mm/yyyy' : 'dd/mm/yyyy hh:mm';
  if (typeof gt !== 'number') return undefined;
  if (kieu === 'percent') return '#,##0.00"%"';
  if (kieu === 'money') return '#,##0';
  if (kieu === 'number') return Number.isInteger(gt) ? '#,##0' : '#,##0.###';
  return undefined;
}

/** Mẫu số Google Sheet cần đặt trên CỘT — serial không có mẫu thì hiện `46270`. */
export type MauSoCot = 'date' | 'datetime' | 'number' | 'money' | 'percent';

export function mauSoCotSheet<T>(
  kieu: KieuCotXuat | undefined,
  dong: readonly T[],
  doc: (row: T) => unknown
): MauSoCot | undefined {
  let k = kieu;
  if (!k) {
    // Suy theo ô CÓ giá trị đầu tiên; dừng sớm — không cần quét 50.000 dòng.
    for (const row of dong) {
      const gt = doc(row);
      if (gt === null || gt === undefined || gt === '') continue;
      k = suyKieu(gt);
      break;
    }
  }
  if (k === 'date' || k === 'datetime' || k === 'money' || k === 'percent' || k === 'number') return k;
  return undefined;
}
