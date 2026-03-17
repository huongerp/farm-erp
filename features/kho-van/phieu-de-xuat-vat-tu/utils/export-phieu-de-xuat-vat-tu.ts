/**
 * Xuất phiếu đề xuất vật tư ra PDF, DOC, XLSX.
 *
 * - PDF  : html2canvas qua jsPDF (font Arial, hỗ trợ tiếng Việt).
 * - DOC  : HTML table-based (Word) + UTF-8 BOM + Times New Roman.
 * - XLSX : SheetJS aoa_to_sheet (Unicode).
 */
import type { PhieuDeXuatVatTu, PhieuDeXuatVatTuChiTiet } from '../core/types';
import {
  formatDate,
  formatDateVietnameseLong,
  formatDateTime,
  getTodayISODate,
  formatNumberVN,
} from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const FONT = "Arial, 'Helvetica Neue', sans-serif";
const FONT_DOC = "'Times New Roman', Times, serif";

function safe(v: string | number | null | undefined): string {
  if (v == null || v === '') return '–';
  return String(v);
}

function fileName(p: PhieuDeXuatVatTu): string {
  const slug = p.so_phieu.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Phieu_de_xuat_vat_tu_${slug}_${getTodayISODate()}`;
}

function colHeaders(t: (k: string) => string) {
  return [
    'TT',
    t('phieuDeXuatVatTu.form.itemName'),
    t('phieuDeXuatVatTu.form.specs'),
    t('phieuDeXuatVatTu.form.unit'),
    t('phieuDeXuatVatTu.form.quantity'),
    t('phieuDeXuatVatTu.form.note'),
  ];
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

/* ------------------------------------------------------------------ */
/*  HTML builder – cho PDF (html2canvas)                               */
/* ------------------------------------------------------------------ */

export function buildPhieuDeXuatVatTuBodyHTML(
  phieu: PhieuDeXuatVatTu,
  chiTiet: PhieuDeXuatVatTuChiTiet[],
): string {
  const t = i18n.t.bind(i18n);
  const F = FONT;
  const info = useUIStore.getState().companyInfo;
  const dateLine = formatDateVietnameseLong(phieu.ngay);
  const printedAt = formatDateTime(new Date());

  const logoHtml = info.appLogo
    ? `<img src="${info.appLogo}" alt="" style="width:56px;height:56px;object-fit:contain;flex-shrink:0"/>`
    : '';

  let tableHTML = '';
  if (chiTiet.length > 0) {
    const headers = colHeaders(t);
    const ths = headers
      .map(
        (h, i) =>
          `<th style="padding:6px 8px;border:1px solid #ccc;font-family:${F};font-size:9pt;background:#3b82f6;color:#fff;text-align:${i === 4 ? 'right' : i === 0 || i === 3 ? 'center' : 'left'}">${h}</th>`,
      )
      .join('');
    const rows = chiTiet
      .map(
        (c, idx) => `<tr>
<td style="padding:4px 8px;border:1px solid #ccc;font-family:${F};font-size:9pt;text-align:center">${idx + 1}</td>
<td style="padding:4px 8px;border:1px solid #ccc;font-family:${F};font-size:9pt">${safe(c.ten_hang)}</td>
<td style="padding:4px 8px;border:1px solid #ccc;font-family:${F};font-size:9pt">${safe(c.thong_so)}</td>
<td style="padding:4px 8px;border:1px solid #ccc;font-family:${F};font-size:9pt;text-align:center">${safe(c.don_vi_tinh)}</td>
<td style="padding:4px 8px;border:1px solid #ccc;font-family:${F};font-size:9pt;text-align:right">${formatNumberVN(c.so_luong)}</td>
<td style="padding:4px 8px;border:1px solid #ccc;font-family:${F};font-size:9pt">${safe(c.ghi_chu)}</td>
</tr>`,
      )
      .join('');
    tableHTML = `
<h2 style="font-size:11pt;margin:12px 0 8px;font-family:${F}">${t('phieuDeXuatVatTu.preview.danhSachChiTiet')}</h2>
<table style="width:100%;border-collapse:collapse;font-family:${F};font-size:10pt">
<thead><tr>${ths}</tr></thead><tbody>${rows}</tbody>
</table>`;
  } else {
    tableHTML = `<p style="font-size:10pt;color:#666;font-style:italic;font-family:${F}">${t('phieuDeXuatVatTu.form.noItems')}</p>`;
  }

  const signBlock = (label: string) =>
    `<div style="text-align:center;flex:1"><p style="font-size:10pt;font-weight:600;color:#333;margin-bottom:2px;font-family:${F}">${label}</p><p style="font-size:8pt;color:#666;font-family:${F}">${t('phieuDeXuatVatTu.preview.signHint')}</p></div>`;

  return `
<div style="font-family:${F};font-size:10pt;color:#222;padding:20px;min-width:600px;display:flex;flex-direction:column;min-height:100%">
<div style="display:flex;align-items:flex-start;gap:16px;padding-bottom:16px;margin-bottom:16px;border-bottom:2px solid #333;font-family:${F}">
  ${logoHtml}
  <div style="flex:1;min-width:0">
    <div style="font-size:14pt;font-weight:bold;color:#111;text-transform:uppercase">${info.companyName}</div>
    ${info.address ? `<p style="font-size:9pt;color:#444;margin:2px 0 0 0">${i18n.t('company.address')}: ${info.address}</p>` : ''}
    ${info.email || info.phone ? `<p style="font-size:9pt;color:#444;margin:2px 0 0 0">${[info.email, info.phone].filter(Boolean).join(' · ')}</p>` : ''}
  </div>
</div>
<p style="font-size:10pt;color:#333;margin:0 0 4px;text-align:left">${dateLine}</p>
<h1 style="font-size:16pt;text-align:center;margin:8px 0 4px;text-transform:uppercase">ĐỀ XUẤT VẬT TƯ</h1>
<p style="font-size:10pt;color:#555;text-align:center;margin-bottom:12px">(${t('phieuDeXuatVatTu.form.code')}: ${phieu.so_phieu})</p>
<div style="font-size:10pt;margin-bottom:12px">
  <p style="margin:2px 0"><strong style="color:#444">${t('phieuDeXuatVatTu.preview.donVi')}:</strong> ${safe(phieu.ten_noi_de_xuat)}</p>
  <p style="margin:2px 0"><strong style="color:#444">${t('phieuDeXuatVatTu.preview.nguoiTao')}:</strong> ${safe(phieu.ten_nguoi_de_xuat)} . ${t('phieuDeXuatVatTu.preview.boPhan')}: –</p>
  <p style="margin:2px 0"><strong style="color:#444">${t('phieuDeXuatVatTu.preview.ngayLap')}</strong> ${formatDate(phieu.ngay)} (${t('phieuDeXuatVatTu.form.requiredDate')}: ${formatDate(phieu.ngay_can)})</p>
  <p style="margin:2px 0"><strong style="color:#444">${t('phieuDeXuatVatTu.form.notes')}</strong> ${safe(phieu.ghi_chu)}</p>
</div>
${tableHTML}
<div style="display:flex;gap:16px;margin-top:32px;padding-top:16px;border-top:1px solid #ccc">
  ${signBlock(t('phieuDeXuatVatTu.preview.signCreator'))}
  ${signBlock(t('phieuDeXuatVatTu.preview.signChecker'))}
  ${signBlock(t('phieuDeXuatVatTu.preview.signRelated'))}
  ${signBlock(t('phieuDeXuatVatTu.preview.signApprover'))}
</div>
<footer style="margin-top:auto;padding-top:16px;border-top:1px solid #ddd"><p style="font-size:7pt;color:#888;margin:0">${t('phieuDeXuatVatTu.preview.printedAt')} ${printedAt}</p></footer>
</div>`;
}

/* ------------------------------------------------------------------ */
/*  DOC: table-based HTML (Word)                                      */
/* ------------------------------------------------------------------ */

function buildDocHTML(phieu: PhieuDeXuatVatTu, chiTiet: PhieuDeXuatVatTuChiTiet[]): string {
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const printedAt = formatDateTime(new Date());

  let detailRows = '';
  if (chiTiet.length > 0) {
    const headers = colHeaders(t);
    detailRows =
      '<tr style="background:#2563eb;color:#fff;font-weight:bold">' +
      headers.map((h) => `<td style="border:1px solid #999;padding:4px 6px">${h}</td>`).join('') +
      '</tr>';
    chiTiet.forEach((c, idx) => {
      detailRows +=
        '<tr>' +
        [idx + 1, safe(c.ten_hang), safe(c.thong_so), safe(c.don_vi_tinh), formatNumberVN(c.so_luong), safe(c.ghi_chu)]
          .map((v) => `<td style="border:1px solid #999;padding:4px 6px">${v}</td>`)
          .join('') +
        '</tr>';
    });
  }

  const sign = (label: string) =>
    `<td width="25%" style="text-align:center;padding:8px;vertical-align:top"><b>${label}</b><br/><span style="font-size:9pt;color:#666">${t('phieuDeXuatVatTu.preview.signHint')}</span></td>`;

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:11pt">
<tr><td style="padding-bottom:12px;border-bottom:2px solid #333">
  <p style="margin:0;font-size:14pt;font-weight:bold">${info.companyName}</p>
  ${info.address ? `<p style="margin:4px 0 0 0;font-size:9pt">${i18n.t('company.address')}: ${info.address}</p>` : ''}
  ${info.email || info.phone ? `<p style="margin:2px 0 0 0;font-size:9pt">${[info.email, info.phone].filter(Boolean).join(' &middot; ')}</p>` : ''}
</td></tr>
<tr><td style="padding:8px 0 4px 0">${formatDateVietnameseLong(phieu.ngay)}</td></tr>
<tr><td style="text-align:center;padding:8px 0"><b style="font-size:14pt">ĐỀ XUẤT VẬT TƯ</b><br/>(${t('phieuDeXuatVatTu.form.code')}: ${phieu.so_phieu})</td></tr>
<tr><td style="padding:4px 0"><b>${t('phieuDeXuatVatTu.preview.donVi')}:</b> ${safe(phieu.ten_noi_de_xuat)}</td></tr>
<tr><td style="padding:4px 0"><b>${t('phieuDeXuatVatTu.preview.nguoiTao')}:</b> ${safe(phieu.ten_nguoi_de_xuat)} . ${t('phieuDeXuatVatTu.preview.boPhan')}: –</td></tr>
<tr><td style="padding:4px 0"><b>${t('phieuDeXuatVatTu.preview.ngayLap')}</b> ${formatDate(phieu.ngay)} (${t('phieuDeXuatVatTu.form.requiredDate')}: ${formatDate(phieu.ngay_can)})</td></tr>
<tr><td style="padding:4px 0 12px 0"><b>${t('phieuDeXuatVatTu.form.notes')}:</b> ${safe(phieu.ghi_chu)}</td></tr>
${detailRows ? `
<tr><td style="padding:8px 0 4px 0"><b>${t('phieuDeXuatVatTu.preview.danhSachChiTiet')}</b></td></tr>
<tr><td><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:10pt">${detailRows}</table></td></tr>
` : ''}
<tr><td style="padding-top:24px;border-top:1px solid #ccc">
  <table width="100%"><tr>${sign(t('phieuDeXuatVatTu.preview.signCreator'))}${sign(t('phieuDeXuatVatTu.preview.signChecker'))}${sign(t('phieuDeXuatVatTu.preview.signRelated'))}${sign(t('phieuDeXuatVatTu.preview.signApprover'))}</tr></table>
</td></tr>
<tr><td style="padding-top:12px;border-top:1px solid #ddd;font-size:8pt;color:#888">${t('phieuDeXuatVatTu.preview.printedAt')} ${printedAt}</td></tr>
</table>`;
}

