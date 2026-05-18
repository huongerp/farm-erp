/**
 * Xuất báo cáo thống kê kiểm kê kho ra XLSX và PDF.
 *
 * Input: kết quả từ useKiemKeKhoStats + meta bộ lọc đang áp dụng.
 */
import type { KiemKeKhoStatsSummary, KiemKeKhoStatsByTrangThai } from '../components/stats/useKiemKeKhoStats';
import { formatDateTime, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';

const FONT = "Arial, 'Helvetica Neue', sans-serif";

/* ------------------------------------------------------------------ */
/*  Meta bộ lọc                                                       */
/* ------------------------------------------------------------------ */

export interface KiemKeKhoThongKeExportMeta {
  dateFrom?: string;
  dateTo?: string;
  filterLabels?: string[]; // mô tả filter đang bật (e.g. "Trạng thái: Nháp")
}

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

function getFileName(): string {
  return `Thong_ke_kiem_ke_kho_${getTodayISODate()}`;
}

/* ------------------------------------------------------------------ */
/*  HTML body                                                          */
/* ------------------------------------------------------------------ */

function buildThongKeBodyHTML(
  summary: KiemKeKhoStatsSummary,
  byTrangThai: KiemKeKhoStatsByTrangThai[],
  meta: KiemKeKhoThongKeExportMeta
): string {
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const printedAt = formatDateTime(new Date());

  const logoHtml = info.appLogo
    ? `<img src="${info.appLogo}" alt="Logo" style="width:56px;height:56px;object-fit:contain;flex-shrink:0" />`
    : '';
  const addr = info.address ? `${t('company.address')}: ${info.address}` : '';

  const metaLines: string[] = [];
  if (meta.dateFrom || meta.dateTo) {
    const parts: string[] = [];
    if (meta.dateFrom) parts.push(`${t('kiemKeKho.filter.dateFrom')}: ${meta.dateFrom}`);
    if (meta.dateTo) parts.push(`${t('kiemKeKho.filter.dateTo')}: ${meta.dateTo}`);
    metaLines.push(parts.join(' — '));
  }
  if (meta.filterLabels?.length) {
    metaLines.push(meta.filterLabels.join(', '));
  }

  const th = `padding:6px 10px;border:1px solid #ddd;text-align:left;font-size:10pt;font-family:${FONT};background:#3b82f6;color:#fff`;
  const thR = `${th};text-align:right`;
  const td = `padding:5px 10px;border:1px solid #ddd;font-family:${FONT};font-size:10pt`;
  const tdR = `${td};text-align:right;font-weight:600`;

  const kpiCards = [
    { label: t('kiemKeKho.stats.total'), value: summary.total },
    { label: t('kiemKeKho.trangThaiDot.draft'), value: summary.draft },
    { label: t('kiemKeKho.trangThaiDot.dang_kiem_ke'), value: summary.dangKiemKe },
    { label: t('kiemKeKho.trangThaiDot.hoan_thanh'), value: summary.hoanThanh },
  ];

  const kpiHtml = kpiCards
    .map(
      (k) =>
        `<div style="flex:1;min-width:100px;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;text-align:center;font-family:${FONT}">
          <p style="font-size:9pt;color:#666;margin:0 0 4px">${escapeHtml(k.label)}</p>
          <p style="font-size:18pt;font-weight:700;color:#1d4ed8;margin:0">${k.value}</p>
        </div>`
    )
    .join('');

  const statusTableRows = byTrangThai
    .map(
      (row) =>
        `<tr>
          <td style="${td}">${escapeHtml(t(`kiemKeKho.${row.ten}`))}</td>
          <td style="${tdR}">${row.count}</td>
        </tr>`
    )
    .join('');

  return `
<div style="font-family:${FONT};font-size:10pt;color:#222;padding:15mm 15mm 15mm 20mm;background:#fff;min-width:500px;box-sizing:border-box">
  <div style="display:flex;align-items:flex-start;gap:14px;padding-bottom:14px;margin-bottom:14px;border-bottom:2px solid #333">
    ${logoHtml}
    <div>
      <div style="font-size:14pt;font-weight:bold;color:#111;text-transform:uppercase">${escapeHtml(info.companyName)}</div>
      ${addr ? `<p style="font-size:9pt;color:#444;margin:2px 0 0 0">${escapeHtml(addr)}</p>` : ''}
    </div>
  </div>

  <h1 style="font-size:15pt;text-align:center;margin:0 0 6px;text-transform:uppercase;font-family:${FONT}">${escapeHtml(t('kiemKeKho.stats.title'))}</h1>
  ${metaLines.map((l) => `<p style="font-size:9pt;color:#555;text-align:center;margin:2px 0;font-family:${FONT}">${escapeHtml(l)}</p>`).join('')}
  <hr style="border:0;border-top:1px solid #ccc;margin:12px 0" />

  <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">${kpiHtml}</div>

  <h2 style="font-size:11pt;font-weight:600;margin:0 0 8px;font-family:${FONT}">${escapeHtml(t('kiemKeKho.stats.byStatus'))}</h2>
  <table style="width:100%;border-collapse:collapse;font-family:${FONT}">
    <thead>
      <tr>
        <th style="${th}">${escapeHtml(t('kiemKeKho.stats.nameCol'))}</th>
        <th style="${thR}">${escapeHtml(t('kiemKeKho.stats.countCol'))}</th>
      </tr>
    </thead>
    <tbody>${statusTableRows}</tbody>
  </table>

  <p style="font-size:7pt;color:#888;margin-top:20px;border-top:1px solid #e5e7eb;padding-top:8px;font-family:${FONT}">${escapeHtml(t('kiemKeKho.preview.printedAt'))} ${escapeHtml(printedAt)}</p>
</div>`;
}

/* ------------------------------------------------------------------ */
/*  Export: PDF                                                        */
/* ------------------------------------------------------------------ */

export async function exportKiemKeKhoThongKeToPDF(
  summary: KiemKeKhoStatsSummary,
  byTrangThai: KiemKeKhoStatsByTrangThai[],
  meta: KiemKeKhoThongKeExportMeta = {}
): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const bodyContent = buildThongKeBodyHTML(summary, byTrangThai, meta);
  const fullHtml = [
    '<!DOCTYPE html><html><head><meta charset="UTF-8">',
    `<style>*{box-sizing:border-box}body{margin:0;padding:0;background:#fff;font-family:${FONT};font-size:10pt}img{max-width:100%}</style></head><body>`,
    bodyContent,
    '</body></html>',
  ].join('');

  const iframe = document.createElement('iframe');
  iframe.setAttribute('srcdoc', fullHtml);
  iframe.style.cssText = 'position:fixed;left:0;top:0;width:794px;border:0;z-index:-1;visibility:hidden';
  document.body.appendChild(iframe);

  await new Promise<void>((resolve, reject) => {
    iframe.onload = () => resolve();
    iframe.onerror = () => reject(new Error('iframe load failed'));
  });
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
    if (iframe.parentNode) document.body.removeChild(iframe);

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

    download(doc.output('blob'), `${getFileName()}.pdf`);
  } finally {
    if (iframe.parentNode) document.body.removeChild(iframe);
  }
}

