/**
 * Xuất đơn đặt hàng ra PDF, DOC, XLSX – toàn bộ từ source (po, chiTiet), không phụ thuộc trang preview.
 *
 * - PDF: Tạo tài liệu HTML từ buildDonDatHangBodyHTML, render trong iframe rồi chụp bằng html2canvas
 *        → chèn ảnh vào jsPDF. Chữ màu đen (#222), font Arial, đúng tiếng Việt.
 * - DOC: HTML table-based, UTF-8 BOM, Times New Roman.
 * - XLSX: SheetJS, Unicode.
 */
import type { DonDatHang, DonDatHangChiTiet } from '../core/types';
import { TRANG_THAI_KEY } from '../core/constants';
import {
  formatDate,
  formatDateTime,
  formatDateVietnameseLong,
  formatNumberVN,
  getTodayISODate,
} from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';

/** Font cho PDF (Arial hỗ trợ tiếng Việt trong canvas) */
const FONT = "Arial, 'Helvetica Neue', sans-serif";
const FONT_DOC = "'Times New Roman', Times, serif";

function safe(v: string | number | null | undefined): string {
  if (v == null || v === '') return '–';
  return String(v);
}

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getTrangThaiLabel(trangThai: DonDatHang['trang_thai'], t: (k: string) => string): string {
  const key = TRANG_THAI_KEY[trangThai];
  return key ? t(`donDatHang.status.${key}`) : String(trangThai);
}

function buildCompanyHeaderHTML(F: string): string {
  const info = useUIStore.getState().companyInfo;
  const logoHtml = info.appLogo
    ? `<img src="${info.appLogo}" alt="" style="width:56px;height:56px;object-fit:contain;flex-shrink:0"/>`
    : '';
  const addr = info.address ? `${i18n.t('company.address')}: ${info.address}` : '';
  const contact = [info.email, info.phone].filter(Boolean).join(' · ');
  return `
<div style="display:flex;align-items:flex-start;gap:16px;padding-bottom:16px;margin-bottom:16px;border-bottom:2px solid #333;font-family:${F}">
  ${logoHtml}
  <div style="flex:1;min-width:0">
    <div style="font-size:14pt;font-weight:bold;color:#111;text-transform:uppercase">${info.companyName}</div>
    ${addr ? `<p style="font-size:9pt;color:#444;margin:2px 0 0 0">${addr}</p>` : ''}
    ${contact ? `<p style="font-size:9pt;color:#444;margin:2px 0 0 0">${contact}</p>` : ''}
  </div>
</div>`;
}

const TABLE_CELL = (F: string) => (label: string, value: string) =>
  `<tr><td style="padding:4px 6px;border:1px solid #ccc;font-weight:600;width:40%;color:#444;font-family:${F}">${label}</td><td style="padding:4px 6px;border:1px solid #ccc;font-family:${F}">${value}</td></tr>`;

