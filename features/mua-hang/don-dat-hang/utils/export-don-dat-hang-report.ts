import type { TFunction } from 'i18next';
import type { WorkSheet } from 'xlsx';
import { formatDate, formatDateTime, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';
import { TRANG_THAI_KEY } from '../core/constants';
import type { ChiTietDonDatHangFlat, DonDatHang } from '../core/types';
import type {
  DonDatHangStatsByTrangThai,
  DonDatHangStatsSummary,
  StatsChartItem,
} from '../components/stats/useDonDatHangStats';
import {
  CHI_TIET_DON_DAT_HANG_EXPORT_KEYS,
  DON_DAT_HANG_LIST_EXPORT_KEYS,
  mapChiTietDonDatHangFlatRow,
  mapDonDatHangListRow,
} from './export-don-dat-hang-danh-sach';
import { fetchAllChiTietDonDatHangForListQuery } from '../services/don-dat-hang-service';
import type { DonDatHangListServerQuery } from '../services/don-dat-hang-list-query';

const FONT_STACK = "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif";
const FILENAME_PREFIX = 'bao_cao_don_dat_hang';

export interface DonDatHangCategoryReportStats {
  byDanhMucCap1: StatsChartItem[];
  byDanhMucCap2: StatsChartItem[];
  byPhanLoai: StatsChartItem[];
}

export interface DonDatHangReportStats {
  summary: DonDatHangStatsSummary;
  byTrangThai: DonDatHangStatsByTrangThai[];
  bySupplier: StatsChartItem[];
  byBuyer: StatsChartItem[];
  byMonth: StatsChartItem[];
  categoryStats?: DonDatHangCategoryReportStats | null;
}

export interface DonDatHangReportFilters {
  dateFrom?: string;
  dateTo?: string;
  statusLabels: string[];
  supplierLabels: string[];
  buyerLabels: string[];
  statusValues: string[];
  supplierValues: string[];
  buyerValues: string[];
}

export interface DonDatHangReportPayload {
  list: DonDatHang[];
  stats: DonDatHangReportStats;
  filters: DonDatHangReportFilters;
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

function getPeriodLabel(filters: DonDatHangReportFilters, t: TFunction): string {
  if (filters.dateFrom && filters.dateTo) {
    return `${formatDate(filters.dateFrom)} - ${formatDate(filters.dateTo)}`;
  }
  if (filters.dateFrom) return `${t('donDatHang.report.fromDate')}: ${formatDate(filters.dateFrom)}`;
  if (filters.dateTo) return `${t('donDatHang.report.toDate')}: ${formatDate(filters.dateTo)}`;
  return t('donDatHang.report.allPeriods');
}

function getFilterValue(labels: string[], t: TFunction): string {
  return labels.length > 0 ? labels.join(', ') : t('donDatHang.report.all');
}

function getPeriodSuffix(filters: DonDatHangReportFilters): string {
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

function summaryRows(stats: DonDatHangReportStats, t: TFunction): Array<[string, string | number]> {
  return [
    [t('donDatHang.stats.total'), stats.summary.total],
    [t('donDatHang.status.draft'), stats.summary.draft],
    [t('donDatHang.stats.inProgress'), stats.summary.inProgress],
    [t('donDatHang.stats.completed'), stats.summary.completed],
    [t('donDatHang.status.cancelled'), stats.summary.cancelled],
  ];
}

function statusLabel(row: DonDatHangStatsByTrangThai, t: TFunction): string {
  return t(`donDatHang.${row.ten}`);
}

function buildStatsListQuery(filters: DonDatHangReportFilters): DonDatHangListServerQuery {
  const toNum = (ids: string[]) =>
    [...new Set(ids.map((x) => Number(x)).filter((n) => !Number.isNaN(n)))].sort((a, b) => a - b);
  return {
    searchTerm: '',
    trangThaiViet: [...filters.statusValues],
    idNhaCungCap: toNum(filters.supplierValues),
    idKhoNhan: [],
    idNguoiDat: toNum(filters.buyerValues),
    idDanhMucCap1: [],
    idDanhMucCap2: [],
    phanLoai: [],
    idHangHoaByProductFilters: null,
    scope: { viewAll: true, viewByBranch: false, allowedKhoNumericIds: [], ownEmployeeIdNum: null },
  };
}

function filterChiTietByDate(rows: ChiTietDonDatHangFlat[], filters: DonDatHangReportFilters): ChiTietDonDatHangFlat[] {
  if (!filters.dateFrom && !filters.dateTo) return rows;
  return rows.filter((r) => {
    const matchFrom = !filters.dateFrom || (r.ngay_dat && r.ngay_dat >= filters.dateFrom);
    const matchTo = !filters.dateTo || (r.ngay_dat && r.ngay_dat <= filters.dateTo);
    return matchFrom && matchTo;
  });
}

async function fetchChiTietForReport(filters: DonDatHangReportFilters): Promise<ChiTietDonDatHangFlat[]> {
  const rows = await fetchAllChiTietDonDatHangForListQuery(buildStatsListQuery(filters));
  return filterChiTietByDate(rows, filters);
}

function countTableHeaders(t: TFunction): string[] {
  return [t('donDatHang.stats.itemNameCol'), t('donDatHang.stats.countCol')];
}

function countTableRows(data: StatsChartItem[], t: TFunction): Array<Record<string, string | number>> {
  return data.map((row) => ({
    [t('donDatHang.stats.itemNameCol')]: row.name,
    [t('donDatHang.stats.countCol')]: row.value,
  }));
}

export async function exportDonDatHangReportToXLSX({
  list,
  stats,
  filters,
  t = i18n.t.bind(i18n),
}: DonDatHangReportPayload): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const exportedAt = formatDateTime(new Date());
  const chiTietRows = await fetchChiTietForReport(filters);

  const overviewRows: Array<Array<string | number>> = [
    [t('donDatHang.report.title')],
    [],
    [t('donDatHang.report.period'), getPeriodLabel(filters, t)],
    [t('donDatHang.report.exportedAt'), exportedAt],
    [t('common.status'), getFilterValue(filters.statusLabels, t)],
    [t('donDatHang.form.supplier'), getFilterValue(filters.supplierLabels, t)],
    [t('donDatHang.form.buyer'), getFilterValue(filters.buyerLabels, t)],
    [t('donDatHang.report.recordCount'), list.length],
    [],
    [t('donDatHang.report.kpi'), t('donDatHang.report.value')],
    ...summaryRows(stats, t),
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  setColumnWidths(wsOverview, [28, 38]);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'TongQuan');

  const listHeaders = DON_DAT_HANG_LIST_EXPORT_KEYS.map((key) => t(`donDatHang.export.list.${key}`));
  const listRows = list.map((item) => {
    const mapped = mapDonDatHangListRow(item);
    const row: Record<string, string | number> = {};
    DON_DAT_HANG_LIST_EXPORT_KEYS.forEach((key) => {
      row[t(`donDatHang.export.list.${key}`)] = (mapped[key] as string | number) ?? '';
    });
    return row;
  });
  const wsList = sheetFromRows(XLSX, listRows, listHeaders);
  setColumnWidths(wsList, DON_DAT_HANG_LIST_EXPORT_KEYS.map(() => 16));
  XLSX.utils.book_append_sheet(wb, wsList, 'DanhSach');

  const statusHeaders = [t('donDatHang.stats.nameCol'), t('donDatHang.stats.countCol')];
  const statusRows = stats.byTrangThai.map((row) => ({
    [t('donDatHang.stats.nameCol')]: statusLabel(row, t),
    [t('donDatHang.stats.countCol')]: row.count,
  }));
  const wsStatus = sheetFromRows(XLSX, statusRows, statusHeaders);
  setColumnWidths(wsStatus, [24, 14]);
  XLSX.utils.book_append_sheet(wb, wsStatus, 'TheoTrangThai');

  const wsSupplier = sheetFromRows(XLSX, countTableRows(stats.bySupplier, t), countTableHeaders(t));
  setColumnWidths(wsSupplier, [32, 14]);
  XLSX.utils.book_append_sheet(wb, wsSupplier, 'TheoNhaCungCap');

  const wsBuyer = sheetFromRows(XLSX, countTableRows(stats.byBuyer, t), countTableHeaders(t));
  setColumnWidths(wsBuyer, [32, 14]);
  XLSX.utils.book_append_sheet(wb, wsBuyer, 'TheoNguoiDat');

  const monthHeaders = [t('donDatHang.report.month'), t('donDatHang.stats.countCol')];
  const monthRows = stats.byMonth.map((row) => ({
    [t('donDatHang.report.month')]: row.name,
    [t('donDatHang.stats.countCol')]: row.value,
  }));
  const wsMonth = sheetFromRows(XLSX, monthRows, monthHeaders);
  setColumnWidths(wsMonth, [18, 14]);
  XLSX.utils.book_append_sheet(wb, wsMonth, 'TheoThang');

  const cat = stats.categoryStats;
  if (cat) {
    const wsCap1 = sheetFromRows(XLSX, countTableRows(cat.byDanhMucCap1, t), countTableHeaders(t));
    setColumnWidths(wsCap1, [32, 14]);
    XLSX.utils.book_append_sheet(wb, wsCap1, 'TheoDanhMucCap1');

    const wsCap2 = sheetFromRows(XLSX, countTableRows(cat.byDanhMucCap2, t), countTableHeaders(t));
    setColumnWidths(wsCap2, [32, 14]);
    XLSX.utils.book_append_sheet(wb, wsCap2, 'TheoDanhMucCap2');

    const wsPl = sheetFromRows(XLSX, countTableRows(cat.byPhanLoai, t), countTableHeaders(t));
    setColumnWidths(wsPl, [32, 14]);
    XLSX.utils.book_append_sheet(wb, wsPl, 'TheoPhanLoai');
  }

  const chiTietHeaders = CHI_TIET_DON_DAT_HANG_EXPORT_KEYS.map((key) => t(`donDatHang.export.chiTiet.${key}`));
  const chiTietSheetRows = chiTietRows.map((row) => {
    const mapped = mapChiTietDonDatHangFlatRow(row);
    const out: Record<string, string | number> = {};
    CHI_TIET_DON_DAT_HANG_EXPORT_KEYS.forEach((key) => {
      out[t(`donDatHang.export.chiTiet.${key}`)] = (mapped[key] as string | number) ?? '';
    });
    return out;
  });
  const wsChiTiet = sheetFromRows(XLSX, chiTietSheetRows, chiTietHeaders);
  setColumnWidths(wsChiTiet, CHI_TIET_DON_DAT_HANG_EXPORT_KEYS.map(() => 14));
  XLSX.utils.book_append_sheet(wb, wsChiTiet, 'ChiTiet');

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

function buildKpiHTML(stats: DonDatHangReportStats, t: TFunction): string {
  const rows = summaryRows(stats, t);
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

function buildCountTableHTML(title: string, rows: StatsChartItem[], t: TFunction): string {
  return `
<section>
  <h2>${escapeHtml(title)}</h2>
  <table>
    <thead>
      <tr>
        <th>${escapeHtml(t('donDatHang.stats.itemNameCol'))}</th>
        <th class="number">${escapeHtml(t('donDatHang.stats.countCol'))}</th>
      </tr>
    </thead>
    <tbody>
      ${
        rows.length === 0
          ? `<tr><td colspan="2" class="empty">${escapeHtml(t('donDatHang.stats.noData'))}</td></tr>`
          : rows
              .map(
                (row) => `
        <tr>
          <td>${escapeHtml(row.name)}</td>
          <td class="number">${row.value}</td>
        </tr>`
              )
              .join('')
      }
    </tbody>
  </table>
</section>`;
}

function buildStatusTableHTML(rows: DonDatHangStatsByTrangThai[], t: TFunction): string {
  return `
<section>
  <h2>${escapeHtml(t('donDatHang.stats.byStatus'))}</h2>
  <table>
    <thead>
      <tr>
        <th>${escapeHtml(t('donDatHang.stats.nameCol'))}</th>
        <th class="number">${escapeHtml(t('donDatHang.stats.countCol'))}</th>
      </tr>
    </thead>
    <tbody>
      ${
        rows.length === 0
          ? `<tr><td colspan="2" class="empty">${escapeHtml(t('donDatHang.stats.noData'))}</td></tr>`
          : rows
              .map(
                (row) => `
        <tr>
          <td>${escapeHtml(statusLabel(row, t))}</td>
          <td class="number">${row.count}</td>
        </tr>`
              )
              .join('')
      }
    </tbody>
  </table>
</section>`;
}

function buildMonthTableHTML(rows: StatsChartItem[], t: TFunction): string {
  return `
<section>
  <h2>${escapeHtml(t('donDatHang.stats.byMonth'))}</h2>
  <table>
    <thead>
      <tr>
        <th>${escapeHtml(t('donDatHang.report.month'))}</th>
        <th class="number">${escapeHtml(t('donDatHang.stats.countCol'))}</th>
      </tr>
    </thead>
    <tbody>
      ${
        rows.length === 0
          ? `<tr><td colspan="2" class="empty">${escapeHtml(t('donDatHang.stats.noData'))}</td></tr>`
          : rows
              .map(
                (row) => `
        <tr>
          <td>${escapeHtml(row.name)}</td>
          <td class="number">${row.value}</td>
        </tr>`
              )
              .join('')
      }
    </tbody>
  </table>
</section>`;
}

function buildDetailTableHTML(list: DonDatHang[], t: TFunction): string {
  const rows = list
    .map(
      (item, index) => `
    <tr>
      <td class="number">${index + 1}</td>
      <td>${escapeHtml(item.so_po)}</td>
      <td>${escapeHtml(item.ngay_dat ? formatDate(item.ngay_dat) : '')}</td>
      <td>${escapeHtml(item.ngay_giao_dk ? formatDate(item.ngay_giao_dk) : '')}</td>
      <td>${escapeHtml(item.ten_nha_cung_cap)}</td>
      <td>${escapeHtml(item.ten_kho_nhan)}</td>
      <td>${escapeHtml(item.ten_nguoi_dat)}</td>
      <td>${escapeHtml(
        TRANG_THAI_KEY[item.trang_thai] ? t(`donDatHang.status.${TRANG_THAI_KEY[item.trang_thai]}`) : item.trang_thai
      )}</td>
      <td>${escapeHtml(item.so_phieu_de_xuat)}</td>
    </tr>`
    )
    .join('');

  return `
<section class="page-break">
  <h2>${escapeHtml(t('donDatHang.report.detailList'))}</h2>
  <table>
    <thead>
      <tr>
        <th class="number">#</th>
        <th>${escapeHtml(t('donDatHang.form.code'))}</th>
        <th>${escapeHtml(t('donDatHang.form.orderDate'))}</th>
        <th>${escapeHtml(t('donDatHang.form.deliveryDate'))}</th>
        <th>${escapeHtml(t('donDatHang.form.supplier'))}</th>
        <th>${escapeHtml(t('donDatHang.form.warehouse'))}</th>
        <th>${escapeHtml(t('donDatHang.form.buyer'))}</th>
        <th>${escapeHtml(t('donDatHang.store.statusCol'))}</th>
        <th>${escapeHtml(t('donDatHang.form.linkRequest'))}</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="9" class="empty">${escapeHtml(t('donDatHang.stats.noData'))}</td></tr>`}
    </tbody>
  </table>
</section>`;
}

export function buildDonDatHangReportPrintHTML({
  list,
  stats,
  filters,
  t = i18n.t.bind(i18n),
}: DonDatHangReportPayload): string {
  const printedAt = formatDateTime(new Date());
  const cat = stats.categoryStats;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(t('donDatHang.report.title'))}</title>
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
    .three-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; align-items: start; }
    .page-break { break-before: page; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${buildCompanyHeaderHTML()}
  <h1>${escapeHtml(t('donDatHang.report.title'))}</h1>
  <div class="subtitle">${escapeHtml(t('donDatHang.report.period'))}: ${escapeHtml(getPeriodLabel(filters, t))} · ${escapeHtml(t('donDatHang.report.printedAt'))}: ${escapeHtml(printedAt)}</div>
  <div class="filters">
    <div><strong>${escapeHtml(t('common.status'))}:</strong> ${escapeHtml(getFilterValue(filters.statusLabels, t))}</div>
    <div><strong>${escapeHtml(t('donDatHang.form.supplier'))}:</strong> ${escapeHtml(getFilterValue(filters.supplierLabels, t))}</div>
    <div><strong>${escapeHtml(t('donDatHang.form.buyer'))}:</strong> ${escapeHtml(getFilterValue(filters.buyerLabels, t))}</div>
    <div><strong>${escapeHtml(t('donDatHang.report.recordCount'))}:</strong> ${list.length}</div>
  </div>
  ${buildKpiHTML(stats, t)}
  <div class="two-col">
    ${buildStatusTableHTML(stats.byTrangThai, t)}
    ${buildMonthTableHTML(stats.byMonth, t)}
  </div>
  <div class="two-col">
    ${buildCountTableHTML(t('donDatHang.stats.bySupplier'), stats.bySupplier, t)}
    ${buildCountTableHTML(t('donDatHang.stats.byBuyer'), stats.byBuyer, t)}
  </div>
  ${
    cat
      ? `<div class="three-col">
    ${buildCountTableHTML(t('donDatHang.stats.byDanhMucCap1'), cat.byDanhMucCap1, t)}
    ${buildCountTableHTML(t('donDatHang.stats.byDanhMucCap2'), cat.byDanhMucCap2, t)}
    ${buildCountTableHTML(t('donDatHang.stats.byPhanLoai'), cat.byPhanLoai, t)}
  </div>`
      : ''
  }
  ${buildDetailTableHTML(list, t)}
</body>
</html>`;
}

export function printDonDatHangReport(payload: DonDatHangReportPayload): void {
  const printWindow = window.open('', '_blank', 'width=1024,height=768');
  if (!printWindow) {
    throw new Error('Unable to open print window');
  }

  printWindow.document.open();
  printWindow.document.write(buildDonDatHangReportPrintHTML(payload));
  printWindow.document.close();
  printWindow.focus();
  printWindow.onafterprint = () => printWindow.close();
  window.setTimeout(() => {
    printWindow.print();
  }, 250);
}
