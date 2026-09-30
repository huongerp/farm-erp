/**
 * In tem QR hàng hoá (dán lên thùng). QR chứa đúng `ma_hang_hoa` — module Đăng ký nhận hàng
 * quét mã này để ghi hàng xuất, mỗi thùng một dòng.
 * In qua iframe ẩn (không mở tab mới → không bị chặn popup trên điện thoại).
 */
import { taoQrDataUrl } from '../../../../components/shared/QrCodeImage';

export interface TemQrItem {
  ma: string;
  ten: string;
  dvt?: string | null;
}

export type CoTem = 'nho' | 'vua' | 'lon';

/** Cạnh tem (mm) theo cỡ. */
export const CO_TEM_MM: Record<CoTem, number> = { nho: 40, vua: 50, lon: 70 };

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Lặp mỗi mã `soTem` lần (mỗi thùng một tem). */
export function danhSachTem(items: TemQrItem[], soTem: number): TemQrItem[] {
  const n = Math.max(1, Math.min(500, Math.floor(soTem) || 1));
  return items.flatMap((it) => Array.from({ length: n }, () => it));
}

export function taoHtmlTem(tem: { item: TemQrItem; src: string }[], co: CoTem): string {
  const mm = CO_TEM_MM[co];
  const qr = Math.round(mm * 0.72);
  const cells = tem
    .map(
      ({ item, src }) => `<div class="tem">
  <img src="${src}" alt="" />
  <div class="ma">${esc(item.ma)}</div>
  <div class="ten">${esc(item.ten)}${item.dvt ? ` · ${esc(item.dvt)}` : ''}</div>
</div>`
    )
    .join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Tem QR</title>
<style>
  @page { margin: 6mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; }
  .luoi { display: flex; flex-wrap: wrap; gap: 2mm; }
  .tem { width: ${mm}mm; height: ${mm}mm; border: 0.2mm dashed #999; padding: 1.5mm;
         display: flex; flex-direction: column; align-items: center; justify-content: center;
         page-break-inside: avoid; break-inside: avoid; overflow: hidden; }
  .tem img { width: ${qr}mm; height: ${qr}mm; }
  .ma { font-weight: 700; font-size: ${Math.max(7, Math.round(mm / 5))}pt; margin-top: 0.5mm; letter-spacing: 0.2mm; }
  .ten { font-size: ${Math.max(5, Math.round(mm / 8))}pt; text-align: center; line-height: 1.1;
         max-height: 2.3em; overflow: hidden; }
</style></head><body><div class="luoi">
${cells}
</div></body></html>`;
}

/** Tạo QR cho từng mã (mỗi mã một lần) rồi in qua iframe ẩn. */
export async function inTemQr(items: TemQrItem[], soTem: number, co: CoTem): Promise<void> {
  const urls = new Map<string, string>();
  for (const it of items) {
    if (!urls.has(it.ma)) urls.set(it.ma, await taoQrDataUrl(it.ma, 400, 1));
  }
  const html = taoHtmlTem(
    danhSachTem(items, soTem).map((item) => ({ item, src: urls.get(item.ma)! })),
    co
  );

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  await new Promise<void>((resolve) => {
    const imgs = Array.from(doc.images);
    let con = imgs.length;
    if (con === 0) return resolve();
    const xong = () => --con <= 0 && resolve();
    imgs.forEach((im) => (im.complete ? xong() : im.addEventListener('load', xong, { once: true })));
  });
  win.focus();
  win.print();
  setTimeout(() => iframe.remove(), 60_000);
}

/** Tải ảnh QR (PNG) của một mã. */
export async function taiQrPng(ma: string): Promise<void> {
  const url = await taoQrDataUrl(ma, 600, 2);
  const a = document.createElement('a');
  a.href = url;
  a.download = `QR-${ma}.png`;
  a.click();
}