export function buildDonDatHangBodyHTML(po: DonDatHang, chiTiet: DonDatHangChiTiet[]): string {
  const t = i18n.t.bind(i18n);
  const F = FONT;
  const dateLine = formatDateVietnameseLong(po.ngay_dat);
  const printedAt = formatDateTime(new Date());

  const infoRows: [string, string][] = [
    [t('donDatHang.form.code'), po.so_po],
    [t('donDatHang.form.orderDate'), formatDate(po.ngay_dat)],
    [t('donDatHang.form.deliveryDate'), formatDate(po.ngay_giao_dk)],
    [t('donDatHang.form.supplier'), safe(po.ten_nha_cung_cap)],
    [t('donDatHang.form.warehouse'), safe(po.ten_kho_nhan)],
    [t('donDatHang.form.linkRequest'), safe(po.so_phieu_de_xuat)],
    [t('donDatHang.form.buyer'), safe(po.ten_nguoi_dat)],
    [t('donDatHang.form.approver'), safe(po.ten_nguoi_duyet)],
    [t('donDatHang.form.paymentTerms'), safe(po.dieu_khoan_thanh_toan)],
    [t('donDatHang.form.notes'), safe(po.ghi_chu)],
    [t('donDatHang.store.statusCol'), getTrangThaiLabel(po.trang_thai, t)],
  ];

  const rowCell = TABLE_CELL(F);
  let tableHTML = '';
  if (chiTiet.length > 0) {
    const headers = [
      '#',
      t('donDatHang.form.item') + ' (mã)',
      t('donDatHang.form.item') + ' (tên)',
      t('donDatHang.form.unit'),
      t('donDatHang.form.quantity'),
      t('donDatHang.form.unitPrice'),
      'Thành tiền',
      t('donDatHang.chiTietTab.purposeOfUseCol'),
      t('donDatHang.form.note'),
    ];
    const thAlign = (i: number) =>
      i === 0 ? 'center' : i === 3 ? 'center' : i >= 4 && i <= 6 ? 'right' : 'left';
    const ths = headers
      .map(
        (h, i) =>
          `<th style="padding:6px 8px;border:1px solid #ccc;font-family:${F};font-size:9pt;background:#3b82f6;color:#fff;text-align:${thAlign(i)}">${h}</th>`,
      )
      .join('');
    const rows = chiTiet
      .map(
        (c, idx) => `<tr>
<td style="padding:4px 8px;border:1px solid #ccc;font-family:${F};font-size:9pt;text-align:center">${idx + 1}</td>
<td style="padding:4px 8px;border:1px solid #ccc;font-family:${F};font-size:9pt">${safe(c.ma_hang)}</td>
<td style="padding:4px 8px;border:1px solid #ccc;font-family:${F};font-size:9pt">${safe(c.ten_hang)}</td>
<td style="padding:4px 8px;border:1px solid #ccc;font-family:${F};font-size:9pt;text-align:center">${safe(c.don_vi_tinh)}</td>
<td style="padding:4px 8px;border:1px solid #ccc;font-family:${F};font-size:9pt;text-align:right">${formatNumberVN(c.so_luong)}</td>
<td style="padding:4px 8px;border:1px solid #ccc;font-family:${F};font-size:9pt;text-align:right">${c.don_gia != null ? formatNumberVN(c.don_gia) : '–'}</td>
<td style="padding:4px 8px;border:1px solid #ccc;font-family:${F};font-size:9pt;text-align:right">${c.thanh_tien != null ? formatNumberVN(c.thanh_tien) : '–'}</td>
<td style="padding:4px 8px;border:1px solid #ccc;font-family:${F};font-size:9pt">${safe(c.muc_dich_su_dung)}</td>
<td style="padding:4px 8px;border:1px solid #ccc;font-family:${F};font-size:9pt">${safe(c.ghi_chu)}</td>
</tr>`,
      )
      .join('');
    tableHTML = `
<h2 style="font-size:11pt;margin:12px 0 8px;font-family:${F}">${t('donDatHang.form.itemsSection')}</h2>
<table style="width:100%;border-collapse:collapse;font-family:${F};font-size:10pt">
<thead><tr>${ths}</tr></thead><tbody>${rows}</tbody>
</table>`;
  } else {
    tableHTML = `<p style="font-size:10pt;color:#666;font-style:italic;font-family:${F}">${t('donDatHang.form.noItems')}</p>`;
  }

  const signBlock = (label: string) =>
    `<div style="text-align:center;flex:1"><p style="font-size:10pt;font-weight:600;color:#333;margin-bottom:2px;font-family:${F}">${label}</p><p style="font-size:8pt;color:#666;font-family:${F}">${t('donDatHang.preview.signHint')}</p></div>`;

  return `
<div style="font-family:${F};font-size:10pt;color:#222;padding:20px;min-width:600px;display:flex;flex-direction:column;min-height:100%">
${buildCompanyHeaderHTML(F)}
<p style="font-size:10pt;color:#333;margin:0 0 4px;text-align:left;font-family:${F}">${dateLine}</p>
<h1 style="font-size:16pt;text-align:center;margin:8px 0 4px;text-transform:uppercase;font-family:${F}">${t('donDatHang.preview.title')}</h1>
<p style="font-size:10pt;color:#555;text-align:center;margin-bottom:12px;font-family:${F}">(${t('donDatHang.form.code')}: ${po.so_po}) · ${getTrangThaiLabel(po.trang_thai, t)}</p>
<table style="width:100%;border-collapse:collapse;margin-top:12px;font-family:${F};font-size:10pt">
<thead><tr style="background:#3b82f6;color:#fff"><th colspan="2" style="padding:6px 8px;text-align:left;font-size:9pt;font-family:${F}">${t('donDatHang.detail.basicInfo')}</th></tr></thead>
<tbody>${infoRows.map(([l, v]) => rowCell(l, v)).join('')}</tbody>
</table>
${tableHTML}
<div style="display:flex;gap:16px;margin-top:32px;padding-top:16px;border-top:1px solid #ccc">
  ${signBlock(t('donDatHang.preview.signCreator'))}
  ${signBlock(t('donDatHang.preview.signChecker'))}
  ${signBlock(t('donDatHang.preview.signRelated'))}
  ${signBlock(t('donDatHang.preview.signApprover'))}
</div>
<footer style="margin-top:auto;padding-top:16px;border-top:1px solid #ddd"><p style="font-size:7pt;color:#888;margin:0;font-family:${F}">${t('donDatHang.preview.printedAt')} ${printedAt}</p></footer>
</div>`;
}

