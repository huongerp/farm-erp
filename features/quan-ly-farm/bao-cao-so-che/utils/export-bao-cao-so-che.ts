/**
 * Xuất báo cáo sơ chế (PDF / DOC / XLSX) — A4 dọc.
 */
import type { FarmBaoCaoSoChe } from '../core/types';
import type { FarmBaoCaoNhanCong } from '../../bao-cao-nhan-cong/core/types';
import {
  findBaoCaoNhanCongByBranchAndDate,
  extractLaborSnapshotFromBcnc,
  extractBcncTableGhiChuRows,
  computeBaoCaoSoCheKpis,
} from '../core/bcsc-kpi';
import {
  SO_LIEU_BUONG_ROW_DEFS,
  BCSC_SO_LIEU_STT_OFFSET,
  BCSC_KPI_STT_OFFSET,
} from '../core/so-lieu-row-meta';
import { enrichPhamCapRowsWithDerived } from '../core/pham-cap-derived';
import { sumTienThuongKpiThuong } from '../core/types';
import { computeKpiPhanTram } from '../../shared/kpi-thuong/types';
import {
  buildBcscOverviewTableHTML,
  buildBcscSignFooterHTML,
  bcscTrangThaiLabel,
  getBcscPreviewSignLabels,
} from '../core/bcsc-preview-layout';
import { formatDateShort, formatDateTime, formatNumberVN, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';

export type BaoCaoSoCheExportFormat = 'pdf' | 'doc' | 'xlsx';

const FONT = "Arial, 'Helvetica Neue', sans-serif";
const FONT_DOC = "'Times New Roman', Times, serif";
const EMPTY = '—';

const th =
  'padding:3px 5px;border:1px solid #bbb;font-size:7pt;font-weight:600;background:#f3f4f6;text-align:center;vertical-align:bottom';
const td = 'padding:2px 5px;border:1px solid #bbb;font-size:7pt;vertical-align:top';
const tdR = `${td};text-align:right`;
const tdC = `${td};text-align:center;color:#666`;
const tdTot = `${td};font-weight:600;background:#f3f4f6`;
const tdTotR = `${tdTot};text-align:right`;

function safe(v: string | number | null | undefined): string {
  if (v == null || v === '') return EMPTY;
  return String(v);
}

function fmtNum(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return EMPTY;
  return formatNumberVN(n);
}

function fileName(data: FarmBaoCaoSoChe): string {
  const branch = (data.ten_chi_nhanh ?? 'chi_nhanh')
    .replace(/\s+/g, '_')
    .replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Bao_cao_so_che_${data.ngay}_${branch}_${getTodayISODate()}`;
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

function buildMetricTableHTML(
  sectionTitle: string,
  rows: { stt: number; chiSo: string; dvt: string; giaTri: string; ghiChu: string }[]
): string {
  const body = rows
    .map(
      (r) =>
        `<tr>
          <td style="${tdC}">${r.stt}</td>
          <td style="${td}">${r.chiSo}</td>
          <td style="${td};color:#555">${r.dvt}</td>
          <td style="${tdR};font-weight:600">${r.giaTri}</td>
          <td style="${td};color:#555;white-space:pre-wrap">${r.ghiChu}</td>
        </tr>`
    )
    .join('');
  return `
<div style="margin-bottom:12px;font-family:${FONT}">
  <div style="font-size:9pt;font-weight:700;color:#222;margin-bottom:4px">${sectionTitle}</div>
  <table style="width:100%;border-collapse:collapse;table-layout:fixed">
    <thead>
      <tr>
        <th style="${th};width:30px">TT</th>
        <th style="${th};width:35%">Chỉ số</th>
        <th style="${th};width:80px">ĐVT</th>
        <th style="${th};width:80px;text-align:right">Giá trị</th>
        <th style="${th}">Ghi chú</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
  </table>
</div>`;
}

function buildBaoCaoSoCheBodyHTML(data: FarmBaoCaoSoChe, bcncList: FarmBaoCaoNhanCong[]): string {
  const t = i18n.t.bind(i18n);
  const slipU = data.don_vi_tinh?.trim() || 'buồng';
  const status = bcscTrangThaiLabel(data, t);

  const bcnc = findBaoCaoNhanCongByBranchAndDate(bcncList, data.ngay, data.id_chi_nhanh);
  const labor = bcnc ? extractLaborSnapshotFromBcnc(bcnc) : null;
  const [g1, g2, g3, g4] = extractBcncTableGhiChuRows(bcnc);
  const kpis = computeBaoCaoSoCheKpis(Number(data.tong_buong_so_che), bcnc);
  const phamCapEnriched = enrichPhamCapRowsWithDerived(data.pham_cap ?? []);
  const kpiThuong = [...(data.kpi_thuong ?? [])].sort((a, b) => a.thu_tu - b.thu_tu);
  const tongThuong = sumTienThuongKpiThuong(kpiThuong);

  // ---- I. BCNC ----
  const bcncRows = labor
    ? [
        { stt: 1, chiSo: t('baoCaoSoChe.bcnc.tongCongNhanLamViec'), dvt: t('baoCaoSoChe.bcnc.dvt.tongCong'), giaTri: fmtNum(labor.tongCongQuyDoiPhieu), ghiChu: g1 },
        { stt: 2, chiSo: t('baoCaoSoChe.bcnc.tongGioCnNgay'),        dvt: t('baoCaoSoChe.bcnc.dvt.gio'),     giaTri: fmtNum(labor.tongGioCnNgay),        ghiChu: g2 },
        { stt: 3, chiSo: t('baoCaoSoChe.bcnc.soCnDinhBien'),          dvt: t('baoCaoSoChe.bcnc.dvt.tongCong'), giaTri: fmtNum(labor.soCnDinhBien),          ghiChu: g3 },
        { stt: 4, chiSo: t('baoCaoSoChe.bcnc.gioTcCnDinhBien'),       dvt: t('baoCaoSoChe.bcnc.dvt.gio'),     giaTri: fmtNum(labor.gioTangCaTichDinhBien), ghiChu: g4 },
      ]
    : [];
  const bcncSection = labor
    ? buildMetricTableHTML(`I. ${t('baoCaoSoChe.form.sectionBcncTitle')}`, bcncRows)
    : `<div style="margin-bottom:12px;font-size:8pt;color:#888"><strong>I. ${t('baoCaoSoChe.form.sectionBcncTitle')}</strong><br>${t('baoCaoSoChe.bcnc.needNgayChiNhanh')}</div>`;

  // ---- II. Số liệu buồng ----
  const soLieuRows = SO_LIEU_BUONG_ROW_DEFS.map((def, idx) => {
    const val = (data as Record<string, unknown>)[def.key] as number;
    const meta = data.so_lieu_row_meta?.[def.key];
    const dvt = meta?.don_vi_tinh_phu?.trim() || (def.key === 'danh_gia_loi_qc_pct' ? '%' : slipU);
    return {
      stt: BCSC_SO_LIEU_STT_OFFSET + idx + 1,
      chiSo: t(def.labelKey),
      dvt,
      giaTri: fmtNum(val),
      ghiChu: meta?.ghi_chu?.trim() || EMPTY,
    };
  });
  const soLieuSection = buildMetricTableHTML(`II. ${t('baoCaoSoChe.form.sectionSoCheTitle')}`, soLieuRows);

  // ---- III. KPI tính toán ----
  const o = BCSC_KPI_STT_OFFSET;
  const kpiCalcRows = [
    { stt: o + 1, chiSo: t('baoCaoSoChe.kpi.nsThungCongNgay'),     dvt: t('baoCaoSoChe.kpi.dvt.perCong', { dvt: slipU }),     giaTri: fmtNum(kpis.nsThungCongNgay),     ghiChu: EMPTY },
    { stt: o + 2, chiSo: t('baoCaoSoChe.kpi.nsThungGioCong'),       dvt: t('baoCaoSoChe.kpi.dvt.perGio', { dvt: slipU }),      giaTri: fmtNum(kpis.nsThungGioCong),      ghiChu: EMPTY },
    { stt: o + 3, chiSo: t('baoCaoSoChe.kpi.nsBinhQuanNguoiGio'),   dvt: t('baoCaoSoChe.kpi.dvt.perCongGio', { dvt: slipU }), giaTri: fmtNum(kpis.nsBinhQuanNguoiGio), ghiChu: EMPTY },
    { stt: o + 4, chiSo: t('baoCaoSoChe.kpi.soThungTp'),             dvt: slipU,                                                giaTri: fmtNum(kpis.thungThanhPham),      ghiChu: EMPTY },
    { stt: o + 5, chiSo: t('baoCaoSoChe.kpi.tongLuong'),             dvt: t('baoCaoSoChe.kpi.dvt.tongLuong'),                   giaTri: fmtNum(kpis.tongLuong),           ghiChu: EMPTY },
    { stt: o + 6, chiSo: t('baoCaoSoChe.kpi.chiPhiNcPerKg'),         dvt: t('baoCaoSoChe.kpi.dvt.chiPhiPerKg'),                giaTri: fmtNum(kpis.chiPhiNhanCongPerKg), ghiChu: EMPTY },
  ];
  const kpiCalcSection = buildMetricTableHTML(`III. ${t('baoCaoSoChe.form.sectionNsLuongTitle')}`, kpiCalcRows);

  // ---- IV. Phẩm cấp ----
  const phamCapBody =
    phamCapEnriched.length === 0
      ? `<tr><td colspan="7" style="${td};text-align:center;color:#888">${t('baoCaoSoChe.phamCap.detailEmpty')}</td></tr>`
      : phamCapEnriched
          .map(
            (r, i) =>
              `<tr>
                <td style="${tdC}">${i + 1}</td>
                <td style="${td}">${safe(r.ten_pham_cap)}</td>
                <td style="${tdR}">${fmtNum(r.so_tham_chieu)}</td>
                <td style="${tdR}">${fmtNum(r.so_thung)}</td>
                <td style="${tdR};font-weight:600">${fmtNum(r.tong_kg)}</td>
                <td style="${tdR}">${r.ty_le_pct > 0 ? `${fmtNum(r.ty_le_pct)}%` : EMPTY}</td>
                <td style="${tdR}">${fmtNum(r.so_thung_quy_doi)}</td>
              </tr>`
          )
          .join('') +
        `<tr>
          <td colspan="2" style="${tdTotR}">${t('baoCaoSoChe.phamCap.totalRow')}</td>
          <td style="${tdTotR}"></td>
          <td style="${tdTotR}">${fmtNum(phamCapEnriched.reduce((s, r) => s + (r.so_thung ?? 0), 0))}</td>
          <td style="${tdTotR}">${fmtNum(phamCapEnriched.reduce((s, r) => s + r.tong_kg, 0))}</td>
          <td style="${tdTotR}">100%</td>
          <td style="${tdTotR}">${fmtNum(phamCapEnriched.reduce((s, r) => s + (r.so_thung_quy_doi ?? 0), 0))}</td>
        </tr>`;

  const phamCapSection = `
<div style="margin-bottom:12px;font-family:${FONT}">
  <div style="font-size:9pt;font-weight:700;color:#222;margin-bottom:4px">IV. ${t('baoCaoSoChe.form.sectionPhamCapTitle')}</div>
  <table style="width:100%;border-collapse:collapse;table-layout:fixed">
    <thead>
      <tr>
        <th style="${th};width:30px">TT</th>
        <th style="${th};width:22%">${t('baoCaoSoChe.phamCap.colPhamCap')}</th>
        <th style="${th};text-align:right">${t('baoCaoSoChe.phamCap.colSoKg')}</th>
        <th style="${th};text-align:right">${t('baoCaoSoChe.phamCap.colSoThung')}</th>
        <th style="${th};text-align:right">${t('baoCaoSoChe.phamCap.colTongKg')}</th>
        <th style="${th};text-align:right">${t('baoCaoSoChe.phamCap.colTyLe')}</th>
        <th style="${th};text-align:right">${t('baoCaoSoChe.phamCap.colSoThungQD')}</th>
      </tr>
    </thead>
    <tbody>${phamCapBody}</tbody>
  </table>
</div>`;

  // ---- V. KPI / Thưởng ----
  const kpiThuongBody =
    kpiThuong.length === 0
      ? `<tr><td colspan="9" style="${td};text-align:center;color:#888">${t('baoCaoSoChe.kpiThuong.emptyDetail')}</td></tr>`
      : kpiThuong
          .map((r, i) => {
            const pct = computeKpiPhanTram(r.muc_tieu, r.thuc_te);
            const tienColor = r.tien_thuong > 0 ? '#16a34a' : r.tien_thuong < 0 ? '#dc2626' : '#111';
            return `<tr>
              <td style="${tdC}">${i + 1}</td>
              <td style="${td}">${safe(r.ten_hang_muc)}</td>
              <td style="${td};color:#555">${safe(r.don_vi_tinh)}</td>
              <td style="${tdR}">${safe(r.muc_tieu)}</td>
              <td style="${tdR}">${safe(r.thuc_te)}</td>
              <td style="${tdR}">${pct != null ? `${fmtNum(pct)}%` : EMPTY}</td>
              <td style="${td}">${safe(r.danh_gia)}</td>
              <td style="${tdR};font-weight:600;color:${tienColor}">${formatNumberVN(r.tien_thuong)}</td>
              <td style="${td};color:#555;white-space:pre-wrap">${safe(r.ghi_chu)}</td>
            </tr>`;
          })
          .join('') +
        `<tr>
          <td colspan="7" style="${tdTotR}">${t('baoCaoSoChe.kpiThuong.rowTongThuong')}</td>
          <td style="${tdTotR}">${formatNumberVN(tongThuong)}</td>
          <td style="${tdTot}"></td>
        </tr>`;

  const kpiThuongSection = `
<div style="margin-bottom:12px;font-family:${FONT}">
  <div style="font-size:9pt;font-weight:700;color:#222;margin-bottom:4px">V. ${t('baoCaoSoChe.kpiThuong.sectionTitle')}</div>
  <table style="width:100%;border-collapse:collapse;table-layout:fixed">
    <thead>
      <tr>
        <th style="${th};width:28px">TT</th>
        <th style="${th};width:22%">${t('baoCaoSoChe.kpiThuong.colHangMuc')}</th>
        <th style="${th};width:50px">${t('baoCaoSoChe.kpiThuong.colDvt')}</th>
        <th style="${th};width:60px;text-align:right">${t('baoCaoSoChe.kpiThuong.colMucTieu')}</th>
        <th style="${th};width:60px;text-align:right">${t('baoCaoSoChe.kpiThuong.colThucTe')}</th>
        <th style="${th};width:50px;text-align:right">${t('baoCaoSoChe.kpiThuong.colPhanTram')}</th>
        <th style="${th};width:60px">${t('baoCaoSoChe.kpiThuong.colDanhGia')}</th>
        <th style="${th};width:75px;text-align:right">${t('baoCaoSoChe.kpiThuong.colTienThuong')}</th>
        <th style="${th}">${t('baoCaoSoChe.kpiThuong.colGhiChu')}</th>
      </tr>
    </thead>
    <tbody>${kpiThuongBody}</tbody>
  </table>
</div>`;

  const printedAt = formatDateTime(new Date());
  const overviewTable = buildBcscOverviewTableHTML(data, t, FONT);
  const signFooter = buildBcscSignFooterHTML(t, FONT);
  const companyHeader = buildCompanyHeaderHTML();

  return [
    companyHeader,
    `<h1 style="text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;margin:0 0 4px;font-family:${FONT}">${t('baoCaoSoChe.preview.title')}</h1>`,
    `<p style="text-align:center;font-size:9pt;color:#666;margin:0 0 10px;font-family:${FONT}">${formatDateShort(data.ngay)}${data.ten_chi_nhanh ? ` · ${data.ten_chi_nhanh}` : ''} · ${status}</p>`,
    overviewTable,
    bcncSection,
    soLieuSection,
    kpiCalcSection,
    phamCapSection,
    kpiThuongSection,
    signFooter,
    `<p style="font-size:7pt;color:#999;margin-top:16px;padding-top:8px;border-top:1px solid #eee;font-family:${FONT}">${t('baoCaoSoChe.preview.printedAt')} ${printedAt}</p>`,
  ].join('');
}

export async function exportBaoCaoSoCheToPDF(
  data: FarmBaoCaoSoChe,
  bcncList: FarmBaoCaoNhanCong[]
): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const bodyContent = buildBaoCaoSoCheBodyHTML(data, bcncList);
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

export async function exportBaoCaoSoCheToDoc(
  data: FarmBaoCaoSoChe,
  bcncList: FarmBaoCaoNhanCong[]
): Promise<void> {
  const body = buildBaoCaoSoCheBodyHTML(data, bcncList);
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

export async function exportBaoCaoSoCheToXLSX(
  data: FarmBaoCaoSoChe,
  bcncList: FarmBaoCaoNhanCong[]
): Promise<void> {
  const XLSX = await import('xlsx');
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const status = bcscTrangThaiLabel(data, t);
  const slipU = data.don_vi_tinh?.trim() || 'buồng';

  const bcnc = findBaoCaoNhanCongByBranchAndDate(bcncList, data.ngay, data.id_chi_nhanh);
  const labor = bcnc ? extractLaborSnapshotFromBcnc(bcnc) : null;
  const [g1, g2, g3, g4] = extractBcncTableGhiChuRows(bcnc);
  const kpis = computeBaoCaoSoCheKpis(Number(data.tong_buong_so_che), bcnc);
  const phamCapEnriched = enrichPhamCapRowsWithDerived(data.pham_cap ?? []);
  const kpiThuong = [...(data.kpi_thuong ?? [])].sort((a, b) => a.thu_tu - b.thu_tu);
  const tongThuong = sumTienThuongKpiThuong(kpiThuong);

  const rows: (string | number)[][] = [
    [info.companyName],
    ...(info.address ? [[t('company.address'), info.address]] : []),
    [],
    [t('baoCaoSoChe.preview.title')],
    [t('baoCaoSoChe.form.ngay'), formatDateShort(data.ngay)],
    [t('baoCaoSoChe.form.branch'), safe(data.ten_chi_nhanh)],
    [t('baoCaoSoChe.store.colTrangThai'), status],
    [t('baoCaoSoChe.form.donViTinh'), safe(data.don_vi_tinh)],
    [t('baoCaoSoChe.store.colSoChe'), data.tong_buong_so_che],
    [t('baoCaoSoChe.store.colTonDau'), data.sl_buong_ton_dau_ngay],
    [t('baoCaoSoChe.store.colThuHoach'), data.tong_buong_thu_hoach],
    [t('baoCaoSoChe.store.colTonCuoi'), data.sl_buong_ton_cuoi_ngay],
    [t('baoCaoSoChe.store.colNguoiTao'), safe(data.ten_nguoi_tao)],
    ...(data.ghi_chu?.trim() ? [[t('baoCaoSoChe.form.ghiChuPhieu'), data.ghi_chu]] : []),
    [],
    // I. BCNC
    [`I. ${t('baoCaoSoChe.form.sectionBcncTitle')}`],
    ['TT', 'Chỉ số', 'ĐVT', 'Giá trị', 'Ghi chú'],
    ...(labor
      ? [
          [1, t('baoCaoSoChe.bcnc.tongCongNhanLamViec'), t('baoCaoSoChe.bcnc.dvt.tongCong'), labor.tongCongQuyDoiPhieu, g1],
          [2, t('baoCaoSoChe.bcnc.tongGioCnNgay'),        t('baoCaoSoChe.bcnc.dvt.gio'),     labor.tongGioCnNgay,        g2],
          [3, t('baoCaoSoChe.bcnc.soCnDinhBien'),          t('baoCaoSoChe.bcnc.dvt.tongCong'), labor.soCnDinhBien,          g3],
          [4, t('baoCaoSoChe.bcnc.gioTcCnDinhBien'),       t('baoCaoSoChe.bcnc.dvt.gio'),     labor.gioTangCaTichDinhBien, g4],
        ]
      : [['—', t('baoCaoSoChe.bcnc.needNgayChiNhanh')]]),
    [],
    // II. Số liệu buồng
    [`II. ${t('baoCaoSoChe.form.sectionSoCheTitle')}`],
    ['TT', 'Chỉ số', 'ĐVT', 'Giá trị', 'Ghi chú'],
    ...SO_LIEU_BUONG_ROW_DEFS.map((def, idx) => {
      const val = (data as Record<string, unknown>)[def.key] as number;
      const meta = data.so_lieu_row_meta?.[def.key];
      const dvt = meta?.don_vi_tinh_phu?.trim() || (def.key === 'danh_gia_loi_qc_pct' ? '%' : slipU);
      return [BCSC_SO_LIEU_STT_OFFSET + idx + 1, t(def.labelKey), dvt, val, meta?.ghi_chu?.trim() || ''];
    }),
    [],
    // III. KPI tính toán
    [`III. ${t('baoCaoSoChe.form.sectionNsLuongTitle')}`],
    ['TT', 'Chỉ số', 'ĐVT', 'Giá trị', 'Ghi chú'],
    [BCSC_KPI_STT_OFFSET + 1, t('baoCaoSoChe.kpi.nsThungCongNgay'),     t('baoCaoSoChe.kpi.dvt.perCong', { dvt: slipU }),     kpis.nsThungCongNgay ?? '—'],
    [BCSC_KPI_STT_OFFSET + 2, t('baoCaoSoChe.kpi.nsThungGioCong'),       t('baoCaoSoChe.kpi.dvt.perGio', { dvt: slipU }),      kpis.nsThungGioCong ?? '—'],
    [BCSC_KPI_STT_OFFSET + 3, t('baoCaoSoChe.kpi.nsBinhQuanNguoiGio'),   t('baoCaoSoChe.kpi.dvt.perCongGio', { dvt: slipU }), kpis.nsBinhQuanNguoiGio ?? '—'],
    [BCSC_KPI_STT_OFFSET + 4, t('baoCaoSoChe.kpi.soThungTp'),             slipU,                                                kpis.thungThanhPham ?? '—'],
    [BCSC_KPI_STT_OFFSET + 5, t('baoCaoSoChe.kpi.tongLuong'),             t('baoCaoSoChe.kpi.dvt.tongLuong'),                  '—'],
    [BCSC_KPI_STT_OFFSET + 6, t('baoCaoSoChe.kpi.chiPhiNcPerKg'),         t('baoCaoSoChe.kpi.dvt.chiPhiPerKg'),                '—'],
    [],
    // IV. Phẩm cấp
    [`IV. ${t('baoCaoSoChe.form.sectionPhamCapTitle')}`],
    ['TT', t('baoCaoSoChe.phamCap.colPhamCap'), t('baoCaoSoChe.phamCap.colSoKg'), t('baoCaoSoChe.phamCap.colSoThung'), t('baoCaoSoChe.phamCap.colTongKg'), t('baoCaoSoChe.phamCap.colTyLe'), t('baoCaoSoChe.phamCap.colSoThungQD')],
    ...phamCapEnriched.map((r, i) => [i + 1, r.ten_pham_cap || '', r.so_tham_chieu, r.so_thung, r.tong_kg, r.ty_le_pct, r.so_thung_quy_doi]),
    [
      t('baoCaoSoChe.phamCap.totalRow'), '',
      '',
      phamCapEnriched.reduce((s, r) => s + (r.so_thung ?? 0), 0),
      phamCapEnriched.reduce((s, r) => s + r.tong_kg, 0),
      100,
      phamCapEnriched.reduce((s, r) => s + (r.so_thung_quy_doi ?? 0), 0),
    ],
    [],
    // V. KPI/Thưởng
    [`V. ${t('baoCaoSoChe.kpiThuong.sectionTitle')}`],
    ['TT', t('baoCaoSoChe.kpiThuong.colHangMuc'), t('baoCaoSoChe.kpiThuong.colDvt'), t('baoCaoSoChe.kpiThuong.colMucTieu'), t('baoCaoSoChe.kpiThuong.colThucTe'), '%', t('baoCaoSoChe.kpiThuong.colDanhGia'), t('baoCaoSoChe.kpiThuong.colTienThuong'), t('baoCaoSoChe.kpiThuong.colGhiChu')],
    ...kpiThuong.map((r, i) => {
      const pct = computeKpiPhanTram(r.muc_tieu, r.thuc_te);
      return [i + 1, r.ten_hang_muc || '', r.don_vi_tinh || '', r.muc_tieu || '', r.thuc_te || '', pct ?? '', r.danh_gia || '', r.tien_thuong, r.ghi_chu || ''];
    }),
    [t('baoCaoSoChe.kpiThuong.rowTongThuong'), '', '', '', '', '', '', tongThuong, ''],
    [],
    // Chữ ký
    getBcscPreviewSignLabels(t),
    [t('baoCaoSoChe.preview.signHint'), t('baoCaoSoChe.preview.signHint'), t('baoCaoSoChe.preview.signHint'), t('baoCaoSoChe.preview.signHint')],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 6 }, { wch: 36 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 22 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo sơ chế');
  XLSX.writeFile(wb, `${fileName(data)}.xlsx`);
}
