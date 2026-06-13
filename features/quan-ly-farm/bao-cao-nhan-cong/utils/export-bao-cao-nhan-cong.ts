/**
 * Xuất báo cáo nhân công (PDF / DOC / XLSX) — A4 dọc.
 */
import type { FarmBaoCaoNhanCong, FarmBaoCaoNhanCongCt } from '../core/types';
import {
  chuyenTtLabelByThuTu,
  normalizeChiTietForDisplay,
  sumSlCongNgay,
  sumSlCongNua,
  sumSlTangCa,
  sumSoGioTc,
  sumTongCongQuyDoiPhieu,
  sumTongCongQuyDoiTuChiTiet,
  sumTongGioTangCaTichPhieu,
  sumTongGioTangCaTichTuChiTiet,
  tongCongQuyDoiNgayVaNua,
  tongGioTangCaTichMotDong,
} from '../core/types';
import {
  combinedRowGhiChuAtIndex,
  displayLoaiTotalsOnCt,
  formatGioTbVN,
  hasSubLinesOnCt,
  isSubFormRowEmpty,
  subAlignedRowCount,
  subByLoaiForCtDisplay,
  sumDisplayLoaiTotalsOnRows,
  sumTongGioQuyDoiRowIVFromRows,
  tongGioCongNgayVaNua,
} from '../core/ct-sub';
import { formatDateShort, formatDateTime, formatNumberVN, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';
import {
  buildBcncOverviewTableHTML,
  buildBcncSignFooterHTML,
  bcncTrangThaiLabel,
  getBcncPreviewSignLabels,
} from '../core/bcnc-preview-layout';

const FONT = "Arial, 'Helvetica Neue', sans-serif";
const FONT_DOC = "'Times New Roman', Times, serif";
const EMPTY = '—';

const th =
  'padding:3px 4px;border:1px solid #bbb;font-size:6.5pt;font-weight:600;background:#f3f4f6;text-align:center';
const td = 'padding:2px 4px;border:1px solid #bbb;font-size:6.5pt';
const tdR = `${td};text-align:right`;
const tdL = `${td};text-align:left`;
const tdSub = `${td};text-align:right;background:#fafafa;color:#555`;
const tdSubL = `${td};text-align:left;background:#fafafa;color:#555`;

function safe(v: string | number | null | undefined): string {
  if (v == null || v === '') return EMPTY;
  return String(v);
}

function fileName(data: FarmBaoCaoNhanCong): string {
  const branch = (data.ten_chi_nhanh ?? 'chi_nhanh')
    .replace(/\s+/g, '_')
    .replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Bao_cao_nhan_cong_${data.ngay}_${branch}_${getTodayISODate()}`;
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

function pairHtml(row: FarmBaoCaoNhanCongCt, loai: 'CN_NGAY' | 'CN_NUA' | 'TANG_CA'): string {
  const { nhanSu, tongGio } = displayLoaiTotalsOnCt(row, loai);
  return `<td style="${tdR}">${formatNumberVN(nhanSu)}</td><td style="${tdR}">${formatGioTbVN(nhanSu, tongGio)}</td>`;
}

function pairSubHtml(line: { sl_cong: number; so_gio: number } | undefined): string {
  const filled = line != null && !isSubFormRowEmpty(line);
  const sl = filled ? formatNumberVN(Number(line?.sl_cong ?? 0)) : EMPTY;
  const gio = filled ? formatNumberVN(Number(line?.so_gio ?? 0)) : EMPTY;
  return `<td style="${tdSub}">${sl}</td><td style="${tdSub}">${gio}</td>`;
}

function mainRowHtml(
  row: FarmBaoCaoNhanCongCt,
  t: (k: string, o?: Record<string, unknown>) => string,
  tt?: string,
  idx?: number
): string {
  const labelKey = `baoCaoNhanCong.chuyen.${row.loai_chuyen}`;
  const displayTt =
    tt ?? chuyenTtLabelByThuTu(row.thu_tu && row.thu_tu > 0 ? row.thu_tu : (idx ?? 0) + 1);
  const cnNgay = displayLoaiTotalsOnCt(row, 'CN_NGAY');
  const cnNua = displayLoaiTotalsOnCt(row, 'CN_NUA');
  return `<tr style="font-weight:600">
    <td style="${tdR};text-align:center">${displayTt}</td>
    <td style="${tdL}">${t(labelKey)}</td>
    ${pairHtml(row, 'CN_NGAY')}
    ${pairHtml(row, 'CN_NUA')}
    <td style="${tdR}">${formatNumberVN(tongCongQuyDoiNgayVaNua(row))}</td>
    <td style="${tdR}">${formatNumberVN(tongGioCongNgayVaNua(cnNgay, cnNua))}</td>
    ${pairHtml(row, 'TANG_CA')}
    <td style="${tdR}">${formatNumberVN(tongGioTangCaTichMotDong(row))}</td>
    <td style="${tdL}">${safe(row.ghi_chu?.trim())}</td>
  </tr>`;
}

function subRowsHtml(row: FarmBaoCaoNhanCongCt, t: (k: string, o?: Record<string, unknown>) => string): string {
  if (!hasSubLinesOnCt(row)) return '';
  const sub = subByLoaiForCtDisplay(row);
  const rowCount = subAlignedRowCount(sub);
  let html = '';
  for (let i = 0; i < rowCount; i++) {
    const ghiChu = combinedRowGhiChuAtIndex(sub, i);
    html += `<tr>
      <td style="${tdSub};text-align:center">·</td>
      <td style="${tdSubL}">${t('baoCaoNhanCong.sub.detailRow', { index: i + 1 })}</td>
      ${pairSubHtml(sub.CN_NGAY[i])}
      ${pairSubHtml(sub.CN_NUA[i])}
      <td style="${tdSub}">${EMPTY}</td>
      <td style="${tdSub}">${EMPTY}</td>
      ${pairSubHtml(sub.TANG_CA[i])}
      <td style="${tdSub}">${EMPTY}</td>
      <td style="${tdSubL}">${safe(ghiChu)}</td>
    </tr>`;
  }
  return html;
}

function buildChuyenTableHTML(data: FarmBaoCaoNhanCong): string {
  const t = i18n.t.bind(i18n);
  const { production, vRow } = normalizeChiTietForDisplay(data.chi_tiet ?? []);
  const ivQuyDoi = sumTongCongQuyDoiTuChiTiet(production);
  const tongQuyDoiPhieu = sumTongCongQuyDoiPhieu(data);
  const ivCnNgay = sumDisplayLoaiTotalsOnRows(production, 'CN_NGAY');
  const ivCnNua = sumDisplayLoaiTotalsOnRows(production, 'CN_NUA');
  const ivTangCa = sumDisplayLoaiTotalsOnRows(production, 'TANG_CA');
  const ivTongGioNgayNua = sumTongGioQuyDoiRowIVFromRows(production);
  const ivTongGioTc = sumTongGioTangCaTichTuChiTiet(production);
  const tongCnNgay = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'CN_NGAY');
  const tongCnNua = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'CN_NUA');
  const tongTangCa = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'TANG_CA');
  const tongTongGioNgayNua = tongGioCongNgayVaNua(tongCnNgay, tongCnNua);
  const tongTongGioTc = sumTongGioTangCaTichPhieu(data);

  let bodyRows = '';
  production.forEach((row, idx) => {
    bodyRows += mainRowHtml(row, t, undefined, idx) + subRowsHtml(row, t);
  });
  bodyRows += `<tr style="font-weight:600;background:#f3f4f6">
    <td style="${tdR};text-align:center">IV</td>
    <td style="${tdL}">${t('baoCaoNhanCong.form.rowCongNhanDinhBien')}</td>
    <td style="${tdR}">${formatNumberVN(ivCnNgay.nhanSu)}</td>
    <td style="${tdR}">${formatGioTbVN(ivCnNgay.nhanSu, ivCnNgay.tongGio)}</td>
    <td style="${tdR}">${formatNumberVN(ivCnNua.nhanSu)}</td>
    <td style="${tdR}">${formatGioTbVN(ivCnNua.nhanSu, ivCnNua.tongGio)}</td>
    <td style="${tdR}">${formatNumberVN(ivQuyDoi)}</td>
    <td style="${tdR}">${formatNumberVN(ivTongGioNgayNua)}</td>
    <td style="${tdR}">${formatNumberVN(ivTangCa.nhanSu)}</td>
    <td style="${tdR}">${formatGioTbVN(ivTangCa.nhanSu, ivTangCa.tongGio)}</td>
    <td style="${tdR}">${formatNumberVN(ivTongGioTc)}</td>
    <td style="${tdL}">${EMPTY}</td>
  </tr>`;
  bodyRows += mainRowHtml(vRow, t, 'V') + subRowsHtml(vRow, t);
  bodyRows += `<tr style="font-weight:700;background:#e5e7eb">
    <td style="${tdL};font-weight:700" colspan="2">${t('baoCaoNhanCong.form.rowTongNgay')}</td>
    <td style="${tdR}">${formatNumberVN(tongCnNgay.nhanSu)}</td>
    <td style="${tdR}">${formatGioTbVN(tongCnNgay.nhanSu, tongCnNgay.tongGio)}</td>
    <td style="${tdR}">${formatNumberVN(tongCnNua.nhanSu)}</td>
    <td style="${tdR}">${formatGioTbVN(tongCnNua.nhanSu, tongCnNua.tongGio)}</td>
    <td style="${tdR}">${formatNumberVN(tongQuyDoiPhieu)}</td>
    <td style="${tdR}">${formatNumberVN(tongTongGioNgayNua)}</td>
    <td style="${tdR}">${formatNumberVN(tongTangCa.nhanSu)}</td>
    <td style="${tdR}">${formatGioTbVN(tongTangCa.nhanSu, tongTangCa.tongGio)}</td>
    <td style="${tdR}">${formatNumberVN(tongTongGioTc)}</td>
    <td style="${tdL}">${EMPTY}</td>
  </tr>`;

  return `<table style="width:100%;border-collapse:collapse;table-layout:fixed;font-family:${FONT}">
    <thead>
      <tr>
        <th rowspan="2" style="${th};width:5%">${t('baoCaoNhanCong.form.colTt')}</th>
        <th rowspan="2" style="${th};width:14%;text-align:left">${t('baoCaoNhanCong.form.colChuyen')}</th>
        <th colspan="2" style="${th}">${t('baoCaoNhanCong.form.colSlNgay')}</th>
        <th colspan="2" style="${th}">${t('baoCaoNhanCong.form.colSlNua')}</th>
        <th rowspan="2" style="${th};width:7%">${t('baoCaoNhanCong.form.colTongCongQuyDoi')}</th>
        <th rowspan="2" style="${th};width:7%">${t('baoCaoNhanCong.form.colTongGio')}</th>
        <th colspan="2" style="${th}">${t('baoCaoNhanCong.form.colSlTangCa')}</th>
        <th rowspan="2" style="${th};width:7%">${t('baoCaoNhanCong.form.colTongGioTc')}</th>
        <th rowspan="2" style="${th};width:10%;text-align:left">${t('baoCaoNhanCong.form.colGhiChu')}</th>
      </tr>
      <tr>
        <th style="${th};text-align:right;font-size:6pt">${t('baoCaoNhanCong.detail.colNhanSu')}</th>
        <th style="${th};text-align:right;font-size:6pt">${t('baoCaoNhanCong.form.colGioTb')}</th>
        <th style="${th};text-align:right;font-size:6pt">${t('baoCaoNhanCong.detail.colNhanSu')}</th>
        <th style="${th};text-align:right;font-size:6pt">${t('baoCaoNhanCong.form.colGioTb')}</th>
        <th style="${th};text-align:right;font-size:6pt">${t('baoCaoNhanCong.detail.colNhanSu')}</th>
        <th style="${th};text-align:right;font-size:6pt">${t('baoCaoNhanCong.form.colGioTb')}</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>`;
}

export function buildBaoCaoNhanCongBodyHTML(data: FarmBaoCaoNhanCong): string {
  const t = i18n.t.bind(i18n);
  const printedAt = formatDateTime(new Date());
  const status = bcncTrangThaiLabel(data, t);
  const subtitle = `${formatDateShort(data.ngay)}${data.ten_chi_nhanh ? ` · ${data.ten_chi_nhanh}` : ''} · ${status}`;

  return `
<div style="font-family:${FONT};font-size:10pt;color:#222;padding:16px;width:210mm;box-sizing:border-box;background:#fff">
${buildCompanyHeaderHTML()}
<h1 style="font-size:14pt;text-align:center;margin:0 0 6px;font-weight:bold;text-transform:uppercase">${t('baoCaoNhanCong.preview.title')}</h1>
<p style="font-size:9pt;color:#555;text-align:center;margin:0 0 10px">${subtitle}</p>
${buildBcncOverviewTableHTML(data, t, FONT)}
<h2 style="font-size:10pt;font-weight:600;margin:8px 0 6px">${t('baoCaoNhanCong.form.sectionChuyen')}</h2>
${buildChuyenTableHTML(data)}
${buildBcncSignFooterHTML(t, FONT)}
<p style="font-size:7pt;color:#888;margin-top:12px;border-top:1px solid #e5e7eb;padding-top:8px">${t('baoCaoNhanCong.preview.printedAt')} ${printedAt}</p>
</div>`;
}

function tableHeaders(t: (k: string) => string): string[] {
  return [
    t('baoCaoNhanCong.form.colTt'),
    t('baoCaoNhanCong.form.colChuyen'),
    `${t('baoCaoNhanCong.form.colSlNgay')} - ${t('baoCaoNhanCong.detail.colNhanSu')}`,
    `${t('baoCaoNhanCong.form.colSlNgay')} - ${t('baoCaoNhanCong.form.colGioTb')}`,
    `${t('baoCaoNhanCong.form.colSlNua')} - ${t('baoCaoNhanCong.detail.colNhanSu')}`,
    `${t('baoCaoNhanCong.form.colSlNua')} - ${t('baoCaoNhanCong.form.colGioTb')}`,
    t('baoCaoNhanCong.form.colTongCongQuyDoi'),
    t('baoCaoNhanCong.form.colTongGio'),
    `${t('baoCaoNhanCong.form.colSlTangCa')} - ${t('baoCaoNhanCong.detail.colNhanSu')}`,
    `${t('baoCaoNhanCong.form.colSlTangCa')} - ${t('baoCaoNhanCong.form.colGioTb')}`,
    t('baoCaoNhanCong.form.colTongGioTc'),
    t('baoCaoNhanCong.form.colGhiChu'),
  ];
}

function mainRowXlsx(
  row: FarmBaoCaoNhanCongCt,
  t: (k: string, o?: Record<string, unknown>) => string,
  tt?: string,
  idx?: number
): (string | number)[] {
  const labelKey = `baoCaoNhanCong.chuyen.${row.loai_chuyen}`;
  const displayTt =
    tt ?? chuyenTtLabelByThuTu(row.thu_tu && row.thu_tu > 0 ? row.thu_tu : (idx ?? 0) + 1);
  const cnNgay = displayLoaiTotalsOnCt(row, 'CN_NGAY');
  const cnNua = displayLoaiTotalsOnCt(row, 'CN_NUA');
  const tc = displayLoaiTotalsOnCt(row, 'TANG_CA');
  return [
    displayTt,
    t(labelKey),
    cnNgay.nhanSu,
    formatGioTbVN(cnNgay.nhanSu, cnNgay.tongGio),
    cnNua.nhanSu,
    formatGioTbVN(cnNua.nhanSu, cnNua.tongGio),
    tongCongQuyDoiNgayVaNua(row),
    tongGioCongNgayVaNua(cnNgay, cnNua),
    tc.nhanSu,
    formatGioTbVN(tc.nhanSu, tc.tongGio),
    tongGioTangCaTichMotDong(row),
    row.ghi_chu?.trim() ?? '',
  ];
}

function subRowXlsx(
  row: FarmBaoCaoNhanCongCt,
  t: (k: string, o?: Record<string, unknown>) => string
): (string | number)[][] {
  if (!hasSubLinesOnCt(row)) return [];
  const sub = subByLoaiForCtDisplay(row);
  const rowCount = subAlignedRowCount(sub);
  const out: (string | number)[][] = [];
  for (let i = 0; i < rowCount; i++) {
    const ghiChu = combinedRowGhiChuAtIndex(sub, i);
    const ng = sub.CN_NGAY[i];
    const nu = sub.CN_NUA[i];
    const tc = sub.TANG_CA[i];
    const sl = (line: { sl_cong: number; so_gio: number } | undefined) =>
      line != null && !isSubFormRowEmpty(line) ? Number(line.sl_cong) : '';
    const gio = (line: { sl_cong: number; so_gio: number } | undefined) =>
      line != null && !isSubFormRowEmpty(line) ? Number(line.so_gio) : '';
    out.push([
      '·',
      t('baoCaoNhanCong.sub.detailRow', { index: i + 1 }),
      sl(ng),
      gio(ng),
      sl(nu),
      gio(nu),
      '',
      '',
      sl(tc),
      gio(tc),
      '',
      ghiChu,
    ]);
  }
  return out;
}

export async function exportBaoCaoNhanCongToPDF(data: FarmBaoCaoNhanCong): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const bodyContent = buildBaoCaoNhanCongBodyHTML(data);
  const fullHtml = [
    '<!DOCTYPE html><html><head><meta charset="UTF-8">',
    `<style>*{box-sizing:border-box}body{margin:0;padding:0;background:#fff;color:#222;font-family:${FONT};font-size:10pt}img{max-width:100%}table{word-break:break-word}</style></head><body>`,
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
  await new Promise((r) => setTimeout(r, 150));

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
    const margin = 8;
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
      let yOffset = 0;
      let page = 0;
      const sliceMm = maxH;
      const slicePx = (sliceMm / scale / pxToMm) * 2;
      while (yOffset < canvas.height) {
        const sliceH = Math.min(slicePx, canvas.height - yOffset);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceH;
        const ctx = sliceCanvas.getContext('2d');
        if (!ctx) break;
        ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        const sliceImg = sliceCanvas.toDataURL('image/png');
        const sliceHMm = (sliceH / 2) * pxToMm * scale;
        if (page > 0) doc.addPage();
        doc.addImage(sliceImg, 'PNG', margin, margin, drawW, sliceHMm);
        yOffset += sliceH;
        page += 1;
      }
    }

    download(doc.output('blob'), `${fileName(data)}.pdf`);
  } finally {
    if (iframe.parentNode) document.body.removeChild(iframe);
  }
}