function getFileName(po: DonDatHang): string {
  const slug = po.so_po.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Don_dat_hang_${slug}_${getTodayISODate()}`;
}

/** HTML table-based body cho DOC (Word), font Times New Roman qua style. */
function buildDonDatHangDocBody(po: DonDatHang, chiTiet: DonDatHangChiTiet[]): string {
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const printedAt = formatDateTime(new Date());

  let detailRows = '';
  if (chiTiet.length > 0) {
    const headers = [
      '#',
      t('donDatHang.form.item') + ' (mã)',
      t('donDatHang.form.item') + ' (tên)',
      t('donDatHang.form.unit'),
      t('donDatHang.form.quantity'),
      t('donDatHang.form.unitPrice'),
      'Thành tiền',
      t('donDatHang.chiTietTab.purposeOfUseCol'),
      t('donDatHang.form.note'),
    ];
    detailRows =
      '<tr style="background:#2563eb;color:#fff;font-weight:bold">' +
      headers.map((h) => `<td style="border:1px solid #999;padding:4px 6px">${h}</td>`).join('') +
      '</tr>';
    chiTiet.forEach((c, idx) => {
      detailRows +=
        '<tr>' +
        [
          idx + 1,
          safe(c.ma_hang),
          safe(c.ten_hang),
          safe(c.don_vi_tinh),
          formatNumberVN(c.so_luong),
          c.don_gia != null ? formatNumberVN(c.don_gia) : '–',
          c.thanh_tien != null ? formatNumberVN(c.thanh_tien) : '–',
          safe(c.muc_dich_su_dung),
          safe(c.ghi_chu),
        ]
          .map((v) => `<td style="border:1px solid #999;padding:4px 6px">${v}</td>`)
          .join('') +
        '</tr>';
    });
  }

  const sign = (label: string) =>
    `<td width="25%" style="text-align:center;padding:8px;vertical-align:top"><b>${label}</b><br/><span style="font-size:9pt;color:#666">${t('donDatHang.preview.signHint')}</span></td>`;

  const infoRows: [string, string][] = [
    [t('donDatHang.form.code'), po.so_po],
    [t('donDatHang.form.orderDate'), formatDate(po.ngay_dat)],
    [t('donDatHang.form.deliveryDate'), formatDate(po.ngay_giao_dk)],
    [t('donDatHang.form.supplier'), safe(po.ten_nha_cung_cap)],
    [t('donDatHang.form.warehouse'), safe(po.ten_kho_nhan)],
    [t('donDatHang.form.linkRequest'), safe(po.so_phieu_de_xuat)],
    [t('donDatHang.form.buyer'), safe(po.ten_nguoi_dat)],
    [t('donDatHang.form.approver'), safe(po.ten_nguoi_duyet)],
    [t('donDatHang.form.paymentTerms'), safe(po.dieu_khoan_thanh_toan)],
    [t('donDatHang.form.notes'), safe(po.ghi_chu)],
    [t('donDatHang.store.statusCol'), getTrangThaiLabel(po.trang_thai, t)],
  ];
  const infoTableRows = infoRows
    .map(([l, v]) => `<tr><td style="border:1px solid #999;padding:4px 6px;font-weight:600;width:40%">${l}</td><td style="border:1px solid #999;padding:4px 6px">${v}</td></tr>`)
    .join('');

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:11pt">
<tr><td style="padding-bottom:12px;border-bottom:2px solid #333">
  <p style="margin:0;font-size:14pt;font-weight:bold">${info.companyName}</p>
  ${info.address ? `<p style="margin:4px 0 0 0;font-size:9pt">${i18n.t('company.address')}: ${info.address}</p>` : ''}
  ${info.email || info.phone ? `<p style="margin:2px 0 0 0;font-size:9pt">${[info.email, info.phone].filter(Boolean).join(' &middot; ')}</p>` : ''}
</td></tr>
<tr><td style="padding:8px 0 4px 0">${formatDateVietnameseLong(po.ngay_dat)}</td></tr>
<tr><td style="text-align:center;padding:8px 0"><b style="font-size:14pt">${t('donDatHang.preview.title')}</b><br/>(${t('donDatHang.form.code')}: ${po.so_po}) · ${getTrangThaiLabel(po.trang_thai, t)}</td></tr>
<tr><td style="padding:4px 0"><b>${t('donDatHang.detail.basicInfo')}</b></td></tr>
<tr><td><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:10pt">${infoTableRows}</table></td></tr>
${detailRows ? `<tr><td style="padding:8px 0 4px 0"><b>${t('donDatHang.form.itemsSection')}</b></td></tr><tr><td><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:10pt">${detailRows}</table></td></tr>` : ''}
<tr><td style="padding-top:24px;border-top:1px solid #ccc">
  <table width="100%"><tr>${sign(t('donDatHang.preview.signCreator'))}${sign(t('donDatHang.preview.signChecker'))}${sign(t('donDatHang.preview.signRelated'))}${sign(t('donDatHang.preview.signApprover'))}</tr></table>
</td></tr>
<tr><td style="padding-top:12px;border-top:1px solid #ddd;font-size:8pt;color:#888">${t('donDatHang.preview.printedAt')} ${printedAt}</td></tr>
</table>`;
}

/**
 * Xuất PDF từ source: tạo tài liệu HTML độc lập (iframe), chụp bằng html2canvas, chèn vào jsPDF.
 * Phân trang A4: scale theo chiều ngang, cắt ảnh thành nhiều trang.
 */
export async function exportDonDatHangToPDF(po: DonDatHang, chiTiet: DonDatHangChiTiet[]): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const bodyContent = buildDonDatHangBodyHTML(po, chiTiet);
  const fullHtml = [
    '<!DOCTYPE html><html><head><meta charset="UTF-8">',
    `<style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; background: #fff; color: #222; font-family: ${FONT}; font-size: 10pt; }
      img { max-width: 100%; }
    </style></head><body>`,
    bodyContent,
    '</body></html>',
  ].join('');

  const iframe = document.createElement('iframe');
  iframe.setAttribute('srcdoc', fullHtml);
  iframe.style.cssText = 'position:fixed;left:0;top:0;width:794px;border:0;z-index:-1;visibility:hidden';
  document.body.appendChild(iframe);

  const onLoad = new Promise<void>((resolve, reject) => {
    iframe.onload = () => resolve();
    iframe.onerror = () => reject(new Error('iframe load failed'));
  });

  await onLoad;
  await new Promise((r) => setTimeout(r, 300));

  try {
    const docEl = iframe.contentDocument?.body;
    if (!docEl) throw new Error('iframe body not available');

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

    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const pxToMm = 25.4 / 96;
    const imgWmm = (canvas.width / 2) * pxToMm;
    const imgHmm = (canvas.height / 2) * pxToMm;
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

    download(doc.output('blob'), `${getFileName(po)}.pdf`);
  } finally {
    if (iframe.parentNode) document.body.removeChild(iframe);
  }
}

/** Xuất đơn đặt hàng ra Word (UTF-8 BOM + Times New Roman, tham chiếu phiếu đề xuất vật tư) */
export function exportDonDatHangToDoc(po: DonDatHang, chiTiet: DonDatHangChiTiet[]): void {
  const body = buildDonDatHangDocBody(po, chiTiet);
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
    `${getFileName(po)}.doc`,
  );
}

/** Xuất đơn đặt hàng ra Excel */
export async function exportDonDatHangToXLSX(po: DonDatHang, chiTiet: DonDatHangChiTiet[]): Promise<void> {
  const t = i18n.t.bind(i18n);
  const XLSX = await import('xlsx');
  const infoRows: (string | number)[][] = [
    [t('donDatHang.form.code'), po.so_po],
    [t('donDatHang.form.orderDate'), formatDate(po.ngay_dat)],
    [t('donDatHang.form.deliveryDate'), formatDate(po.ngay_giao_dk)],
    [t('donDatHang.form.supplier'), po.ten_nha_cung_cap ?? '—'],
    [t('donDatHang.form.warehouse'), po.ten_kho_nhan ?? '—'],
    [t('donDatHang.form.linkRequest'), po.so_phieu_de_xuat ?? '—'],
    [t('donDatHang.form.buyer'), po.ten_nguoi_dat ?? '—'],
    [t('donDatHang.form.approver'), po.ten_nguoi_duyet ?? '—'],
    [t('donDatHang.form.paymentTerms'), po.dieu_khoan_thanh_toan ?? '—'],
    [t('donDatHang.form.notes'), po.ghi_chu ?? '—'],
    [t('donDatHang.store.statusCol'), getTrangThaiLabel(po.trang_thai, t)],
  ];
  const rows: (string | number)[][] = [...infoRows, []];
  if (chiTiet.length > 0) {
    rows.push(
      [
        '#',
        t('donDatHang.form.item') + ' (mã)',
        t('donDatHang.form.item') + ' (tên)',
        t('donDatHang.form.unit'),
        t('donDatHang.form.quantity'),
        t('donDatHang.form.unitPrice'),
        'Thành tiền',
        t('donDatHang.chiTietTab.purposeOfUseCol'),
        t('donDatHang.form.note'),
      ]
    );
    chiTiet.forEach((c, idx) => {
      rows.push([
        idx + 1,
        safe(c.ma_hang),
        safe(c.ten_hang),
        safe(c.don_vi_tinh),
        c.so_luong,
        c.don_gia != null ? c.don_gia : '–',
        c.thanh_tien != null ? c.thanh_tien : '–',
        safe(c.muc_dich_su_dung),
        safe(c.ghi_chu),
      ]);
    });
  }
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 4 },
    { wch: 16 },
    { wch: 28 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 24 },
  ];
  // Đơn giá (col F, idx 5) và Thành tiền (col G, idx 6) là số thật → định dạng phân tách hàng nghìn
  const detailStartRow = infoRows.length + 2; // sau info + dòng trống + header
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = detailStartRow; R <= range.e.r; R++) {
    for (const C of [5, 6]) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell && typeof cell.v === 'number') cell.z = '#,##0';
    }
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DonDatHang');
  XLSX.writeFile(wb, `${getFileName(po)}.xlsx`);
}