/* ------------------------------------------------------------------ */
/*  Export: PDF                                                        */
/* ------------------------------------------------------------------ */

/**
 * Xuất PDF từ source: HTML build từ buildPhieuDeXuatVatTuBodyHTML → iframe → html2canvas → jsPDF.
 * Chữ màu đen, nền trắng, không phụ thuộc trang preview.
 */
export async function exportPhieuDeXuatVatTuToPDF(
  phieu: PhieuDeXuatVatTu,
  chiTiet: PhieuDeXuatVatTuChiTiet[],
): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const bodyContent = buildPhieuDeXuatVatTuBodyHTML(phieu, chiTiet);
  const fullHtml = [
    '<!DOCTYPE html><html><head><meta charset="UTF-8">',
    `<style>*{box-sizing:border-box}body{margin:0;padding:0;background:#fff;color:#222;font-family:${FONT};font-size:10pt}img{max-width:100%}</style></head><body>`,
    bodyContent,
    '</body></html>',
  ].join('');

  const iframe = document.createElement('iframe');
  iframe.setAttribute('srcdoc', fullHtml);
  iframe.style.cssText = 'position:fixed;left:0;top:0;width:794px;height:1123px;border:0;z-index:-1';
  document.body.appendChild(iframe);

  await new Promise<void>((resolve, reject) => {
    iframe.onload = () => resolve();
    iframe.onerror = () => reject(new Error('iframe load failed'));
  });
  await new Promise((r) => setTimeout(r, 100));

  try {
    const docEl = iframe.contentDocument?.body;
    if (!docEl) throw new Error('iframe body not available');
    const canvas = await html2canvas(docEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    if (iframe.parentNode) document.body.removeChild(iframe);

    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const pxToMm = 25.4 / 96;
    const wMm = (canvas.width / 2) * pxToMm;
    const hMm = (canvas.height / 2) * pxToMm;
    const scale = Math.min(pageW / wMm, pageH / hMm, 1);
    doc.addImage(imgData, 'PNG', 0, 0, wMm * scale, hMm * scale);
    download(doc.output('blob'), `${fileName(phieu)}.pdf`);
  } finally {
    if (iframe.parentNode) document.body.removeChild(iframe);
  }
}

