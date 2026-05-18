/**
 * Xuất phiếu dự báo SL đóng thùng (PDF / DOC / XLSX) — A4 dọc.
 */
import type { FarmDuBaoSlDongThung } from '../core/types';
import { computeDuBaoSlDongThungKpiFromFarm } from '../core/kpi';
import {
  buildDbsdtOverviewTableHTML,
  buildDbsdtSignFooterHTML,
  dbsdtTrangThaiLabel,
  getDbsdtPreviewSignLabels,
} from '../core/dbsdt-preview-layout';
import { formatDateShort, formatDateTime, formatNumberVN, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';

export type DuBaoSlDongThungExportFormat = 'pdf' | 'doc' | 'xlsx';

const FONT = "Arial, 'Helvetica Neue', sans-serif";
const FONT_DOC = "'Times New Roman', Times, serif";

const th = 'padding:3px 5px;border:1px solid #bbb;font-size:7pt;font-weight:600;background:#f3f4f6;text-align:center';
const td = 'padding:2px 5px;border:1px solid #bbb;font-size:7pt;vertical-align:top';
const tdR = `${td};text-align:right;font-weight:600`;
const tdHL = `${td};background:#dbeafe;font-weight:700;color:#1d4ed8`;
const tdHLR = `${tdHL};text-align:right`;

function fmtNum(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return formatNumberVN(n);
}

function fmtPct(r: number): string {
  return `${formatNumberVN(Math.round(r * 10000) / 100)}%`;
}

function fileName(data: FarmDuBaoSlDongThung): string {
  const branch = (data.ten_chi_nhanh ?? 'chi_nhanh')
    .replace(/\s+/g, '_')
    .replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Du_bao_dong_thung_${data.ngay}_${branch}_${getTodayISODate()}`;
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

function buildCompanyHeaderHTML(): string {
  const info = useUIStore.getState().companyInfo;
  const logoHtml = info.appLogo
    ? `<img src="${info.appLogo}" alt="Logo" style="width:56px;height:56px;object-fit:contain;flex-shrink:0" />`
    : '';
  const addr = info.address ? `${i18n.t('company.address')}: ${info.address}` : '';
  return `
<div style="display:flex;align-items:flex-start;gap:12px;padding-bottom:12px;margin-bottom:12px;border-bottom:2px solid #333;font-family:${FONT}">
  ${logoHtml}
  <div style="flex:1;min-width:0">
    <div style="font-size:13pt;font-weight:bold;color:#111;text-transform:uppercase">${info.companyName}</div>
    ${addr ? `<p style="font-size:8pt;color:#444;margin:2px 0 0 0">${addr}</p>` : ''}
  </div>
</div>`;
}

function buildTableHTML(data: FarmDuBaoSlDongThung): string {
  const t = i18n.t.bind(i18n);
  const kpi = computeDuBaoSlDongThungKpiFromFarm(data);

  type Row = { stt: number; label: string; value: string; unit: string; note: string; hl?: boolean };
  const rows: Row[] = [
    { stt: 1, label: t('duBaoSlDongThung.form.row1'), value: fmtNum(data.so_buong_can_mau), unit: t('duBaoSlDongThung.form.unitBuong'), note: t('duBaoSlDongThung.form.row1Note') },
    { stt: 2, label: t('duBaoSlDongThung.form.row2'), value: fmtNum(data.tong_can_nang_mau), unit: t('duBaoSlDongThung.form.unitKg'), note: t('duBaoSlDongThung.form.row2Note') },
    { stt: 3, label: t('duBaoSlDongThung.form.row3'), value: fmtNum(kpi.can_nang_binh_quan_buong), unit: t('duBaoSlDongThung.form.unitKgPerBuong'), note: t('duBaoSlDongThung.form.row3Note') },
    { stt: 4, label: t('duBaoSlDongThung.form.row4'), value: fmtNum(data.tong_buong_nhap_ke_hoach), unit: t('duBaoSlDongThung.form.unitBuong'), note: t('duBaoSlDongThung.form.row4Note') },
    { stt: 5, label: t('duBaoSlDongThung.form.row5'), value: fmtNum(kpi.tong_khoi_luong_ke_hoach), unit: t('duBaoSlDongThung.form.unitKg'), note: t('duBaoSlDongThung.form.row5Note') },
    { stt: 6, label: t('duBaoSlDongThung.form.row6'), value: fmtPct(data.ty_le_thu_hoi_ke_hoach), unit: t('duBaoSlDongThung.form.unitPercent'), note: t('duBaoSlDongThung.form.row6Note') },
    { stt: 7, label: t('duBaoSlDongThung.form.row7'), value: fmtNum(kpi.khoi_luong_dong_thung_ke_hoach), unit: t('duBaoSlDongThung.form.unitKg'), note: t('duBaoSlDongThung.form.row7Note') },
    { stt: 8, label: t('duBaoSlDongThung.form.row8'), value: fmtNum(data.quy_cach_dong_thung_ke_hoach), unit: t('duBaoSlDongThung.form.unitKgPerThung'), note: t('duBaoSlDongThung.form.row8Note') },
    { stt: 9, label: t('duBaoSlDongThung.form.row9'), value: fmtNum(kpi.tong_so_thung_ke_hoach), unit: t('duBaoSlDongThung.form.unitThung'), note: t('duBaoSlDongThung.form.row9Note'), hl: true },
    { stt: 10, label: t('duBaoSlDongThung.form.row10'), value: fmtNum(data.tong_buong_nhap_thuc_te), unit: t('duBaoSlDongThung.form.unitBuong'), note: t('duBaoSlDongThung.form.row10Note') },
    { stt: 11, label: t('duBaoSlDongThung.form.row11'), value: fmtNum(kpi.tong_khoi_luong_thuc_te), unit: t('duBaoSlDongThung.form.unitKg'), note: t('duBaoSlDongThung.form.row11Note') },
    { stt: 12, label: t('duBaoSlDongThung.form.row12'), value: fmtPct(data.ty_le_thu_hoi_thuc_te), unit: t('duBaoSlDongThung.form.unitPercent'), note: t('duBaoSlDongThung.form.row12Note') },
    { stt: 13, label: t('duBaoSlDongThung.form.row13'), value: fmtNum(kpi.khoi_luong_dong_thung_thuc_te), unit: t('duBaoSlDongThung.form.unitKg'), note: t('duBaoSlDongThung.form.row13Note') },
    { stt: 14, label: t('duBaoSlDongThung.form.row14'), value: fmtNum(data.quy_cach_dong_thung_thuc_te), unit: t('duBaoSlDongThung.form.unitKgPerThung'), note: t('duBaoSlDongThung.form.row14Note') },
    { stt: 15, label: t('duBaoSlDongThung.form.row15'), value: fmtNum(kpi.tong_so_thung_thuc_te), unit: t('duBaoSlDongThung.form.unitThung'), note: t('duBaoSlDongThung.form.row15Note'), hl: true },
  ];

  const body = rows.map((r) => {
    const sttStyle = r.hl ? `${tdHL};text-align:center` : `${td};text-align:center;color:#666`;
    const labelStyle = r.hl ? tdHL : td;
    const valStyle = r.hl ? tdHLR : tdR;
    const unitStyle = r.hl ? `${tdHL};font-weight:600` : `${td};color:#555`;
    return `<tr>
      <td style="${sttStyle}">${r.stt}</td>
      <td style="${labelStyle}">${r.label}</td>
      <td style="${valStyle}">${r.value}</td>
      <td style="${unitStyle}">${r.unit}</td>
      <td style="${td};color:#555;font-size:6.5pt">${r.note}</td>
    </tr>`;
  }).join('');

  return `
<div style="margin-bottom:12px;font-family:${FONT}">
  <div style="font-size:9pt;font-weight:700;color:#222;margin-bottom:4px">${t('duBaoSlDongThung.form.sectionBangTinh')}</div>
  <table style="width:100%;border-collapse:collapse;table-layout:fixed">
    <thead>
      <tr>
        <th style="${th};width:28px">${t('duBaoSlDongThung.form.colStt')}</th>
        <th style="${th};width:36%;text-align:left">${t('duBaoSlDongThung.form.colHangMuc')}</th>
        <th style="${th};width:80px;text-align:right">${t('duBaoSlDongThung.form.colGiaTri')}</th>
        <th style="${th};width:70px;text-align:left">${t('duBaoSlDongThung.form.colDonVi')}</th>
        <th style="${th};text-align:left">${t('duBaoSlDongThung.form.colGhiChu')}</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
  </table>
</div>`;
}