export async function exportBaoCaoNhanCongToDoc(data: FarmBaoCaoNhanCong): Promise<void> {
  const body = buildBaoCaoNhanCongBodyHTML(data);
  const html = [
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">',
    '<head>',
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>',
    `<style>body,td,th,p{font-family:${FONT_DOC};font-size:10pt;}@page{size:A4;margin:12mm}</style>`,
    '</head>',
    `<body style="font-family:${FONT_DOC};margin:24px">${body}</body>`,
    '</html>',
  ].join('');
  download(new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' }), `${fileName(data)}.doc`);
}

export async function exportBaoCaoNhanCongToXLSX(data: FarmBaoCaoNhanCong): Promise<void> {
  const XLSX = await import('xlsx');
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const status = bcncTrangThaiLabel(data, t);
  const { production, vRow } = normalizeChiTietForDisplay(data.chi_tiet ?? []);

  const rows: (string | number)[][] = [
    [info.companyName],
    ...(info.address ? [[t('company.address'), info.address]] : []),
    [],
    [t('baoCaoNhanCong.preview.title')],
    [t('baoCaoNhanCong.form.ngay'), formatDateShort(data.ngay)],
    [t('baoCaoNhanCong.form.branch'), safe(data.ten_chi_nhanh)],
    [t('baoCaoNhanCong.store.colTrangThai'), status],
    [t('baoCaoNhanCong.store.colTongCongNgay'), sumSlCongNgay(data)],
    [t('baoCaoNhanCong.store.colTongCongNua'), sumSlCongNua(data)],
    [t('baoCaoNhanCong.store.colTongCongQuyDoi'), sumTongCongQuyDoiPhieu(data)],
    [t('baoCaoNhanCong.store.colTongTangCa'), sumSlTangCa(data)],
    [t('baoCaoNhanCong.store.colGioTangCa'), sumSoGioTc(data)],
    [t('baoCaoNhanCong.store.colTongGioTangCa'), sumTongGioTangCaTichPhieu(data)],
    [t('baoCaoNhanCong.store.colNguoiTao'), safe(data.ten_nguoi_tao)],
    ...(data.ghi_chu?.trim() ? [[t('baoCaoNhanCong.form.ghiChuPhieu'), data.ghi_chu]] : []),
    [],
    tableHeaders(t),
  ];

  production.forEach((row, idx) => {
    rows.push(mainRowXlsx(row, t, undefined, idx));
    rows.push(...subRowXlsx(row, t));
  });

  const ivCnNgay = sumDisplayLoaiTotalsOnRows(production, 'CN_NGAY');
  const ivCnNua = sumDisplayLoaiTotalsOnRows(production, 'CN_NUA');
  const ivTangCa = sumDisplayLoaiTotalsOnRows(production, 'TANG_CA');
  rows.push([
    'IV',
    t('baoCaoNhanCong.form.rowCongNhanDinhBien'),
    ivCnNgay.nhanSu,
    formatGioTbVN(ivCnNgay.nhanSu, ivCnNgay.tongGio),
    ivCnNua.nhanSu,
    formatGioTbVN(ivCnNua.nhanSu, ivCnNua.tongGio),
    sumTongCongQuyDoiTuChiTiet(production),
    sumTongGioQuyDoiRowIVFromRows(production),
    ivTangCa.nhanSu,
    formatGioTbVN(ivTangCa.nhanSu, ivTangCa.tongGio),
    sumTongGioTangCaTichTuChiTiet(production),
    '',
  ]);

  rows.push(mainRowXlsx(vRow, t, 'V'));
  rows.push(...subRowXlsx(vRow, t));

  const tongCnNgay = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'CN_NGAY');
  const tongCnNua = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'CN_NUA');
  const tongTangCa = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'TANG_CA');
  rows.push([
    '',
    t('baoCaoNhanCong.form.rowTongNgay'),
    tongCnNgay.nhanSu,
    formatGioTbVN(tongCnNgay.nhanSu, tongCnNgay.tongGio),
    tongCnNua.nhanSu,
    formatGioTbVN(tongCnNua.nhanSu, tongCnNua.tongGio),
    sumTongCongQuyDoiPhieu(data),
    tongGioCongNgayVaNua(tongCnNgay, tongCnNua),
    tongTangCa.nhanSu,
    formatGioTbVN(tongTangCa.nhanSu, tongTangCa.tongGio),
    sumTongGioTangCaTichPhieu(data),
    '',
  ]);

  rows.push([]);
  rows.push(getBcncPreviewSignLabels(t));

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 24 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bao_cao_nhan_cong');
  XLSX.writeFile(wb, `${fileName(data)}.xlsx`);
}

export type BaoCaoNhanCongExportFormat = 'pdf' | 'doc' | 'xlsx';
