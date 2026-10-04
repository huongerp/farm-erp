/**
 * Định dạng ô nhập số NGAY KHI GÕ theo vi-VN: `.` phân tách hàng nghìn, `,` thập phân.
 * Thuần — `components/ui/NumberInput.tsx` gọi rồi tự đặt lại con trỏ.
 *
 * Dấu `.` người dùng gõ / dán coi là phân tách hàng nghìn (khớp `parseFormattedNumber`).
 */
export interface DinhDangKhiGoOptions {
  /** Số chữ số thập phân tối đa; 0 = không cho nhập phần thập phân. */
  maxFractionDigits: number;
  /** Cho phép dấu `-` đứng đầu. */
  allowNegative: boolean;
}

export interface KetQuaDinhDang {
  text: string;
  /** Vị trí con trỏ mới trong `text`. */
  caret: number;
}

const DAU_THAP_PHAN = ',';
const DAU_NGHIN = '.';

/** Nhóm chuỗi chữ số phần nguyên: "1250000" → "1.250.000". */
function nhomNghin(soNguyen: string): string {
  return soNguyen.replace(/\B(?=(\d{3})+(?!\d))/g, DAU_NGHIN);
}

/** Số "ký tự có nghĩa" (chữ số, dấu thập phân, dấu âm) đứng trước vị trí `caret`. */
function demKyTuCoNghia(s: string, caret: number): number {
  let n = 0;
  for (let i = 0; i < Math.min(caret, s.length); i++) {
    if (/[\d,-]/.test(s[i])) n++;
  }
  return n;
}

export function dinhDangKhiGo(raw: string, caret: number, opts: DinhDangKhiGoOptions): KetQuaDinhDang {
  // 1. Lọc ký tự: chữ số, một dấu `,` đầu tiên (nếu cho thập phân), `-` ở đầu (nếu cho âm).
  let am = false;
  let daCoThapPhan = false;
  let sach = '';
  let sachTruocCaret = 0;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    let giu = false;
    if (/\d/.test(c)) giu = true;
    else if (c === DAU_THAP_PHAN && opts.maxFractionDigits > 0 && !daCoThapPhan) {
      daCoThapPhan = true;
      giu = true;
    } else if (c === '-' && opts.allowNegative && sach === '' && !am) {
      am = true;
      giu = true;
    }
    if (giu) {
      sach += c;
      if (i < caret) sachTruocCaret++;
    }
  }

  // 2. Tách phần nguyên / thập phân; bỏ số 0 thừa đầu phần nguyên ("007" → "7", "0,5" giữ).
  const body = am ? sach.slice(1) : sach;
  const viTriPhay = body.indexOf(DAU_THAP_PHAN);
  let nguyen = viTriPhay >= 0 ? body.slice(0, viTriPhay) : body;
  let thapPhan = viTriPhay >= 0 ? body.slice(viTriPhay + 1) : null;
  const truocKhiBo0 = nguyen.length;
  nguyen = nguyen.replace(/^0+(?=\d)/, '');
  const so0DaBo = truocKhiBo0 - nguyen.length;
  if (thapPhan != null && thapPhan.length > opts.maxFractionDigits) {
    thapPhan = thapPhan.slice(0, opts.maxFractionDigits);
  }

  const text =
    (am ? '-' : '') +
    (nguyen === '' && thapPhan != null ? '0' : nhomNghin(nguyen)) +
    (thapPhan != null ? DAU_THAP_PHAN + thapPhan : '');

  // 3. Đặt con trỏ sau đúng số ký tự có nghĩa như trước khi định dạng.
  // Số 0 bị bỏ đều nằm đầu phần nguyên → chỉ trừ những số 0 đứng trước con trỏ.
  const chuSoTruocCaret = sachTruocCaret - (am && sachTruocCaret > 0 ? 1 : 0);
  let canDat = sachTruocCaret - Math.min(so0DaBo, chuSoTruocCaret);
  if (nguyen === '' && thapPhan != null) canDat += 1; // đã chèn "0" trước dấu phẩy
  let moi = 0;
  while (moi < text.length && demKyTuCoNghia(text, moi) < canDat) moi++;
  return { text, caret: moi };
}
