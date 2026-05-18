/**
 * Xuất phiếu kiểm kê kho đợt ra PDF/DOC/XLSX.
 *
 * - PDF : html2canvas qua jsPDF (font tiếng Việt theo trình duyệt).
 * - DOC : HTML table-based (Word-safe) + UTF-8 BOM + Times New Roman.
 * - XLSX: SheetJS aoa_to_sheet (Unicode gốc, Excel mở đúng).
 *
 * Dùng chung builders từ kkk-preview-layout.ts để nội dung khớp với React preview.
 */
import type { DotKiemKeKho, ChiTietKiemKeKho } from '../core/types';
import { formatDate, formatDateTime, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';
import { getTrangThaiDotLabel } from '../core/constants';
import {
  getKiemKeKhoChiTietStats,
  buildKiemKeKhoStatsText,
  buildKiemKeKhoDetailTableHTML,
  buildKiemKeKhoSignFooterHTML,
  buildKiemKeKhoDotInfoTableHTML,
  getKiemKeKhoPreviewSignLabels,
  getKiemKeKhoVariance,
} from '../core/kkk-preview-layout';

const FONT = "Arial, 'Helvetica Neue', sans-serif";
const FONT_DOC = "'Times New Roman', Times, serif";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function safeText(v: string | number | null | undefined): string {
  if (v == null || v === '') return '—';
  return String(v);
}

function escapeHtml(v: string | number | null | undefined): string {
  return safeText(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildCompanyHeaderHTML(font = FONT): string {
  const info = useUIStore.getState().companyInfo;
  const logoHtml = info.appLogo
    ? `<img src="${info.appLogo}" alt="Logo" style="width:64px;height:64px;object-fit:contain;flex-shrink:0" />`
    : '';
  const addr = info.address ? `${i18n.t('company.address')}: ${info.address}` : '';
  const contact: string[] = [];
  if (info.email) contact.push(`${i18n.t('company.email')}: ${info.email}`);
  if (info.phone) contact.push(`${i18n.t('company.phone')}: ${info.phone}`);
  const contactLine = contact.join(' · ');
  return `
<div style="display:flex;align-items:flex-start;gap:16px;padding-bottom:16px;margin-bottom:16px;border-bottom:2px solid #333;font-family:${font}">
  ${logoHtml}
  <div style="flex:1;min-width:0">
    <div style="font-size:14pt;font-weight:bold;color:#111;text-transform:uppercase;letter-spacing:0.02em">${escapeHtml(info.companyName)}</div>
    ${addr ? `<p style="font-size:9pt;color:#444;margin:2px 0 0 0">${escapeHtml(addr)}</p>` : ''}
    ${contactLine ? `<p style="font-size:9pt;color:#444;margin:2px 0 0 0">${escapeHtml(contactLine)}</p>` : ''}
  </div>
</div>`;
}

/** Print/DOC CSS chung — thead lặp, hàng không cắt. */
const PRINT_TABLE_STYLE = `
  thead { display: table-header-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  .sign-footer { break-inside: avoid; page-break-inside: avoid; }
`;

function getFileName(dot: DotKiemKeKho): string {
  const slug = `${dot.ma_dot}_${dot.ten_dot}`.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Phieu_kiem_ke_kho_${slug}_${getTodayISODate()}`;
}

/* ------------------------------------------------------------------ */
/*  HTML body (dùng chung PDF + DOC)                                   */
/* ------------------------------------------------------------------ */

/**
 * Lề tài liệu — khớp preview React và @page khi in.
 * T:15mm  R:15mm  B:15mm  L:20mm (chuẩn "trái 2cm, còn lại 1.5cm")
 */
const DOC_PADDING = '15mm 15mm 15mm 20mm';

function buildPhieuKiemKeKhoBodyHTML(dot: DotKiemKeKho, chiTiet: ChiTietKiemKeKho[], font = FONT): string {
  const t = i18n.t.bind(i18n);
  const title = t('kiemKeKho.preview.title');
  const printedAt = formatDateTime(new Date());
  const subtitle = `${escapeHtml(dot.ma_dot)} · ${escapeHtml(dot.ten_dot)} · ${escapeHtml(getTrangThaiDotLabel(dot.trang_thai, t))}`;
  const stats = getKiemKeKhoChiTietStats(chiTiet);
  const statsLine = escapeHtml(buildKiemKeKhoStatsText(stats, t));

  const infoTableHtml = buildKiemKeKhoDotInfoTableHTML(dot, t, font);
  const detailSectionHtml =
    chiTiet.length > 0
      ? `<h2 style="font-size:11pt;margin:16px 0 8px;font-family:${font}">${escapeHtml(t('kiemKeKho.chiTietSection'))}</h2>${buildKiemKeKhoDetailTableHTML(chiTiet, t, font)}`
      : `<p style="font-size:10pt;color:#666;font-style:italic;font-family:${font}">${escapeHtml(t('kiemKeKho.chiTietEmpty'))}</p>`;
  const signFooterHtml = buildKiemKeKhoSignFooterHTML(t, font);

  return `
<div style="font-family:${font};font-size:10pt;color:#222;padding:${DOC_PADDING};min-width:600px;background:#fff;box-sizing:border-box">
${buildCompanyHeaderHTML(font)}
<h1 style="font-size:16pt;text-align:center;margin:0 0 8px;font-family:${font};text-transform:uppercase">${escapeHtml(title)}</h1>
<p style="font-size:10pt;color:#555;text-align:center;margin-bottom:12px;font-family:${font}">${subtitle}</p>
<hr style="border:0;border-top:1px solid #ccc;margin:12px 0" />
${infoTableHtml}
<p style="font-size:9pt;color:#555;margin:10px 0 0;font-family:${font}">${statsLine}</p>
${detailSectionHtml}
${signFooterHtml}
<p style="font-size:7pt;color:#888;margin-top:20px;border-top:1px solid #e5e7eb;padding-top:8px;font-family:${font}">${escapeHtml(t('kiemKeKho.preview.printedAt'))} ${escapeHtml(printedAt)}</p>
</div>`;
}

/* ------------------------------------------------------------------ */
/*  Export: PDF                                                        */
/* ------------------------------------------------------------------ */

export async function exportPhieuKiemKeKhoToPDF(
  dot: DotKiemKeKho,
  chiTiet: ChiTietKiemKeKho[]
): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const bodyContent = buildPhieuKiemKeKhoBodyHTML(dot, chiTiet);
  const fullHtml = [
    '<!DOCTYPE html><html><head><meta charset="UTF-8">',
    `<style>
      *{box-sizing:border-box}
      body{margin:0;padding:0;background:#fff;color:#222;font-family:${FONT};font-size:10pt}
      img{max-width:100%}
      ${PRINT_TABLE_STYLE}
    </style></head><body>`,
    bodyContent,
    '</body></html>',
  ].join('');

  const iframe = document.createElement('iframe');
  iframe.setAttribute('srcdoc', fullHtml);
  // Không đặt height cố định để iframe có thể mở rộng theo nội dung
  iframe.style.cssText = 'position:fixed;left:0;top:0;width:794px;border:0;z-index:-1;visibility:hidden';
  document.body.appendChild(iframe);

  await new Promise<void>((resolve, reject) => {
    iframe.onload = () => resolve();
    iframe.onerror = () => reject(new Error('iframe load failed'));
  });
  // Chờ fonts/images render
  await new Promise((r) => setTimeout(r, 300));

  try {
    const docEl = iframe.contentDocument?.body;
    if (!docEl) throw new Error('iframe body not available');

    // Đặt chiều cao iframe khớp với scrollHeight để html2canvas đủ canvas
    const scrollH = docEl.scrollHeight;
    iframe.style.height = `${scrollH + 20}px`;
    await new Promise((r) => setTimeout(r, 100));

    const canvas = await html2canvas(docEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      height: scrollH,
      windowHeight: scrollH,
    });
    if (iframe.parentNode) document.body.removeChild(iframe);

    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    // Lề do content tự chứa (padding: 15mm 15mm 15mm 20mm trong HTML body).
    // jsPDF đặt ảnh từ (0,0) rộng đúng khổ A4 — không cần margin riêng.
    const pageW = 210;
    const pageH = 297;

    const pxToMm = 25.4 / 96;
    // canvas.width ở scale:2 → chia 2 để ra pixel ở 96dpi → nhân pxToMm → mm
    const imgWmm = (canvas.width / 2) * pxToMm;
    const imgHmm = (canvas.height / 2) * pxToMm;
    // Scale ảnh vừa đúng khổ A4 ngang
    const scale = pageW / imgWmm;
    const scaledH = imgHmm * scale;

    let remaining = scaledH;
    let srcY = 0;

    doc.addImage(imgData, 'PNG', 0, 0, pageW, scaledH);
    remaining -= pageH;

    while (remaining > 0) {
      srcY += pageH;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, -srcY, pageW, scaledH);
      remaining -= pageH;
    }

    download(doc.output('blob'), `${getFileName(dot)}.pdf`);
  } finally {
    if (iframe.parentNode) document.body.removeChild(iframe);
  }
}

/* ------------------------------------------------------------------ */
/*  Export: DOC                                                        */
/* ------------------------------------------------------------------ */

function buildDocHTML(dot: DotKiemKeKho, chiTiet: ChiTietKiemKeKho[]): string {
  const body = buildPhieuKiemKeKhoBodyHTML(dot, chiTiet, FONT_DOC);
  return [
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">',
    '<head>',
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>',
    `<style>
      @page { size: A4; margin: 0; }
      body,td,th,p { font-family:${FONT_DOC};font-size:11pt; }
      ${PRINT_TABLE_STYLE}
    </style>`,
    '</head>',
    `<body style="font-family:${FONT_DOC};margin:0">${body}</body>`,
    '</html>',
  ].join('');
}

export async function exportPhieuKiemKeKhoToDoc(
  dot: DotKiemKeKho,
  chiTiet: ChiTietKiemKeKho[]
): Promise<void> {
  download(
    new Blob(['\ufeff' + buildDocHTML(dot, chiTiet)], { type: 'application/msword;charset=utf-8' }),
    `${getFileName(dot)}.doc`,
  );
}

/* ------------------------------------------------------------------ */
/*  Export: XLSX                                                       */
/* ------------------------------------------------------------------ */

export async function exportPhieuKiemKeKhoToXLSX(
  dot: DotKiemKeKho,
  chiTiet: ChiTietKiemKeKho[]
): Promise<void> {
  const XLSX = await import('xlsx');
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const stats = getKiemKeKhoChiTietStats(chiTiet);
  const signLabels = getKiemKeKhoPreviewSignLabels(t);

  const rows: (string | number)[][] = [
    [safeText(info.companyName)],
    ...(info.address ? [[t('company.address'), info.address]] : []),
    ...(info.email ? [[t('company.email'), info.email]] : []),
    ...(info.phone ? [[t('company.phone'), info.phone]] : []),
    [],
    [t('kiemKeKho.preview.title')],
    [t('kiemKeKho.store.maDotCol'), dot.ma_dot],
    [t('kiemKeKho.store.tenDotCol'), dot.ten_dot],
    [t('kiemKeKho.store.ngayBatDauCol'), formatDate(dot.ngay_bat_dau)],
    [t('kiemKeKho.store.ngayKetThucCol'), formatDate(dot.ngay_ket_thuc)],
    [t('kiemKeKho.store.trangThaiCol'), getTrangThaiDotLabel(dot.trang_thai, t)],
    [t('kiemKeKho.store.nguoiPhuTrachCol'), safeText(dot.ten_nguoi_phu_trach || dot.ma_nguoi_phu_trach)],
    [t('kiemKeKho.store.ghiChuCol'), safeText(dot.ghi_chu)],
    [],
    [t('kiemKeKho.stats.total'), stats.total],
    [t('kiemKeKho.ketQua.khop'), stats.khop],
    [t('kiemKeKho.ketQua.thieu'), stats.thieu],
    [t('kiemKeKho.ketQua.thua'), stats.thua],
    [t('kiemKeKho.ketQua.chua_kiem'), stats.chuaKiem],
    [],
    [
      'TT',
      t('kiemKeKho.store.khoCol'),
      t('kiemKeKho.store.hangHoaCol'),
      t('kiemKeKho.store.soLuongSoCol'),
      t('kiemKeKho.store.soLuongThucTeCol'),
      t('kiemKeKho.detail.chenhLech'),
      t('kiemKeKho.store.ketQuaCol'),
      t('kiemKeKho.store.dvtCol'),
      t('kiemKeKho.store.ghiChuCol'),
    ],
  ];

  chiTiet.forEach((c, idx) => {
    const variance = getKiemKeKhoVariance(c);
    rows.push([
      idx + 1,
      safeText(c.ten_kho || c.ma_kho),
      safeText(c.ten_hang || c.ma_hang),
      Number(c.so_luong_so) || 0,
      c.so_luong_thuc_te != null ? Number(c.so_luong_thuc_te) : '',
      variance ?? '',
      t(`kiemKeKho.ketQua.${c.ket_qua}`),
      safeText(c.don_vi_tinh),
      safeText(c.ghi_chu_dong),
    ]);
  });

  // Phần ký — 4 cột nhãn
  rows.push([], signLabels);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 24 },
    { wch: 32 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 10 },
    { wch: 28 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Phieu_kiem_ke_kho');
  XLSX.writeFile(wb, `${getFileName(dot)}.xlsx`);
}
