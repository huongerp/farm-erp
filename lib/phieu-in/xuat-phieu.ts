/**
 * Tải phiếu in về máy (PDF / DOC) từ CHÍNH nút preview đang hiển thị — bố cục chỉ có một
 * nguồn là component React. Nội dung đã được React escape nên không ghép chuỗi HTML tay.
 * - PDF: nhân bản nút kèm style đã tính vào iframe trống, chụp html2canvas, cắt theo trang.
 * - DOC: nhân bản nút kèm style inline + @page (Word đọc được).
 */

export type KhoGiayIn = 'a4' | 'a5';
export type HuongGiayIn = 'doc' | 'ngang';

export function taiVe(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const CSS_GIU = [
  'display', 'flex-direction', 'flex', 'flex-wrap', 'justify-content', 'align-items', 'gap', 'box-sizing',
  'grid-template-columns', 'width', 'min-width', 'height', 'min-height', 'aspect-ratio', 'overflow',
  'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
  'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
  'border-top', 'border-bottom', 'border-left', 'border-right', 'border-collapse',
  'font-size', 'font-weight', 'font-style', 'font-family', 'letter-spacing', 'text-align', 'text-transform',
  'color', 'background-color', 'white-space', 'line-height', 'vertical-align', 'object-fit', 'word-break',
];

/**
 * Màu CSS hiện đại (oklch/oklab của Tailwind v4) → `rgb()`. html2canvas và Word đều
 * không đọc được oklch — thiếu bước này thì PDF lỗi hẳn, DOC mất màu.
 */
const cacheMau = new Map<string, string>();
let ctxMau: CanvasRenderingContext2D | null = null;
function sangRgb(mau: string): string {
  const hit = cacheMau.get(mau);
  if (hit) return hit;
  ctxMau ??= Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', {
    willReadFrequently: true,
  });
  if (!ctxMau) return mau;
  ctxMau.clearRect(0, 0, 1, 1);
  ctxMau.fillStyle = '#000';
  ctxMau.fillStyle = mau;
  ctxMau.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctxMau.getImageData(0, 0, 1, 1).data;
  const out = a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
  cacheMau.set(mau, out);
  return out;
}
const doiMau = (v: string) => v.replace(/\b(?:oklch|oklab|lch|lab|color)\([^()]*\)/g, sangRgb);

/** Nhân cỡ chữ đã tính (`13.3333px`) theo tỉ lệ — bản DOC không có `zoom`. */
function nhanCoChu(v: string, tiLe: number): string {
  if (tiLe === 1) return v;
  const m = /^([\d.]+)px$/.exec(v.trim());
  return m ? `${(Number(m[1]) * tiLe).toFixed(2)}px` : v;
}

/** Chép style đã tính (Tailwind) vào `style` inline, bỏ class — dùng được ở nơi không có CSS của app. */
function nhanBanKemStyle(src: Element, dst: Element, tiLeChu = 1) {
  const cs = getComputedStyle(src);
  const decl = CSS_GIU.map((p) => {
    const v = doiMau(cs.getPropertyValue(p));
    return `${p}:${p === 'font-size' ? nhanCoChu(v, tiLeChu) : v}`;
  }).join(';');
  (dst as HTMLElement).setAttribute('style', decl);
  dst.removeAttribute('class');
  for (let i = 0; i < src.children.length; i++) nhanBanKemStyle(src.children[i], dst.children[i], tiLeChu);
}

/** Bản HTML độc lập của nút preview (style inline, màu rgb, ảnh URL tuyệt đối). */
function htmlDocLap(node: HTMLElement, bo?: { paddingMm?: number; tiLeChu?: number }): string {
  const clone = node.cloneNode(true) as HTMLElement;
  nhanBanKemStyle(node, clone, bo?.tiLeChu);
  if (bo?.paddingMm != null) clone.style.padding = `${bo.paddingMm}mm`;
  clone.querySelectorAll('img').forEach((img) => img.setAttribute('src', (img as HTMLImageElement).src));
  // Lớp phủ kéo cột chỉ dùng trên màn hình.
  clone.querySelectorAll('[data-phieu-in-bo-khi-xuat]').forEach((el) => el.remove());
  return clone.outerHTML;
}

/**
 * Đọc nút ở trạng thái "không zoom", bề rộng `rongMm` — cỡ chữ của khung in làm bằng CSS
 * `zoom`, html2canvas / Word không hiểu `zoom` nên phải dựng bản phẳng. Đổi style rồi trả
 * lại ngay trong cùng một tick nên màn hình không nháy.
 */
function docKhongZoom<T>(node: HTMLElement, rongMm: number, doc: () => T): T {
  const zoom = node.style.zoom;
  const width = node.style.width;
  node.style.zoom = '1';
  node.style.width = `${rongMm}mm`;
  try {
    return doc();
  } finally {
    node.style.zoom = zoom;
    node.style.width = width;
  }
}

