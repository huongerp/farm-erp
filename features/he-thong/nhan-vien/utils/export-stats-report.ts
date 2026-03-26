/**
 * Export Employee Stats report to Excel (.xlsx) and PDF.
 * Includes metadata: date range, filters, exported at.
 */
import type { StatsExportMeta } from '../core/stats-types';
import type { DeptSummaryRow } from '../core/stats-types';
import type { KpiItem } from '../core/stats-types';
import { getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { ensureJsPDFVietnameseFont, JSPDF_VI_FONT_FAMILY } from '../../../../lib/jspdf-vietnamese-font';

const PRIMARY_COLOR: [number, number, number] = [59, 130, 246];

function buildMetaRows(meta: StatsExportMeta): string[][] {
  return [
    [i18n.t('employee.report.title'), ''],
    [i18n.t('employee.report.period'), meta.dateRangeLabel],
    [i18n.t('employee.report.departmentFilter'), meta.filterDeptLabels.length ? meta.filterDeptLabels.join(', ') : i18n.t('employee.report.allFilter')],
    [i18n.t('employee.report.statusFilter'), meta.filterStatusLabels.length ? meta.filterStatusLabels.join(', ') : i18n.t('employee.report.allFilter')],
    [i18n.t('employee.report.exportDate'), meta.exportedAt],
    ['', ''],
  ];
}

/**
 * Export stats to Excel: sheet "Tổng quan" (meta + KPIs) and "Theo phòng ban" (dept table).
 */
export async function exportStatsToExcel(
  meta: StatsExportMeta,
  kpis: KpiItem[],
  deptSummary: DeptSummaryRow[]
): Promise<void> {
  const XLSX = await import('xlsx');

  const overviewRows: string[][] = [
    ...buildMetaRows(meta),
    [i18n.t('employee.report.indicator'), i18n.t('employee.report.value'), i18n.t('employee.report.ratio')],
    ...kpis.map((k) => [k.label, String(k.value), k.pct ?? '']),
  ];

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  wsOverview['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 10 }];

  const deptRows: string[][] = [
    [i18n.t('employee.stats.department'), i18n.t('employee.stats.total'), i18n.t('employee.stats.workingShort'), i18n.t('employee.stats.probation'), i18n.t('employee.stats.leave'), i18n.t('employee.report.activeRatePercent')],
    ...deptSummary.map((r) => [
      r.name,
      String(r.total),
      String(r.active),
      String(r.probation),
      String(r.inactive),
      r.rate,
    ]),
  ];

  const wsDept = XLSX.utils.aoa_to_sheet(deptRows);
  wsDept['!cols'] = [{ wch: 24 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 12 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsOverview, i18n.t('employee.report.overviewSheet'));
  XLSX.utils.book_append_sheet(wb, wsDept, i18n.t('employee.report.byDepartmentSheet'));

  const dateStr = getTodayISODate();
  XLSX.writeFile(wb, `Bao_cao_Thong_ke_Nhan_su_${dateStr}.xlsx`);
}

/**
 * Export stats to PDF: title, meta, KPI table, dept table.
 */
export async function exportStatsToPdf(
  meta: StatsExportMeta,
  kpis: KpiItem[],
  deptSummary: DeptSummaryRow[]
): Promise<void> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  await ensureJsPDFVietnameseFont(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  let y = 14;

  doc.setFontSize(14);
  doc.setFont(JSPDF_VI_FONT_FAMILY, 'bold');
  doc.text(i18n.t('employee.report.pdfTitle'), pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(9);
  doc.setFont(JSPDF_VI_FONT_FAMILY, 'normal');
  doc.setTextColor(100);
  doc.text(`${i18n.t('employee.report.pdfPeriod')} ${meta.dateRangeLabel}  •  ${i18n.t('employee.report.pdfExportDate')} ${meta.exportedAt}`, pageWidth / 2, y, { align: 'center' });
  doc.setTextColor(0);
  y += 6;

  if (meta.filterDeptLabels.length || meta.filterStatusLabels.length) {
    const filterParts = [];
    if (meta.filterDeptLabels.length) filterParts.push(`${i18n.t('employee.report.pdfDepartment')} ${meta.filterDeptLabels.join(', ')}`);
    if (meta.filterStatusLabels.length) filterParts.push(`${i18n.t('employee.report.pdfStatus')} ${meta.filterStatusLabels.join(', ')}`);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(filterParts.join('  •  '), marginX, y);
    doc.setTextColor(0);
    y += 5;
  }

  y += 2;

  autoTable(doc, {
    startY: y,
    head: [[i18n.t('employee.report.indicator'), i18n.t('employee.report.value'), i18n.t('employee.report.ratio')]],
    body: kpis.map((k) => [k.label, String(k.value), k.pct ?? '—']),
    theme: 'grid',
    styles: { font: JSPDF_VI_FONT_FAMILY, fontSize: 8, cellPadding: 2 },
    headStyles: { font: JSPDF_VI_FONT_FAMILY, fillColor: PRIMARY_COLOR, fontSize: 8, fontStyle: 'bold', textColor: 255 },
    margin: { left: marginX, right: marginX },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  if (deptSummary.length > 0) {
    if (y > 220) {
      doc.addPage();
      y = 14;
    }
    doc.setFontSize(10);
    doc.setFont(JSPDF_VI_FONT_FAMILY, 'bold');
    doc.text(i18n.t('employee.report.pdfByDepartment'), marginX, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [[i18n.t('employee.stats.department'), i18n.t('employee.stats.total'), i18n.t('employee.stats.workingShort'), i18n.t('employee.stats.probation'), i18n.t('employee.stats.leave'), i18n.t('employee.report.activeRatePercent')]],
      body: deptSummary.map((r) => [r.name, String(r.total), String(r.active), String(r.probation), String(r.inactive), r.rate]),
      theme: 'grid',
      styles: { font: JSPDF_VI_FONT_FAMILY, fontSize: 7, cellPadding: 2 },
      headStyles: { font: JSPDF_VI_FONT_FAMILY, fillColor: PRIMARY_COLOR, fontSize: 7, fontStyle: 'bold', textColor: 255 },
      margin: { left: marginX, right: marginX },
    });
  }

  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
}
