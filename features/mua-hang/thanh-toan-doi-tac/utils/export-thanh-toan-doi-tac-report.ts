import type { TFunction } from 'i18next';
import type { WorkSheet } from 'xlsx';
import { formatDate, formatDateTime, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';
import type { ThanhToanDoiTac } from '../core/types';
import type {
  StatsChartItem,
  StatsChartItemAmount,
  ThanhToanDoiTacStatsByTrangThai,
  ThanhToanDoiTacStatsSummary,
} from '../components/stats/useThanhToanDoiTacStats';

const FONT_STACK = "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif";
const FILENAME_PREFIX = 'bao_cao_thanh_toan_doi_tac';

export interface ThanhToanDoiTacReportStats {
  summary: ThanhToanDoiTacStatsSummary;
  byTrangThai: ThanhToanDoiTacStatsByTrangThai[];
  byDoiTac: StatsChartItemAmount[];
  byDonVi: StatsChartItemAmount[];
  byNhom: StatsChartItemAmount[];
  byMonth: StatsChartItem[];
  byMonthAmount: StatsChartItem[];
}

export interface ThanhToanDoiTacReportFilters {
  dateFrom?: string;
  dateTo?: string;
  statusLabels: string[];
  doiTacLabels: string[];
  donViLabels: string[];
}

export interface ThanhToanDoiTacReportPayload {
  list: ThanhToanDoiTac[];
  stats: ThanhToanDoiTacReportStats;
  filters: ThanhToanDoiTacReportFilters;
  t?: TFunction;
}

function safeText(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—';
  return String(value);
}

function escapeHtml(value: string | number | null | undefined): string {
  return safeText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getPeriodLabel(filters: ThanhToanDoiTacReportFilters, t: TFunction): string {
  if (filters.dateFrom && filters.dateTo) {
    return `${formatDate(filters.dateFrom)} - ${formatDate(filters.dateTo)}`;
  }
  if (filters.dateFrom) return `${t('thanhToanDoiTac.report.fromDate')}: ${formatDate(filters.dateFrom)}`;
  if (filters.dateTo) return `${t('thanhToanDoiTac.report.toDate')}: ${formatDate(filters.dateTo)}`;
  return t('thanhToanDoiTac.report.allPeriods');
}

function getFilterValue(labels: string[], t: TFunction): string {
  return labels.length > 0 ? labels.join(', ') : t('thanhToanDoiTac.report.all');
}

function getPeriodSuffix(filters: ThanhToanDoiTacReportFilters): string {
  if (filters.dateFrom && filters.dateTo) return `${filters.dateFrom}_${filters.dateTo}`;
  if (filters.dateFrom) return `from_${filters.dateFrom}`;
  if (filters.dateTo) return `to_${filters.dateTo}`;
  return 'all';
}

function setColumnWidths(ws: WorkSheet, widths: number[]): void {
  ws['!cols'] = widths.map((wch) => ({ wch }));
}

function sheetFromRows(
  XLSX: typeof import('xlsx'),
  rows: Array<Record<string, string | number>>,
  headers: string[]
): WorkSheet {
  return rows.length > 0
    ? XLSX.utils.json_to_sheet(rows, { header: headers })
    : XLSX.utils.aoa_to_sheet([headers]);
}

function summaryRows(stats: ThanhToanDoiTacReportStats, t: TFunction): Array<[string, string | number]> {
  return [
    [t('thanhToanDoiTac.stats.total'), stats.summary.total],
    [t('thanhToanDoiTac.stats.totalAmount'), stats.summary.totalAmount],
    [t('thanhToanDoiTac.stats.pending'), stats.summary.pending],
    [t('thanhToanDoiTac.stats.paid'), stats.summary.paid],
    [t('thanhToanDoiTac.stats.cancelled'), stats.summary.cancelled],
    [t('thanhToanDoiTac.stats.other'), stats.summary.other],
  ];
}

function detailHeaders(t: TFunction): string[] {
  return [
    '#',
    t('thanhToanDoiTac.form.soPhieu'),
    t('thanhToanDoiTac.form.hangMuc'),
    t('thanhToanDoiTac.form.ngay'),
    t('thanhToanDoiTac.form.donVi'),
    t('thanhToanDoiTac.store.nhomDoiTacCol'),
    t('thanhToanDoiTac.form.doiTac'),
    t('thanhToanDoiTac.form.trangThai'),
    t('thanhToanDoiTac.form.soTien'),
    t('thanhToanDoiTac.form.ngayXuLy'),
    t('thanhToanDoiTac.form.nguoiTao'),
    t('thanhToanDoiTac.form.ghiChu'),
  ];
}

function detailRows(list: ThanhToanDoiTac[], t: TFunction): Array<Record<string, string | number>> {
  return list.map((item, index) => ({
    '#': index + 1,
    [t('thanhToanDoiTac.form.soPhieu')]: item.so_phieu,
    [t('thanhToanDoiTac.form.hangMuc')]: item.hang_muc_thanh_toan,
    [t('thanhToanDoiTac.form.ngay')]: item.ngay ? formatDate(item.ngay) : '',
    [t('thanhToanDoiTac.form.donVi')]: item.ten_don_vi ?? '',
    [t('thanhToanDoiTac.store.nhomDoiTacCol')]: item.ten_nhom ?? '',
    [t('thanhToanDoiTac.form.doiTac')]: item.ten_doi_tac ?? '',
    [t('thanhToanDoiTac.form.trangThai')]: item.ten_trang_thai ?? '',
    [t('thanhToanDoiTac.form.soTien')]: item.so_tien ?? 0,
    [t('thanhToanDoiTac.form.ngayXuLy')]: item.ngay_xu_ly ? formatDate(item.ngay_xu_ly) : '',
    [t('thanhToanDoiTac.form.nguoiTao')]: item.ten_nguoi_tao ?? '',
    [t('thanhToanDoiTac.form.ghiChu')]: item.ghi_chu ?? '',
  }));
}

export async function exportThanhToanDoiTacReportToXLSX({
  list,
  stats,
  filters,
  t = i18n.t.bind(i18n),
}: ThanhToanDoiTacReportPayload): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const exportedAt = formatDateTime(new Date());

  const overviewRows: Array<Array<string | number>> = [
    [t('thanhToanDoiTac.report.title')],
    [],
    [t('thanhToanDoiTac.report.period'), getPeriodLabel(filters, t)],
    [t('thanhToanDoiTac.report.exportedAt'), exportedAt],
    [t('common.status'), getFilterValue(filters.statusLabels, t)],
    [t('thanhToanDoiTac.form.doiTac'), getFilterValue(filters.doiTacLabels, t)],
    [t('thanhToanDoiTac.form.donVi'), getFilterValue(filters.donViLabels, t)],
    [],
    [t('thanhToanDoiTac.report.kpi'), t('thanhToanDoiTac.report.value')],
    ...summaryRows(stats, t),
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  setColumnWidths(wsOverview, [28, 38]);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'TongQuan');

  const wsDetails = sheetFromRows(XLSX, detailRows(list, t), detailHeaders(t));
  setColumnWidths(wsDetails, [8, 18, 36, 14, 24, 28, 18, 16, 16, 22, 36]);
  XLSX.utils.book_append_sheet(wb, wsDetails, 'DanhSach');

  const amountHeaders = [
    t('thanhToanDoiTac.stats.nameCol'),
    t('thanhToanDoiTac.stats.countCol'),
    t('thanhToanDoiTac.stats.amountCol'),
  ];
  const statusRows = stats.byTrangThai.map((row) => ({
    [t('thanhToanDoiTac.stats.nameCol')]: row.ten,
    [t('thanhToanDoiTac.stats.countCol')]: row.count,
    [t('thanhToanDoiTac.stats.amountCol')]: row.amount,
  }));
  const wsStatus = sheetFromRows(XLSX, statusRows, amountHeaders);
  setColumnWidths(wsStatus, [28, 14, 18]);
  XLSX.utils.book_append_sheet(wb, wsStatus, 'TheoTrangThai');

  const partnerRows = stats.byDoiTac.map((row) => ({
    [t('thanhToanDoiTac.stats.nameCol')]: row.name,
    [t('thanhToanDoiTac.stats.countCol')]: row.value,
    [t('thanhToanDoiTac.stats.amountCol')]: row.amount,
  }));
  const wsPartner = sheetFromRows(XLSX, partnerRows, amountHeaders);
  setColumnWidths(wsPartner, [32, 14, 18]);
  XLSX.utils.book_append_sheet(wb, wsPartner, 'TheoDoiTac');

  const nhomRows = stats.byNhom.map((row) => ({
    [t('thanhToanDoiTac.stats.nameCol')]: row.name,
    [t('thanhToanDoiTac.stats.countCol')]: row.value,
    [t('thanhToanDoiTac.stats.amountCol')]: row.amount,
  }));
  const wsNhom = sheetFromRows(XLSX, nhomRows, amountHeaders);
  setColumnWidths(wsNhom, [32, 14, 18]);
  XLSX.utils.book_append_sheet(wb, wsNhom, 'TheoNhomDoiTac');

  const unitRows = stats.byDonVi.map((row) => ({
    [t('thanhToanDoiTac.stats.nameCol')]: row.name,
    [t('thanhToanDoiTac.stats.countCol')]: row.value,
    [t('thanhToanDoiTac.stats.amountCol')]: row.amount,
  }));
  const wsUnit = sheetFromRows(XLSX, unitRows, amountHeaders);
  setColumnWidths(wsUnit, [32, 14, 18]);
  XLSX.utils.book_append_sheet(wb, wsUnit, 'TheoDonVi');

  const monthCountHeaders = [t('thanhToanDoiTac.report.month'), t('thanhToanDoiTac.stats.countCol')];
  const monthCountRows = stats.byMonth.map((row) => ({
    [t('thanhToanDoiTac.report.month')]: row.name,
    [t('thanhToanDoiTac.stats.countCol')]: row.value,
  }));
  const wsMonthCount = sheetFromRows(XLSX, monthCountRows, monthCountHeaders);
  setColumnWidths(wsMonthCount, [18, 14]);
  XLSX.utils.book_append_sheet(wb, wsMonthCount, 'TheoThang_SoPhieu');

  const monthAmountHeaders = [t('thanhToanDoiTac.report.month'), t('thanhToanDoiTac.stats.amountCol')];
  const monthAmountRows = stats.byMonthAmount.map((row) => ({
    [t('thanhToanDoiTac.report.month')]: row.name,
    [t('thanhToanDoiTac.stats.amountCol')]: row.value,
  }));
  const wsMonthAmount = sheetFromRows(XLSX, monthAmountRows, monthAmountHeaders);
  setColumnWidths(wsMonthAmount, [18, 18]);
  XLSX.utils.book_append_sheet(wb, wsMonthAmount, 'TheoThang_TongTien');

  XLSX.writeFile(wb, `${FILENAME_PREFIX}_${getPeriodSuffix(filters)}_${getTodayISODate()}.xlsx`);
}

function buildCompanyHeaderHTML(): string {
  const info = useUIStore.getState().companyInfo;
  const logoHtml = info.appLogo
    ? `<img src="${escapeHtml(info.appLogo)}" alt="Logo" style="width:56px;height:56px;object-fit:contain;flex-shrink:0" />`
    : '';
  const addr = info.address ? `${i18n.t('company.address')}: ${info.address}` : '';
  const contact: string[] = [];
  if (info.email) contact.push(`${i18n.t('company.email')}: ${info.email}`);
  if (info.phone) contact.push(`${i18n.t('company.phone')}: ${info.phone}`);

  return `
<div class="company-header">
  ${logoHtml}
  <div>
    <div class="company-name">${escapeHtml(info.companyName)}</div>
    ${addr ? `<div class="muted">${escapeHtml(addr)}</div>` : ''}
    ${contact.length > 0 ? `<div class="muted">${escapeHtml(contact.join(' · '))}</div>` : ''}
  </div>
</div>`;
}

function buildKpiHTML(stats: ThanhToanDoiTacReportStats, t: TFunction): string {
  const rows = [
    [t('thanhToanDoiTac.stats.total'), stats.summary.total],
    [t('thanhToanDoiTac.stats.totalAmount'), formatVnd(stats.summary.totalAmount)],
    [t('thanhToanDoiTac.stats.pending'), stats.summary.pending],
    [t('thanhToanDoiTac.stats.paid'), stats.summary.paid],
    [t('thanhToanDoiTac.stats.cancelled'), stats.summary.cancelled],
    [t('thanhToanDoiTac.stats.other'), stats.summary.other],
  ];

  return `
<section class="kpi-grid">
  ${rows
    .map(
      ([label, value]) => `
    <div class="kpi-card">
      <div class="kpi-label">${escapeHtml(label)}</div>
      <div class="kpi-value">${escapeHtml(value)}</div>
    </div>`
    )
    .join('')}
</section>`;
}

function buildAmountTableHTML(
  title: string,
  rows: Array<{ name: string; count: number; amount: number }>,
  t: TFunction
): string {
  return `
<section>
  <h2>${escapeHtml(title)}</h2>
  <table>
    <thead>
      <tr>
        <th>${escapeHtml(t('thanhToanDoiTac.stats.nameCol'))}</th>
        <th class="number">${escapeHtml(t('thanhToanDoiTac.stats.countCol'))}</th>
        <th class="number">${escapeHtml(t('thanhToanDoiTac.stats.amountCol'))}</th>
      </tr>
    </thead>
    <tbody>
      ${
        rows.length === 0
          ? `<tr><td colspan="3" class="empty">${escapeHtml(t('thanhToanDoiTac.stats.noData'))}</td></tr>`
          : rows
              .map(
                (row) => `
        <tr>
          <td>${escapeHtml(row.name)}</td>
          <td class="number">${row.count}</td>
          <td class="number">${escapeHtml(formatVnd(row.amount))}</td>
        </tr>`
              )
              .join('')
      }
    </tbody>
  </table>
</section>`;
}

function buildMonthTableHTML(title: string, rows: StatsChartItem[], valueLabel: string, isAmount: boolean): string {
  return `
<section>
  <h2>${escapeHtml(title)}</h2>
  <table>
    <thead>
      <tr>
        <th>${escapeHtml(i18n.t('thanhToanDoiTac.report.month'))}</th>
        <th class="number">${escapeHtml(valueLabel)}</th>
      </tr>
    </thead>
    <tbody>
      ${
        rows.length === 0
          ? `<tr><td colspan="2" class="empty">${escapeHtml(i18n.t('thanhToanDoiTac.stats.noData'))}</td></tr>`
          : rows
              .map(
                (row) => `
        <tr>
          <td>${escapeHtml(row.name)}</td>
          <td class="number">${escapeHtml(isAmount ? formatVnd(row.value) : row.value)}</td>
        </tr>`
              )
              .join('')
      }
    </tbody>
  </table>
</section>`;
}

function buildDetailTableHTML(list: ThanhToanDoiTac[], t: TFunction): string {
  const rows = list
    .map(
      (item, index) => `
    <tr>
      <td class="number">${index + 1}</td>
      <td>${escapeHtml(item.so_phieu)}</td>
      <td>${escapeHtml(item.hang_muc_thanh_toan)}</td>
      <td>${escapeHtml(item.ngay ? formatDate(item.ngay) : '')}</td>
      <td>${escapeHtml(item.ten_don_vi)}</td>
      <td>${escapeHtml(item.ten_nhom)}</td>
      <td>${escapeHtml(item.ten_doi_tac)}</td>
      <td>${escapeHtml(item.ten_trang_thai)}</td>
      <td class="number">${escapeHtml(formatVnd(item.so_tien ?? 0))}</td>
    </tr>`
    )
    .join('');

  return `
<section class="page-break">
  <h2>${escapeHtml(t('thanhToanDoiTac.report.detailList'))}</h2>
  <table>
    <thead>
      <tr>
        <th class="number">#</th>
        <th>${escapeHtml(t('thanhToanDoiTac.form.soPhieu'))}</th>
        <th>${escapeHtml(t('thanhToanDoiTac.form.hangMuc'))}</th>
        <th>${escapeHtml(t('thanhToanDoiTac.form.ngay'))}</th>
        <th>${escapeHtml(t('thanhToanDoiTac.form.donVi'))}</th>
        <th>${escapeHtml(t('thanhToanDoiTac.store.nhomDoiTacCol'))}</th>
        <th>${escapeHtml(t('thanhToanDoiTac.form.doiTac'))}</th>
        <th>${escapeHtml(t('thanhToanDoiTac.form.trangThai'))}</th>
        <th class="number">${escapeHtml(t('thanhToanDoiTac.form.soTien'))}</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="9" class="empty">${escapeHtml(t('thanhToanDoiTac.stats.noData'))}</td></tr>`}
    </tbody>
  </table>
</section>`;
}

export function buildThanhToanDoiTacReportPrintHTML({
  list,
  stats,
  filters,
  t = i18n.t.bind(i18n),
}: ThanhToanDoiTacReportPayload): string {
  const statusRows = stats.byTrangThai.map((row) => ({ name: row.ten, count: row.count, amount: row.amount }));
  const partnerRows = stats.byDoiTac.map((row) => ({ name: row.name, count: row.value, amount: row.amount }));
  const nhomRows = stats.byNhom.map((row) => ({ name: row.name, count: row.value, amount: row.amount }));
  const unitRows = stats.byDonVi.map((row) => ({ name: row.name, count: row.value, amount: row.amount }));
  const printedAt = formatDateTime(new Date());

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(t('thanhToanDoiTac.report.title'))}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; font-family: ${FONT_STACK}; font-size: 10pt; line-height: 1.35; }
    .company-header { display: flex; align-items: flex-start; gap: 14px; padding-bottom: 12px; margin-bottom: 16px; border-bottom: 2px solid #111827; }
    .company-name { font-size: 14pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
    .muted { color: #4b5563; font-size: 9pt; margin-top: 2px; }
    h1 { margin: 0 0 6px; text-align: center; font-size: 17pt; text-transform: uppercase; }
    .subtitle { text-align: center; color: #4b5563; margin-bottom: 14px; }
    .filters { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 16px; padding: 10px 12px; margin-bottom: 14px; border: 1px solid #d1d5db; background: #f9fafb; }
    .filters strong { color: #111827; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 14px 0; }
    .kpi-card { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 10px; break-inside: avoid; }
    .kpi-label { color: #4b5563; font-size: 8.5pt; }
    .kpi-value { margin-top: 3px; font-size: 13pt; font-weight: 700; }
    section { margin-top: 16px; break-inside: avoid; }
    h2 { margin: 0 0 7px; font-size: 11pt; }
    table { width: 100%; border-collapse: collapse; table-layout: auto; }
    th, td { border: 1px solid #d1d5db; padding: 5px 6px; vertical-align: top; }
    th { background: #eef2ff; font-weight: 700; text-align: left; }
    .number { text-align: right; white-space: nowrap; }
    .empty { text-align: center; color: #6b7280; padding: 14px; }
    .two-col { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; align-items: start; }
    .page-break { break-before: page; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  ${buildCompanyHeaderHTML()}
  <h1>${escapeHtml(t('thanhToanDoiTac.report.title'))}</h1>
  <div class="subtitle">${escapeHtml(t('thanhToanDoiTac.report.period'))}: ${escapeHtml(getPeriodLabel(filters, t))} · ${escapeHtml(t('thanhToanDoiTac.report.printedAt'))}: ${escapeHtml(printedAt)}</div>
  <div class="filters">
    <div><strong>${escapeHtml(t('common.status'))}:</strong> ${escapeHtml(getFilterValue(filters.statusLabels, t))}</div>
    <div><strong>${escapeHtml(t('thanhToanDoiTac.form.doiTac'))}:</strong> ${escapeHtml(getFilterValue(filters.doiTacLabels, t))}</div>
    <div><strong>${escapeHtml(t('thanhToanDoiTac.form.donVi'))}:</strong> ${escapeHtml(getFilterValue(filters.donViLabels, t))}</div>
    <div><strong>${escapeHtml(t('thanhToanDoiTac.report.recordCount'))}:</strong> ${list.length}</div>
  </div>
  ${buildKpiHTML(stats, t)}
  <div class="two-col">
    ${buildAmountTableHTML(t('thanhToanDoiTac.stats.byStatus'), statusRows, t)}
    ${buildAmountTableHTML(t('thanhToanDoiTac.stats.byDonVi'), unitRows, t)}
  </div>
  <div class="two-col">
    ${buildAmountTableHTML(t('thanhToanDoiTac.stats.byNhomDoiTac'), nhomRows, t)}
    ${buildAmountTableHTML(t('thanhToanDoiTac.stats.byDoiTac'), partnerRows, t)}
  </div>
  <div class="two-col">
    ${buildMonthTableHTML(t('thanhToanDoiTac.stats.byMonth'), stats.byMonth, t('thanhToanDoiTac.stats.countCol'), false)}
    ${buildMonthTableHTML(t('thanhToanDoiTac.stats.byMonthAmount'), stats.byMonthAmount, t('thanhToanDoiTac.stats.amountCol'), true)}
  </div>
  ${buildDetailTableHTML(list, t)}
</body>
</html>`;
}

export function printThanhToanDoiTacReport(payload: ThanhToanDoiTacReportPayload): void {
  const printWindow = window.open('', '_blank', 'width=1024,height=768');
  if (!printWindow) {
    throw new Error('Unable to open print window');
  }

  printWindow.document.open();
  printWindow.document.write(buildThanhToanDoiTacReportPrintHTML(payload));
  printWindow.document.close();
  printWindow.focus();
  printWindow.onafterprint = () => printWindow.close();
  window.setTimeout(() => {
    printWindow.print();
  }, 250);
}