/* ------------------------------------------------------------------ */
/*  Export: DOC                                                        */
/* ------------------------------------------------------------------ */

export async function exportPhieuDeXuatVatTuToDoc(
  phieu: PhieuDeXuatVatTu,
  chiTiet: PhieuDeXuatVatTuChiTiet[],
): Promise<void> {
  const body = buildDocHTML(phieu, chiTiet);
  const html = [
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">',
    '<head>',
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>',
    `<style>body,td,th,p{font-family:${FONT_DOC};font-size:11pt;}</style>`,
    '</head>',
    `<body style="font-family:${FONT_DOC};margin:40px">${body}</body>`,
    '</html>',
  ].join('');
  download(
    new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' }),
    `${fileName(phieu)}.doc`,
  );
}

/* ------------------------------------------------------------------ */
/*  Export: XLSX                                                       */
/* ------------------------------------------------------------------ */

export async function exportPhieuDeXuatVatTuToXLSX(
  phieu: PhieuDeXuatVatTu,
  chiTiet: PhieuDeXuatVatTuChiTiet[],
): Promise<void> {
  const XLSX = await import('xlsx');
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;

  const rows: (string | number)[][] = [
    [info.companyName],
    ...(info.address ? [[t('company.address'), info.address]] : []),
    ...(info.email ? [[t('company.email'), info.email]] : []),
    ...(info.phone ? [[t('company.phone'), info.phone]] : []),
    [],
    [formatDateVietnameseLong(phieu.ngay)],
    ['ĐỀ XUẤT VẬT TƯ'],
    [t('phieuDeXuatVatTu.form.code'), phieu.so_phieu],
    [t('phieuDeXuatVatTu.preview.donVi'), phieu.ten_noi_de_xuat ?? '–'],
    [t('phieuDeXuatVatTu.preview.nguoiTao'), phieu.ten_nguoi_de_xuat ?? '–'],
    [t('phieuDeXuatVatTu.preview.ngayLap'), formatDate(phieu.ngay)],
    [t('phieuDeXuatVatTu.form.requiredDate'), formatDate(phieu.ngay_can)],
    [t('phieuDeXuatVatTu.form.notes'), safe(phieu.ghi_chu)],
    [],
    colHeaders(t),
  ];

  chiTiet.forEach((c, idx) => {
    rows.push([
      idx + 1,
      safe(c.ten_hang),
      safe(c.thong_so),
      safe(c.don_vi_tinh),
      Number(c.so_luong) || 0,
      safe(c.ghi_chu),
    ]);
  });

  rows.push([]);
  rows.push([
    t('phieuDeXuatVatTu.preview.signCreator'),
    t('phieuDeXuatVatTu.preview.signChecker'),
    t('phieuDeXuatVatTu.preview.signRelated'),
    t('phieuDeXuatVatTu.preview.signApprover'),
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 28 },
    { wch: 20 },
    { wch: 10 },
    { wch: 12 },
    { wch: 22 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Phieu_de_xuat');
  XLSX.writeFile(wb, `${fileName(phieu)}.xlsx`);
}