export interface ThamSoPdf {
  kho: KhoGiayIn;
  huong: HuongGiayIn;
  /** Khổ giấy (mm) theo hướng. */
  wMm: number;
  hMm: number;
  /** Lề trang (mm) — áp cho MỌI trang, nội dung tràn trang sau vẫn chừa lề. */
  leMm: number;
  /** Tỉ lệ cỡ chữ (zoom của khung in), 1 = như thiết kế. */
  tiLe?: number;
  /** Tên file không kèm đuôi. */
  tenFile: string;
}

/**
 * PDF đúng khổ / hướng: dựng bản độc lập trong iframe trống, chụp html2canvas rồi cắt theo trang.
 * `node` là phần NỘI DUNG (không gồm lề). Cỡ chữ: dựng bản rộng `nội dung / tiLe` rồi co ảnh
 * về đúng bề rộng nội dung — cùng hiệu ứng với `zoom` trên màn hình.
 */
export async function taiPdfTuNode(node: HTMLElement, ts: ThamSoPdf): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);
  const { wMm, hMm, leMm } = ts;
  const tiLe = ts.tiLe && ts.tiLe > 0 ? ts.tiLe : 1;
  const rongNoiDung = wMm - 2 * leMm;
  const caoNoiDung = hMm - 2 * leMm;
  const rongDung = rongNoiDung / tiLe;
  const body = docKhongZoom(node, rongDung, () => htmlDocLap(node));

  const iframe = document.createElement('iframe');
  iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${rongDung}mm;height:${hMm}mm;border:0;visibility:hidden`;
  iframe.srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box}body{margin:0;background:#fff}</style></head><body>${body}</body></html>`;
  document.body.appendChild(iframe);
  try {
    await new Promise<void>((ok, fail) => {
      iframe.onload = () => ok();
      iframe.onerror = () => fail(new Error('iframe load failed'));
    });
    const doc = iframe.contentDocument;
    const root = doc?.body.firstElementChild as HTMLElement | null;
    if (!doc || !root) throw new Error('iframe body not available');
    // Chờ ảnh tải xong (lỗi cũng bỏ qua) để PDF không thiếu ảnh.
    await Promise.all(
      Array.from(doc.images).map((im) =>
        im.complete
          ? null
          : new Promise<void>((r) => {
              im.addEventListener('load', () => r(), { once: true });
              im.addEventListener('error', () => r(), { once: true });
            })
      )
    );
    iframe.style.height = `${root.scrollHeight}px`;
    const canvas = await html2canvas(root, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });

    const huong = ts.huong === 'ngang' ? 'l' : 'p';
    const pdf = new jsPDF({ orientation: huong, unit: 'mm', format: ts.kho });
    const img = canvas.toDataURL('image/jpeg', 0.92);
    const hAnh = (canvas.height / canvas.width) * rongNoiDung;
    // Nội dung dài hơn trang chỉ vì sai số làm tròn thì không sinh trang trắng.
    const soTrang = Math.max(1, Math.ceil((hAnh - 1) / caoNoiDung));
    pdf.setFillColor(255, 255, 255);
    for (let i = 0; i < soTrang; i++) {
      if (i > 0) pdf.addPage(ts.kho, huong);
      pdf.addImage(img, 'JPEG', leMm, leMm - i * caoNoiDung, rongNoiDung, hAnh);
      // Ảnh dài vẽ tràn qua lề trên / dưới — phủ trắng để trang nào cũng đủ lề.
      pdf.rect(0, 0, wMm, leMm, 'F');
      pdf.rect(0, hMm - leMm, wMm, leMm, 'F');
    }
    taiVe(pdf.output('blob'), `${ts.tenFile}.pdf`);
  } finally {
    iframe.remove();
  }
}

export interface ThamSoDoc {
  /** Giá trị `size` của @page, vd `A4 landscape`. */
  pageSize: string;
  /** Bề rộng giấy (mm) theo hướng. */
  wMm: number;
  leMm: number;
  tiLe?: number;
  tenFile: string;
}

export function taiDocTuNode(node: HTMLElement, ts: ThamSoDoc): void {
  const tiLe = ts.tiLe && ts.tiLe > 0 ? ts.tiLe : 1;
  // Lề đã do @page lo — `node` là phần nội dung. Word không có zoom → nhân cỡ chữ.
  const body = docKhongZoom(node, ts.wMm - 2 * ts.leMm, () => htmlDocLap(node, { paddingMm: 0, tiLeChu: tiLe }));
  const html = [
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">',
    '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>',
    `<style>@page{size:${ts.pageSize};margin:${ts.leMm}mm}body{font-family:Arial,sans-serif}</style>`,
    `</head><body>${body}</body></html>`,
  ].join('');
  taiVe(new Blob(['﻿' + html], { type: 'application/msword;charset=utf-8' }), `${ts.tenFile}.doc`);
}