function buildBodyHTML(data: FarmDuBaoSlDongThung): string {
  const t = i18n.t.bind(i18n);
  const status = dbsdtTrangThaiLabel(data, t);
  const overviewTable = buildDbsdtOverviewTableHTML(data, t, FONT);
  const signFooter = buildDbsdtSignFooterHTML(t, FONT);
  const companyHeader = buildCompanyHeaderHTML();
  const mainTable = buildTableHTML(data);
  const printedAt = formatDateTime(new Date());

  return [
    companyHeader,
    `<h1 style="text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;margin:0 0 4px;font-family:${FONT}">${t('duBaoSlDongThung.preview.title')}</h1>`,
    `<p style="text-align:center;font-size:9pt;color:#666;margin:0 0 10px;font-family:${FONT}">${formatDateShort(data.ngay)}${data.ten_chi_nhanh ? ` · ${data.ten_chi_nhanh}` : ''} · ${status}</p>`,
    overviewTable,
    mainTable,
    signFooter,
    `<p style="font-size:7pt;color:#999;margin-top:16px;padding-top:8px;border-top:1px solid #eee;font-family:${FONT}">${t('duBaoSlDongThung.preview.printedAt')} ${printedAt}</p>`,
  ].join('');
}

export async function exportDuBaoSlDongThungToPDF(data: FarmDuBaoSlDongThung): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const bodyContent = buildBodyHTML(data);
  const fullHtml = [
    '<!DOCTYPE html><html><head><meta charset="UTF-8">',
    `<style>*{box-sizing:border-box}body{margin:0;padding:0;background:#fff;color:#222;font-family:${FONT};font-size:10pt}img{max-width:100%}table{word-break:break-word}</style></head><body>`,
    `<div style="width:794px;padding:20px">${bodyContent}</div>`,
    '</body></html>',
  ].join('');

  const iframe = document.createElement('iframe');
  iframe.setAttribute('srcdoc', fullHtml);
  iframe.style.cssText = 'position:fixed;left:0;top:0;width:834px;height:1123px;border:0;z-index:-1';
  document.body.appendChild(iframe);

  await new Promise<void>((resolve, reject) => {
    iframe.onload = () => resolve();
    iframe.onerror = () => reject(new Error('iframe load failed'));
  });
  await new Promise((r) => setTimeout(r, 200));

  try {
    const docEl = iframe.contentDocument?.body;
    if (!docEl) throw new Error('iframe body not available');
    const canvas = await html2canvas(docEl, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
    if (iframe.parentNode) document.body.removeChild(iframe);

    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = 210, pageH = 297, margin = 8;
    const pxToMm = 25.4 / 96;
    const wMm = (canvas.width / 2) * pxToMm;
    const hMm = (canvas.height / 2) * pxToMm;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const scale = Math.min(maxW / wMm, maxH / hMm, 1);
    const drawW = wMm * scale;
    const drawH = hMm * scale;

    if (drawH <= maxH) {
      doc.addImage(imgData, 'PNG', margin, margin, drawW, drawH);
    } else {
      let yOffset = 0, page = 0;
      const slicePx = (maxH / scale / pxToMm) * 2;
      while (yOffset < canvas.height) {
        const sliceH = Math.min(slicePx, canvas.height - yOffset);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceH;
        const ctx = sliceCanvas.getContext('2d');
        if (!ctx) break;
        ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        const sliceHMm = (sliceH / 2) * pxToMm * scale;
        if (page > 0) doc.addPage();
        doc.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, margin, drawW, sliceHMm);
        yOffset += sliceH;
        page += 1;
      }
    }
    download(doc.output('blob'), `${fileName(data)}.pdf`);
  } finally {
    if (iframe.parentNode) document.body.removeChild(iframe);
  }
}

