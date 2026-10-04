/**
 * Luật thuần cho việc ghi Google Sheet — không gọi mạng, không chạm DB, có test cạnh file.
 */

/** Ô hợp lệ gửi lên Sheet với `valueInputOption=RAW`: chữ, số hữu hạn, hoặc rỗng. */
export type OSheet = string | number;

/** Mẫu số đặt trên CỘT — khớp `MauSoCot` ở `lib/export/dinh-dang-o.ts` phía client. */
export type MauSoCot = 'date' | 'datetime' | 'number' | 'money' | 'percent';

export type CheDoGhi = 'ghi_de' | 'ghi_them';

/** Giới hạn một lần xuất — Sheet tối đa 10 triệu ô, chừa xa cho tab khác trong file. */
export const GIOI_HAN = {
  soDong: 50_000,
  soCot: 200,
  soO: 2_000_000,
  /** Google giới hạn ~60 lệnh ghi/phút/người; lô to để ít lệnh, nhỏ đủ để body < 10MB. */
  loGhi: 4_000,
} as const;

/** 1 → A, 26 → Z, 27 → AA. */
export function cotChu(n: number): string {
  let s = '';
  let x = n;
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

/** `Bảng 'A'` → `'Bảng ''A'''!A1:C3` — luôn bọc nháy để tên có dấu cách/ký tự lạ không vỡ range. */
export function vungA1(tenTab: string, vung?: string): string {
  const tab = `'${tenTab.replace(/'/g, "''")}'`;
  return vung ? `${tab}!${vung}` : tab;
}

/** Bỏ ký tự điều khiển (xuống dòng, tab…) — Google từ chối chúng trong tên tab/file. */
function boKyTuDieuKhien(s: string): string {
  return Array.from(s)
    .filter((ch) => ch.charCodeAt(0) >= 32)
    .join('');
}

/** Tên tab Google: không rỗng, ≤ 100 ký tự, không chứa ký tự Google cấm trong range. */
export function chuanHoaTenTab(ten: string | undefined | null): string | null {
  const t = boKyTuDieuKhien(ten ?? '').trim();
  if (t === '' || t.length > 100) return null;
  return t;
}

export function chuanHoaTenFile(ten: string | undefined | null): string | null {
  const t = boKyTuDieuKhien(ten ?? '').trim();
  if (t === '' || t.length > 200) return null;
  return t;
}

/** Cắt mảng thành lô `kichThuoc` phần tử. */
export function chiaLo<T>(ds: readonly T[], kichThuoc: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < ds.length; i += kichThuoc) out.push(ds.slice(i, i + kichThuoc));
  return out;
}

export interface YeuCauXuat {
  dich:
    | { loai: 'moi'; tenFile: string; tenTab: string }
    | { loai: 'co_san'; spreadsheetId: string; tenTab: string };
  cheDo: CheDoGhi;
  header: string[];
  rows: OSheet[][];
  mauSo: (MauSoCot | null)[];
}

const MAU_SO_HOP_LE = new Set<MauSoCot>(['date', 'datetime', 'number', 'money', 'percent']);
const LA_SPREADSHEET_ID = /^[A-Za-z0-9_-]{20,100}$/;

/**
 * Kiểm body `POST /xuat-ngay`. Trả thông điệp lỗi tiếng Việt hoặc yêu cầu đã chuẩn hoá.
 * Chặn ở server dù client đã chặn: ô object/NaN mà lọt lên là Google trả 400 giữa chừng,
 * ghi được nửa file.
 */
