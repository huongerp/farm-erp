/**
 * CSS đưa cho paged.js: `@page` theo cài đặt (khổ, hướng, lề từng cạnh, «Trang x/y», giờ in /
 * người in ở margin box) + CSS nền của khung (phông, ngắt trang bảng, ẩn logo / ô ký / tiêu đề
 * lặp) + CSS độ rộng / ẩn cột. Thuần.
 *
 * Nội dung phiếu vẫn dùng class Tailwind của app (cùng document), nhưng luật NGẮT TRANG thì
 * paged.js chỉ đọc từ stylesheet đưa vào đây — nên `break-inside-avoid` của Tailwind được khai lại.
 */
import { FONT_IN_CSS, cssPageSize, type CaiDatIn } from './cai-dat-in';
import { cssCotBang } from './cot-bang';

/** Chuỗi an toàn trong `content: "..."` của CSS. */
export function chuoiCss(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]+/g, ' ')}"`;
}

const KIEU_LE = 'font-family: Arial, Helvetica, sans-serif; font-size: 7.5pt; color: #555;';

export interface TuyChonCssTrang {
  /** Dòng góc dưới trái (giờ in · người in) — `dongChanTrai`. */
  chanTrai?: string;
  /** Chữ trước số trang (mặc định «Trang»). */
  nhanTrang?: string;
}

export function cssPage(c: CaiDatIn, tc: TuyChonCssTrang = {}): string {
  const { tren, phai, duoi, trai } = c.le;
  const hop: string[] = [];
  if (c.dauChan.soTrang) {
    hop.push(`@bottom-right { content: ${chuoiCss(`${tc.nhanTrang ?? 'Trang'} `)} counter(page) "/" counter(pages); ${KIEU_LE} }`);
  }
  if (tc.chanTrai) hop.push(`@bottom-left { content: ${chuoiCss(tc.chanTrai)}; ${KIEU_LE} }`);
  return `@page {
  size: ${cssPageSize(c.kho, c.huong)};
  margin: ${tren}mm ${phai}mm ${duoi}mm ${trai}mm;
  ${hop.join('\n  ')}
}`;
}

/** CSS nền — áp cho nội dung bên trong mỗi trang. */
export function cssNen(c: CaiDatIn): string {
  const font = c.font === 'mac-dinh' ? '' : FONT_IN_CSS[c.font];
  return `
.phieu-in-noi-dung { box-sizing: border-box; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
${font ? `.phieu-in-noi-dung, .phieu-in-noi-dung * { font-family: ${font} !important; }` : ''}
.phieu-in-lien + .phieu-in-lien, .phieu-in-tai-lieu + .phieu-in-tai-lieu { break-before: page; }
/* paged.js chỉ giữ nguyên dòng khi Ô (td/th) có break-inside: avoid — đặt ở tr thôi chưa đủ. */
.phieu-in-noi-dung tr:not([data-in-bao]), .phieu-in-noi-dung tr:not([data-in-bao]) > td, .phieu-in-noi-dung tr:not([data-in-bao]) > th { break-inside: avoid; }
.phieu-in-noi-dung thead { break-inside: avoid; break-after: avoid; }
.phieu-in-noi-dung h1, .phieu-in-noi-dung h2, .phieu-in-noi-dung h3 { break-after: avoid; }
.phieu-in-noi-dung .break-inside-avoid, .phieu-in-noi-dung [data-in-chu-ky] { break-inside: avoid; }
.phieu-in-noi-dung img { max-width: 100%; }
${c.hienLogo ? '' : '.phieu-in-noi-dung [data-in-logo] { display: none !important; }'}
${c.hienChuKy ? '' : '.phieu-in-noi-dung [data-in-chu-ky] { display: none !important; }'}
${c.dauChan.lapTieuDeBang ? '' : '.phieu-in-noi-dung thead[data-in-lap] { display: none !important; }'}
${cssCotBang(c.cot, c.anCot)}
`;
}

/**
 * Stylesheet đầy đủ cho paged.js. BỎ mọi `@import` (vd font Google): paged.js tự tải và xử lý
 * @import, gặp font Google thì không dựng ra trang nào — font nạp qua thẻ <style> ở vùng nguồn.
 */
export function cssTrangDayDu(c: CaiDatIn, tc: TuyChonCssTrang = {}, cssThem = ''): string {
  return `${cssPage(c, tc)}\n${cssNen(c)}\n${cssThem.replace(/@import\s+[^;]+;/g, '')}`;
}

/** Dòng chân trang trái theo cài đặt (rỗng nếu tắt cả hai). */
export function dongChanTrai(
  c: Pick<CaiDatIn, 'dauChan'>,
  gioIn: string,
  nguoiIn: string | null | undefined,
  nhan: { inLuc: string; nguoiIn: string } = { inLuc: 'In lúc', nguoiIn: 'Người in' }
): string {
  const phan: string[] = [];
  if (c.dauChan.gioIn) phan.push(`${nhan.inLuc} ${gioIn}`);
  if (c.dauChan.nguoiIn && nguoiIn) phan.push(`${nhan.nguoiIn}: ${nguoiIn}`);
  return phan.join(' · ');
}