/* ------------------------------------------------------------------ */
/*  Export: XLSX                                                       */
/* ------------------------------------------------------------------ */

export async function exportKiemKeKhoThongKeToXLSX(
  summary: KiemKeKhoStatsSummary,
  byTrangThai: KiemKeKhoStatsByTrangThai[],
  meta: KiemKeKhoThongKeExportMeta = {}
): Promise<void> {
  const XLSX = await import('xlsx');
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;

  const rows: (string | number)[][] = [
    [safeText(info.companyName)],
    ...(info.address ? [[t('company.address'), info.address]] : []),
    [],
    [t('kiemKeKho.stats.title')],
  ];

  if (meta.dateFrom || meta.dateTo) {
    const parts: string[] = [];
    if (meta.dateFrom) parts.push(`${t('kiemKeKho.filter.dateFrom')}: ${meta.dateFrom}`);
    if (meta.dateTo) parts.push(`${t('kiemKeKho.filter.dateTo')}: ${meta.dateTo}`);
    rows.push([parts.join(' — ')]);
  }
  if (meta.filterLabels?.length) {
    rows.push([meta.filterLabels.join(', ')]);
  }

  rows.push(
    [],
    [t('kiemKeKho.stats.total'), summary.total],
    [t('kiemKeKho.trangThaiDot.draft'), summary.draft],
    [t('kiemKeKho.trangThaiDot.dang_kiem_ke'), summary.dangKiemKe],
    [t('kiemKeKho.trangThaiDot.hoan_thanh'), summary.hoanThanh],
    [],
    [t('kiemKeKho.stats.nameCol'), t('kiemKeKho.stats.countCol')]
  );

  byTrangThai.forEach((row) => {
    rows.push([t(`kiemKeKho.${row.ten}`), row.count]);
  });

  rows.push([], [t('kiemKeKho.preview.printedAt'), formatDateTime(new Date())]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 30 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Thong_ke');
  XLSX.writeFile(wb, `${getFileName()}.xlsx`);
}