export function kiemTraYeuCauXuat(body: unknown): { loi: string } | { ok: YeuCauXuat } {
  if (!body || typeof body !== 'object') return { loi: 'Dữ liệu gửi lên không hợp lệ.' };
  const b = body as Record<string, unknown>;

  const d = b.dich as Record<string, unknown> | undefined;
  let dich: YeuCauXuat['dich'];
  if (d?.loai === 'moi') {
    const tenFile = chuanHoaTenFile(d.tenFile as string);
    const tenTab = chuanHoaTenTab(d.tenTab as string);
    if (!tenFile) return { loi: 'Tên file không hợp lệ.' };
    if (!tenTab) return { loi: 'Tên tab không hợp lệ (1–100 ký tự).' };
    dich = { loai: 'moi', tenFile, tenTab };
  } else if (d?.loai === 'co_san') {
    const id = String(d.spreadsheetId ?? '');
    const tenTab = chuanHoaTenTab(d.tenTab as string);
    if (!LA_SPREADSHEET_ID.test(id)) return { loi: 'Mã file Google Sheet không hợp lệ.' };
    if (!tenTab) return { loi: 'Tên tab không hợp lệ (1–100 ký tự).' };
    dich = { loai: 'co_san', spreadsheetId: id, tenTab };
  } else {
    return { loi: 'Chưa chọn nơi xuất (file mới hoặc file có sẵn).' };
  }

  const cheDo = b.cheDo === 'ghi_them' ? 'ghi_them' : b.cheDo === 'ghi_de' ? 'ghi_de' : null;
  if (!cheDo) return { loi: 'Chế độ ghi không hợp lệ.' };

  if (!Array.isArray(b.header) || b.header.length === 0) return { loi: 'Thiếu dòng tiêu đề.' };
  if (b.header.length > GIOI_HAN.soCot) return { loi: `Tối đa ${GIOI_HAN.soCot} cột.` };
  const header = b.header.map((h) => String(h ?? ''));
  const soCot = header.length;

  if (!Array.isArray(b.rows)) return { loi: 'Thiếu dữ liệu.' };
  if (b.rows.length > GIOI_HAN.soDong) {
    return { loi: `Tối đa ${GIOI_HAN.soDong.toLocaleString('vi-VN')} dòng mỗi lần xuất — hãy lọc bớt.` };
  }
  if (b.rows.length * soCot > GIOI_HAN.soO) return { loi: 'Dữ liệu quá lớn cho một lần xuất — hãy lọc bớt.' };

  const rows: OSheet[][] = [];
  for (let i = 0; i < b.rows.length; i++) {
    const r = b.rows[i];
    if (!Array.isArray(r) || r.length !== soCot) return { loi: `Dòng ${i + 1} không khớp số cột.` };
    for (const o of r) {
      const hopLe = typeof o === 'string' || (typeof o === 'number' && Number.isFinite(o));
      if (!hopLe) return { loi: `Dòng ${i + 1} có ô không hợp lệ.` };
    }
    rows.push(r as OSheet[]);
  }

  const mauSoVao = Array.isArray(b.mauSo) ? b.mauSo : [];
  const mauSo = header.map((_, i) => {
    const m = mauSoVao[i];
    return typeof m === 'string' && MAU_SO_HOP_LE.has(m as MauSoCot) ? (m as MauSoCot) : null;
  });

  return { ok: { dich, cheDo, header, rows, mauSo } };
}

export interface LechHeader {
  thieu: string[];
  thua: string[];
  doiThuTu: boolean;
}

/**
 * So header đang có trên tab với header sắp ghi thêm. Ghi thêm vào tab lệch cột là
 * dữ liệu rơi sai cột — báo cho người dùng chứ không tự sửa tab của họ.
 * Tab trống (chưa có header) → null.
 */
export function soKhopHeader(cu: readonly string[], moi: readonly string[]): LechHeader | null {
  const a = cu.map((x) => x.trim());
  while (a.length > 0 && a[a.length - 1] === '') a.pop();
  if (a.length === 0) return null;
  const setCu = new Set(a);
  const setMoi = new Set(moi);
  const thieu = moi.filter((h) => !setCu.has(h));
  const thua = a.filter((h) => !setMoi.has(h));
  const doiThuTu = thieu.length === 0 && thua.length === 0 && a.some((h, i) => h !== moi[i]);
  if (thieu.length === 0 && thua.length === 0 && !doiThuTu) return null;
  return { thieu, thua, doiThuTu };
}

/** `numberFormat` của Sheets API cho từng mẫu số. `number` để Google tự hiển thị. */
export function dinhDangSoSheet(mau: MauSoCot): { type: string; pattern: string } | null {
  switch (mau) {
    case 'date':
      return { type: 'DATE', pattern: 'dd/mm/yyyy' };
    case 'datetime':
      return { type: 'DATE_TIME', pattern: 'dd/mm/yyyy hh:mm' };
    case 'money':
      return { type: 'NUMBER', pattern: '#,##0' };
    case 'percent':
      return { type: 'NUMBER', pattern: '#,##0.00"%"' };
    default:
      return null;
  }
}
