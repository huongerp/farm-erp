/**
 * Tải phiếu in về máy: PDF / DOC / XLSX. Bố cục chỉ có MỘT nguồn là component preview
 * đang hiển thị — PDF chụp chính nút đó, DOC nhân bản nút đó kèm style đã tính.
 */
import type { TFunction } from 'i18next';
import type { DangKyNhanHang } from '../core/types';
import type { NhomHangHoa } from '../core/gop-hang-hoa';
import {
  cssPageSize,
  kichThuocGiay,
  leTrang,
  taoSheetXlsx,
  tenFileIn,
  type ThamSoIn,
} from '../core/mau-in';

export type DinhDangTai = 'pdf' | 'doc' | 'xlsx';

function taiVe(blob: Blob, name: string) {
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

/** Chép style đã tính (Tailwind) vào `style` inline, bỏ class — dùng được ở nơi không có CSS của app. */
function nhanBanKemStyle(src: Element, dst: Element) {
  const cs = getComputedStyle(src);
  const decl = CSS_GIU.map((p) => `${p}:${doiMau(cs.getPropertyValue(p))}`).join(';');
  (dst as HTMLElement).setAttribute('style', decl);
  dst.removeAttribute('class');
  for (let i = 0; i < src.children.length; i++) nhanBanKemStyle(src.children[i], dst.children[i]);
}

/** Bản HTML độc lập của nút preview (style inline, màu rgb, ảnh URL tuyệt đối). */
function htmlDocLap(node: HTMLElement, bo?: { paddingMm?: number }): string {
  const clone = node.cloneNode(true) as HTMLElement;
  nhanBanKemStyle(node, clone);
  if (bo?.paddingMm != null) clone.style.padding = `${bo.paddingMm}mm`;
  clone.querySelectorAll('img').forEach((img) => img.setAttribute('src', (img as HTMLImageElement).src));
  return clone.outerHTML;
}

/** PDF đúng khổ / hướng: dựng bản độc lập trong iframe trống, chụp html2canvas rồi cắt theo trang. */
export async function taiPdf(node: HTMLElement, phieu: DangKyNhanHang, ts: ThamSoIn): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);
  const { wMm, hMm } = kichThuocGiay(ts.kho, ts.huong);
  const body = htmlDocLap(node);

  const iframe = document.createElement('iframe');
  iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${wMm}mm;height:${hMm}mm;border:0;visibility:hidden`;
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
    const hAnh = (canvas.height / canvas.width) * wMm;
    // Nội dung dài hơn trang chỉ vì sai số làm tròn thì không sinh trang trắng.
    const soTrang = Math.max(1, Math.ceil((hAnh - 1) / hMm));
    for (let i = 0; i < soTrang; i++) {
      if (i > 0) pdf.addPage(ts.kho, huong);
      pdf.addImage(img, 'JPEG', 0, -i * hMm, wMm, hAnh);
    }
    taiVe(pdf.output('blob'), `${tenFileIn(ts.loai, phieu)}.pdf`);
  } finally {
    iframe.remove();
  }
}

export function taiDoc(node: HTMLElement, phieu: DangKyNhanHang, ts: ThamSoIn): void {
  // Lề đã do @page lo — bỏ padding của tờ giấy trên màn hình.
  const body = htmlDocLap(node, { paddingMm: 0 });
  const html = [
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">',
    '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>',
    `<style>@page{size:${cssPageSize(ts.kho, ts.huong)};margin:${leTrang(ts.kho)}mm}body{font-family:Arial,sans-serif}</style>`,
    `</head><body>${body}</body></html>`,
  ].join('');
  taiVe(new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' }), `${tenFileIn(ts.loai, phieu)}.doc`);
}

export async function taiXlsx(phieu: DangKyNhanHang, nhom: NhomHangHoa[], ts: ThamSoIn, t: TFunction): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const sheets = taoSheetXlsx(ts.loai, phieu, nhom, (k) => t(`dangKyNhanHang.${k}`));
  sheets.forEach((sh, i) => {
    const ws = XLSX.utils.aoa_to_sheet(sh.dong);
    ws['!cols'] =
      i === 0 ? [{ wch: 24 }, { wch: 44 }] : [{ wch: 6 }, { wch: 16 }, { wch: 34 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, sh.ten.slice(0, 31));
  });
  XLSX.writeFile(wb, `${tenFileIn(ts.loai, phieu)}.xlsx`);
}
