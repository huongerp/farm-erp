/**
 * Tải phiếu in về máy (PDF / DOC) từ CHÍNH bản xem trước — bố cục chỉ có một nguồn là
 * component React. Nội dung đã được React escape nên không ghép chuỗi HTML tay.
 * - PDF: chụp html2canvas từng trang paged.js đã chia (`taiPdfTuTrang`).
 * - DOC: nhân bản nội dung nguồn kèm style inline + @page (Word đọc được).
 */
import { downloadBlob } from '../download-blob';
import { kichThuocGiayIn, type HuongGiayIn, type KhoGiayIn, type LeTrang } from './cai-dat-in';

export type { HuongGiayIn, KhoGiayIn } from './cai-dat-in';

const CSS_GIU = [
  'display', 'flex-direction', 'flex', 'flex-wrap', 'justify-content', 'align-items', 'gap', 'box-sizing',
  'grid-template-columns', 'width', 'min-width', 'height', 'min-height', 'aspect-ratio', 'overflow',
  'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
  'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
  'border-top', 'border-bottom', 'border-left', 'border-right', 'border-collapse',
  'font-size', 'font-weight', 'font-style', 'font-family', 'letter-spacing', 'text-align', 'text-transform',
  'color', 'background-color', 'white-space', 'line-height', 'vertical-align', 'object-fit', 'word-break',
  // Dấu "HỦY", con dấu xoay: thiếu vị trí / transform thì rơi vào giữa dòng chảy văn bản.
  'position', 'top', 'right', 'bottom', 'left', 'z-index', 'transform', 'transform-origin', 'opacity',
  // Bề rộng cột đã kéo, ngắt mã dài, căn số; break-inside để PDF biết khối không được tách trang.
  'table-layout', 'overflow-wrap', 'font-variant-numeric', 'break-inside',
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

const pxSo = (v: string) => {
  const m = /^(-?[\d.]+)px$/.exec(v.trim());
  return m ? Number(m[1]) : null;
};

/** Ảnh / SVG giữ đúng chiều cao; phần tử khác cao theo nội dung. */
const giuCaoCoDinh = (el: Element) => el instanceof SVGElement || /^(IMG|CANVAS|VIDEO)$/.test(el.tagName);

interface TuyChonNhanBan {
  tiLeChu?: number;
  /**
   * `height` (px) thành `min-height` — bản dựng có phông / chữ xuống dòng lệch chút so với màn
   * hình vẫn không bị xén nội dung (khung bảng `overflow-x-auto` + cao cứng). Khoảng trống ký
   * (div cao cố định, rỗng) vẫn giữ nguyên.
   */
  caoTheoNoiDung?: boolean;
}

/** Chép style đã tính (Tailwind) vào `style` inline, bỏ class — dùng được ở nơi không có CSS của app. */
function nhanBanKemStyle(src: Element, dst: Element, tc: TuyChonNhanBan = {}) {
  const cs = getComputedStyle(src);
  const gian = tc.caoTheoNoiDung && !giuCaoCoDinh(src);
  const decl = CSS_GIU.map((p) => {
    const v = doiMau(cs.getPropertyValue(p));
    if (p === 'font-size') return `${p}:${nhanCoChu(v, tc.tiLeChu ?? 1)}`;
    if (gian && p === 'height') return 'height:auto';
    if (gian && p === 'min-height') {
      const cao = pxSo(cs.height);
      const toiThieu = pxSo(v) ?? 0;
      return cao != null && cao > toiThieu ? `min-height:${cao}px` : `${p}:${v}`;
    }
    return `${p}:${v}`;
  }).join(';');
  (dst as HTMLElement).setAttribute('style', decl);
  dst.removeAttribute('class');
  for (let i = 0; i < src.children.length; i++) nhanBanKemStyle(src.children[i], dst.children[i], tc);
}

/** Bản HTML độc lập của nút preview (style inline, màu rgb, ảnh URL tuyệt đối). */
function htmlDocLap(node: HTMLElement, bo?: TuyChonNhanBan & { paddingMm?: number }): string {
  const clone = node.cloneNode(true) as HTMLElement;
  nhanBanKemStyle(node, clone, bo);
  if (bo?.paddingMm != null) clone.style.padding = `${bo.paddingMm}mm`;
  clone.querySelectorAll('img').forEach((img) => img.setAttribute('src', (img as HTMLImageElement).src));
  // Lớp phủ kéo cột chỉ dùng trên màn hình.
  clone.querySelectorAll('[data-phieu-in-bo-khi-xuat]').forEach((el) => el.remove());
  return clone.outerHTML;
}

export interface ThamSoDoc {
  /** Giá trị `size` của @page, vd `A4 landscape`. */
  pageSize: string;
  le: LeTrang;
  /** Tỉ lệ cỡ chữ (Word không có zoom → nhân vào cỡ chữ đã tính). */
  tiLe?: number;
  tenFile: string;
}

/** DOC từ nội dung NGUỒN (một liên, chưa chia trang) — lề do `@page` của Word lo. */
export function taiDocTuNode(node: HTMLElement, ts: ThamSoDoc): void {
  const tiLe = ts.tiLe && ts.tiLe > 0 ? ts.tiLe : 1;
  const body = htmlDocLap(node, { paddingMm: 0, tiLeChu: tiLe });
  const { tren, phai, duoi, trai } = ts.le;
  const html = [
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">',
    '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>',
    `<style>@page{size:${ts.pageSize};margin:${tren}mm ${phai}mm ${duoi}mm ${trai}mm}body{font-family:Arial,sans-serif}</style>`,
    `</head><body>${body}</body></html>`,
  ].join('');
  downloadBlob(new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' }), `${ts.tenFile}.doc`);
}

/** Thuộc tính màu html2canvas đọc — Tailwind v4 cho ra oklch, html2canvas không hiểu. */
const THUOC_TINH_MAU = [
  'color',
  'background-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'text-decoration-color',
  'fill',
  'stroke',
];

/** Ghi màu đã đổi sang rgb vào style inline của bản sao html2canvas (duyệt song song nguồn ↔ bản sao). */
function doiMauBanSao(nguon: Element, banSao: Element) {
  const cs = getComputedStyle(nguon);
  const st = (banSao as HTMLElement).style;
  if (st) {
    for (const p of THUOC_TINH_MAU) {
      const v = cs.getPropertyValue(p);
      if (v && /okl|lab\(|lch\(|color\(/.test(v)) st.setProperty(p, doiMau(v));
    }
    const bong = cs.getPropertyValue('box-shadow');
    if (bong && bong !== 'none') st.setProperty('box-shadow', doiMau(bong));
    const nen = cs.getPropertyValue('background-image');
    if (nen && nen !== 'none' && /okl|lab\(|lch\(|color\(/.test(nen)) st.setProperty('background-image', 'none');
  }
  const n = Math.min(nguon.children.length, banSao.children.length);
  for (let i = 0; i < n; i++) doiMauBanSao(nguon.children[i], banSao.children[i]);
}

async function choAnh(el: HTMLElement, ms = 5000): Promise<void> {
  const imgs = Array.from(el.querySelectorAll('img')).filter((im) => !im.complete);
  if (imgs.length === 0) return;
  await Promise.race([
    Promise.all(
      imgs.map(
        (im) =>
          new Promise<void>((r) => {
            im.addEventListener('load', () => r(), { once: true });
            im.addEventListener('error', () => r(), { once: true });
          })
      )
    ),
    new Promise<void>((r) => setTimeout(r, ms)),
  ]);
}

type Html2Canvas = (typeof import('html2canvas'))['default'];

/** Chụp MỘT trang paged.js thành canvas (màu oklch đổi sang rgb trên bản sao, bỏ tay kéo cột). */
export async function chupTrang(t: HTMLElement, html2canvas?: Html2Canvas, scale = 2): Promise<HTMLCanvasElement> {
  const h2c = html2canvas ?? (await import('html2canvas')).default;
  await choAnh(t);
  const soTrang = t.getAttribute('data-trang') ?? '';
  return h2c(t, {
    scale,
    useCORS: true,
    logging: false,
    imageTimeout: 5000,
    backgroundColor: '#ffffff',
    width: t.offsetWidth,
    height: t.offsetHeight,
    windowWidth: t.offsetWidth,
    windowHeight: t.offsetHeight,
    onclone: (doc) => {
      const banSao = doc.querySelector(`.pagedjs_page[data-trang="${soTrang}"]`);
      if (banSao) {
        (banSao as HTMLElement).style.boxShadow = 'none';
        doiMauBanSao(t, banSao);
      }
    },
    ignoreElements: (el) => el.classList?.contains('phieu-in-tay-keo') ?? false,
  });
}

export interface ThamSoPdf {
  kho: KhoGiayIn;
  huong: HuongGiayIn;
  /** Tên file không kèm đuôi. */
  tenFile: string;
}

/**
 * PDF từ các trang paged.js đã dựng: mỗi `.pagedjs_page` = một trang PDF đúng khổ / hướng, nên
 * không bao giờ cắt đôi dòng bảng (paged.js đã ngắt theo dòng). Chụp TỪNG trang (không một ảnh
 * dài) để tránh trần canvas ~16,7 MP của iOS Safari. Tay kéo cột (`phieu-in-tay-keo`) bỏ qua.
 */
export async function taiPdfTuTrang(trang: readonly HTMLElement[], ts: ThamSoPdf): Promise<void> {
  if (trang.length === 0) throw new Error('Chưa dàn trang xong.');
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);
  const { wMm, hMm } = kichThuocGiayIn(ts.kho, ts.huong);
  const huong = ts.huong === 'ngang' ? 'l' : 'p';
  const pdf = new jsPDF({ orientation: huong, unit: 'mm', format: [Math.min(wMm, hMm), Math.max(wMm, hMm)] });
  for (let i = 0; i < trang.length; i++) {
    const canvas = await chupTrang(trang[i], html2canvas);
    if (i > 0) pdf.addPage([Math.min(wMm, hMm), Math.max(wMm, hMm)], huong);
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, wMm, hMm);
  }
  downloadBlob(pdf.output('blob'), `${ts.tenFile}.pdf`);
}