export async function exportDuBaoSlDongThungToDoc(data: FarmDuBaoSlDongThung): Promise<void> {
  const body = buildBodyHTML(data);
  const html = [
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">',
    '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>',
    `<style>body,td,th,p{font-family:${FONT_DOC};font-size:10pt;}@page{size:A4;margin:12mm}</style></head>`,
    `<body style="font-family:${FONT_DOC};margin:24px">${body}</body></html>`,
  ].join('');
  download(new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' }), `${fileName(data)}.doc`);
}

export async function exportDuBaoSlDongThungToXLSX(data: FarmDuBaoSlDongThung): Promise<void> {
  const XLSX = await import('xlsx');
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const status = dbsdtTrangThaiLabel(data, t);
  const kpi = computeDuBaoSlDongThungKpiFromFarm(data);

  const rows: (string | number)[][] = [
    [info.companyName],
    ...(info.address ? [[t('company.address'), info.address]] : []),
    [],
    [t('duBaoSlDongThung.preview.title')],
    [t('duBaoSlDongThung.form.ngay'), formatDateShort(data.ngay)],
    [t('duBaoSlDongThung.form.branch'), data.ten_chi_nhanh ?? ''],
    [t('duBaoSlDongThung.store.colTrangThai'), status],
    [t('duBaoSlDongThung.store.colNguoiTao'), data.ten_nguoi_tao ?? ''],
    ...(data.ghi_chu?.trim() ? [[t('duBaoSlDongThung.form.ghiChuPhieu'), data.ghi_chu]] : []),
    [],
    [t('duBaoSlDongThung.form.sectionBangTinh')],
    [t('duBaoSlDongThung.form.colStt'), t('duBaoSlDongThung.form.colHangMuc'), t('duBaoSlDongThung.form.colGiaTri'), t('duBaoSlDongThung.form.colDonVi'), t('duBaoSlDongThung.form.colGhiChu')],
    [1, t('duBaoSlDongThung.form.row1'), data.so_buong_can_mau, t('duBaoSlDongThung.form.unitBuong'), t('duBaoSlDongThung.form.row1Note')],
    [2, t('duBaoSlDongThung.form.row2'), data.tong_can_nang_mau, t('duBaoSlDongThung.form.unitKg'), t('duBaoSlDongThung.form.row2Note')],
    [3, t('duBaoSlDongThung.form.row3'), kpi.can_nang_binh_quan_buong ?? '', t('duBaoSlDongThung.form.unitKgPerBuong'), t('duBaoSlDongThung.form.row3Note')],
    [4, t('duBaoSlDongThung.form.row4'), data.tong_buong_nhap_ke_hoach, t('duBaoSlDongThung.form.unitBuong'), t('duBaoSlDongThung.form.row4Note')],
    [5, t('duBaoSlDongThung.form.row5'), kpi.tong_khoi_luong_ke_hoach, t('duBaoSlDongThung.form.unitKg'), t('duBaoSlDongThung.form.row5Note')],
    [6, t('duBaoSlDongThung.form.row6'), data.ty_le_thu_hoi_ke_hoach * 100, t('duBaoSlDongThung.form.unitPercent'), t('duBaoSlDongThung.form.row6Note')],
    [7, t('duBaoSlDongThung.form.row7'), kpi.khoi_luong_dong_thung_ke_hoach, t('duBaoSlDongThung.form.unitKg'), t('duBaoSlDongThung.form.row7Note')],
    [8, t('duBaoSlDongThung.form.row8'), data.quy_cach_dong_thung_ke_hoach, t('duBaoSlDongThung.form.unitKgPerThung'), t('duBaoSlDongThung.form.row8Note')],
    [9, t('duBaoSlDongThung.form.row9'), kpi.tong_so_thung_ke_hoach, t('duBaoSlDongThung.form.unitThung'), t('duBaoSlDongThung.form.row9Note')],
    [10, t('duBaoSlDongThung.form.row10'), data.tong_buong_nhap_thuc_te, t('duBaoSlDongThung.form.unitBuong'), t('duBaoSlDongThung.form.row10Note')],
    [11, t('duBaoSlDongThung.form.row11'), kpi.tong_khoi_luong_thuc_te, t('duBaoSlDongThung.form.unitKg'), t('duBaoSlDongThung.form.row11Note')],
    [12, t('duBaoSlDongThung.form.row12'), data.ty_le_thu_hoi_thuc_te * 100, t('duBaoSlDongThung.form.unitPercent'), t('duBaoSlDongThung.form.row12Note')],
    [13, t('duBaoSlDongThung.form.row13'), kpi.khoi_luong_dong_thung_thuc_te, t('duBaoSlDongThung.form.unitKg'), t('duBaoSlDongThung.form.row13Note')],
    [14, t('duBaoSlDongThung.form.row14'), data.quy_cach_dong_thung_thuc_te, t('duBaoSlDongThung.form.unitKgPerThung'), t('duBaoSlDongThung.form.row14Note')],
    [15, t('duBaoSlDongThung.form.row15'), kpi.tong_so_thung_thuc_te, t('duBaoSlDongThung.form.unitThung'), t('duBaoSlDongThung.form.row15Note')],
    [],
    getDbsdtPreviewSignLabels(t),
    [t('duBaoSlDongThung.preview.signHint'), t('duBaoSlDongThung.preview.signHint'), t('duBaoSlDongThung.preview.signHint'), t('duBaoSlDongThung.preview.signHint')],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 14 }, { wch: 14 }, { wch: 30 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dự báo đóng thùng');
  XLSX.writeFile(wb, `${fileName(data)}.xlsx`);
}
