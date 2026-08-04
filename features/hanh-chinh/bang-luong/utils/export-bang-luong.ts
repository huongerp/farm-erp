/**
 * Xuất phiếu lương PDF, Excel, Doc – bám sát layout trang preview (PayslipPreviewContent).
 * Cấu trúc: Header công ty (logo, tên, địa chỉ, liên hệ) → Tiêu đề → Thông tin cơ bản → Chi tiết lương → Cộng trừ (nếu có) → Tổng lương → Chữ ký → In lúc.
 */
import type { BangLuongRecord } from '../core/types';
import { formatCurrency, formatDateTime, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { ensureJsPDFVietnameseFont } from '../../../../lib/jspdf-vietnamese-font';
import { useUIStore } from '../../../../store/useStore';

const FONT_FAMILY = "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif";
const BORDER_COLOR = '#d1d5db';
const HEADER_BG = '#3b82f6';
const LABEL_BG = 'rgba(249,250,251,0.5)';

function getPayslipData(record: BangLuongRecord) {
  const periodStr = `${record.nam}-${String(record.thang).padStart(2, '0')}`;
  const empLabel = record.ten_nhan_vien
    ? `${record.ten_nhan_vien}${record.ma_nhan_vien ? ` (${record.ma_nhan_vien})` : ''}`
    : record.ma_nhan_vien || '—';
  return { periodStr, empLabel };
}

function getCompanyInfo() {
  return useUIStore.getState().companyInfo;
}

/** Ô bảng: nhãn (trái) + giá trị (trái hoặc phải) */
function tableRow(
  label: string,
  value: string | number,
  options: { valueRight?: boolean; valueBold?: boolean; valuePrimary?: boolean } = {}
) {
  const { valueRight, valueBold, valuePrimary } = options;
  const valueStyle = [
    `padding:6px 8px;border:1px solid ${BORDER_COLOR};font-size:10pt;font-family:${FONT_FAMILY}`,
    valueRight ? 'text-align:right' : '',
    valueBold ? 'font-weight:bold' : '',
    valuePrimary ? 'color:#3b82f6' : '',
  ]
    .filter(Boolean)
    .join(';');
  return `<tr>
<td style="width:40%;padding:6px 8px;border:1px solid ${BORDER_COLOR};font-size:10pt;font-weight:600;color:#4b5563;background:${LABEL_BG};font-family:${FONT_FAMILY}">${label}</td>
<td style="${valueStyle}">${value}</td>
</tr>`;
}

/** Bảng có thead 1 dòng (title) */
function tableSection(title: string, rowsHtml: string) {
  return `
<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:10pt;font-family:${FONT_FAMILY}">
<thead>
<tr>
<th colspan="2" style="padding:6px 8px;text-align:left;font-size:9pt;font-weight:bold;background:${HEADER_BG};color:#fff;border:1px solid ${BORDER_COLOR};font-family:${FONT_FAMILY}">${title}</th>
</tr>
</thead>
<tbody>${rowsHtml}</tbody>
</table>`;
}

/** HTML header công ty (logo + tên, địa chỉ, email, SĐT) – giống preview */
function buildCompanyHeaderHTML(): string {
  const info = getCompanyInfo();
  const logoHtml = info.appLogo
    ? `<img src="${info.appLogo}" alt="Logo" style="width:64px;height:64px;object-fit:contain;flex-shrink:0" />`
    : '';
  const addr = info.address ? `${i18n.t('company.address')}: ${info.address}` : '';
  const parts: string[] = [];
  if (info.email) parts.push(`${i18n.t('company.email')}: ${info.email}`);
  if (info.phone) parts.push(`${i18n.t('company.phone')}: ${info.phone}`);
  const contactLine = parts.join(' · ');
  return `
<div style="display:flex;align-items:flex-start;gap:16px;padding-bottom:16px;margin-bottom:16px;border-bottom:2px solid ${BORDER_COLOR};font-family:${FONT_FAMILY}">
  ${logoHtml}
  <div style="flex:1;min-width:0">
    <div style="font-size:14pt;font-weight:bold;color:#111;text-transform:uppercase;letter-spacing:0.02em;font-family:${FONT_FAMILY}">${info.companyName}</div>
    ${addr ? `<p style="font-size:9pt;color:#4b5563;margin:2px 0 0 0;font-family:${FONT_FAMILY}">${addr}</p>` : ''}
    ${contactLine ? `<p style="font-size:9pt;color:#4b5563;margin:2px 0 0 0;font-family:${FONT_FAMILY}">${contactLine}</p>` : ''}
  </div>
</div>`;
}

/** Nội dung body phiếu lương (HTML) – cấu trúc giống PayslipPreviewContent */
function buildPayslipBodyHTML(record: BangLuongRecord): string {
  const { periodStr, empLabel } = getPayslipData(record);
  const title = i18n.t('bangLuong.pdf.title');
  const printedAt = formatDateTime(new Date());

  const basicRows = tableSection(
    i18n.t('bangLuong.pdf.basicInfo'),
    [
      tableRow(i18n.t('bangLuong.detail.employee'), empLabel),
      tableRow(i18n.t('bangLuong.detail.period'), periodStr),
      tableRow(i18n.t('bangLuong.detail.department'), record.ten_phong_ban || '—'),
      tableRow(i18n.t('bangLuong.detail.ngayCong'), `${record.ngay_cong} / ${record.ngay_cong_chuan}`),
    ].join('')
  );

  const kpiLabel = record.kpi_dat
    ? i18n.t('bangLuong.detail.kpiDat')
    : i18n.t('bangLuong.detail.kpiKhongDat');
  const kpiValue = `${record.diem_kpi.toFixed(1)}${record.kpi_dat ? '' : ` (${(record.ty_le_kpi_khong_dat * 100).toFixed(0)}%)`}`;
  const salaryRows = tableSection(
    i18n.t('bangLuong.pdf.salaryBreakdown'),
    [
      tableRow(i18n.t('bangLuong.detail.luongCoBan'), formatCurrency(record.luong_co_ban_tinh), { valueRight: true }),
      tableRow(i18n.t('bangLuong.detail.luongKpi'), formatCurrency(record.luong_kpi_tinh), { valueRight: true }),
      tableRow(kpiLabel, kpiValue),
      tableRow(i18n.t('bangLuong.detail.luongTrachNhiem'), formatCurrency(record.luong_trach_nhiem_tinh), { valueRight: true }),
      tableRow(i18n.t('bangLuong.detail.phuCap'), formatCurrency(record.phu_cap_tinh), { valueRight: true }),
    ].join('')
  );

  let congTruHTML = '';
  if (record.cong_tru_khac && record.cong_tru_khac.length > 0) {
    const rows = record.cong_tru_khac
      .map((item) =>
        tableRow(
          `${item.loai === 'cong' ? i18n.t('bangLuong.detail.cong') : i18n.t('bangLuong.detail.tru')}: ${item.ly_do || '—'}`,
          formatCurrency(item.so_tien),
          { valueRight: true }
        )
      )
      .join('');
    const netRow = tableRow(
      i18n.t('bangLuong.store.congTruNetCol'),
      `${record.cong_tru_net >= 0 ? '+' : ''}${formatCurrency(record.cong_tru_net)}`,
      { valueRight: true, valueBold: true }
    );
    congTruHTML = tableSection(i18n.t('bangLuong.detail.congTruKhac'), rows + netRow);
  }

  const tongLuongTable = tableSection(
    i18n.t('bangLuong.detail.tongLuong'),
    tableRow(i18n.t('bangLuong.detail.tongLuong'), formatCurrency(record.tong_luong), {
      valueRight: true,
      valueBold: true,
      valuePrimary: true,
    })
  );

  const signatureRow = `
<tr>
  <td style="width:25%;text-align:center;vertical-align:top;padding:0 8px;font-family:${FONT_FAMILY}">
    <p style="font-weight:600;color:#374151;margin:0 0 32px 0;font-size:9pt">${i18n.t('bangLuong.signature.creator')}</p>
    <p style="color:#6b7280;font-style:italic;margin:0;font-size:9pt">${i18n.t('bangLuong.signature.signHint')}</p>
  </td>
  <td style="width:25%;text-align:center;vertical-align:top;padding:0 8px;font-family:${FONT_FAMILY}">
    <p style="font-weight:600;color:#374151;margin:0 0 32px 0;font-size:9pt">${i18n.t('bangLuong.signature.checker')}</p>
    <p style="color:#6b7280;font-style:italic;margin:0;font-size:9pt">${i18n.t('bangLuong.signature.signHint')}</p>
  </td>
  <td style="width:25%;text-align:center;vertical-align:top;padding:0 8px;font-family:${FONT_FAMILY}">
    <p style="font-weight:600;color:#374151;margin:0 0 32px 0;font-size:9pt">${i18n.t('bangLuong.signature.related')}</p>
    <p style="color:#6b7280;font-style:italic;margin:0;font-size:9pt">${i18n.t('bangLuong.signature.signHint')}</p>
  </td>
  <td style="width:25%;text-align:center;vertical-align:top;padding:0 8px;font-family:${FONT_FAMILY}">
    <p style="font-weight:600;color:#374151;margin:0 0 32px 0;font-size:9pt">${i18n.t('bangLuong.signature.approver')}</p>
    <p style="color:#6b7280;font-style:italic;margin:0;font-size:9pt">${i18n.t('bangLuong.signature.signHint')}</p>
  </td>
</tr>`;

  return `
<div style="font-family:${FONT_FAMILY};font-size:10pt;color:#222;padding:20px;min-width:600px;background:#fff">
${buildCompanyHeaderHTML()}
<h1 style="font-size:16pt;text-align:center;margin:0 0 8px;font-weight:bold;font-family:${FONT_FAMILY}">${title}</h1>
<p style="font-size:10pt;color:#6b7280;text-align:center;margin-bottom:12px;font-family:${FONT_FAMILY}">${i18n.t('bangLuong.detail.employee')}: ${empLabel} · ${i18n.t('bangLuong.detail.period')}: ${periodStr}</p>
<hr style="border:0;border-top:1px solid ${BORDER_COLOR};margin:12px 0" />

${basicRows}
${salaryRows}
${congTruHTML}
${tongLuongTable}

<table style="width:100%;margin-top:32px;padding-top:16px;font-size:9pt;font-family:${FONT_FAMILY};border-collapse:collapse">
<tbody>${signatureRow}</tbody>
</table>

<p style="font-size:7pt;color:#9ca3af;margin-top:20px;font-family:${FONT_FAMILY}">${i18n.t('bangLuong.pdf.printedAt')} ${printedAt}</p>
</div>`;
}

/** HTML đầy đủ cho Doc (Word) */
function buildPayslipFullHTML(record: BangLuongRecord): string {
  const body = buildPayslipBodyHTML(record);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${i18n.t('bangLuong.pdf.title')}</title></head><body>${body}</body></html>`;
}

export type BangLuongExportFormat = 'pdf' | 'excel' | 'doc';

/** Xuất phiếu lương PDF – nội dung giống preview, in đúng font tiếng Việt */
export async function exportBangLuongPDF(record: BangLuongRecord): Promise<void> {
  const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  await ensureJsPDFVietnameseFont(doc);

  const container = document.createElement('div');
  container.style.cssText = `position:absolute;left:0;top:0;width:210mm;padding:20px;font-family:${FONT_FAMILY};font-size:10pt;background:#fff;box-sizing:border-box`;
  container.innerHTML = buildPayslipBodyHTML(record);
  document.body.appendChild(container);

  try {
    await doc.html(container, {
      callback: () => {},
      html2canvas: { useCORS: true, logging: false },
      x: 10,
      y: 10,
      width: 190,
      windowWidth: 794,
    });
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const { empLabel, periodStr } = getPayslipData(record);
    a.download = `Phieu_luong_${sanitizeFileName(empLabel)}_${periodStr}_${getTodayISODate()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(container);
  }
}

function sanitizeFileName(s: string): string {
  return s.replace(/\s+/g, '_').replace(/[<>:"/\\|?*]/g, '');
}

/** Xuất phiếu lương Excel – bố cục theo từng block giống preview, số tiền format VND */
export async function exportBangLuongExcel(record: BangLuongRecord): Promise<void> {
  const XLSX = await import('xlsx');
  const { periodStr, empLabel } = getPayslipData(record);
  const info = getCompanyInfo();

  const rows: (string | number)[][] = [];

  rows.push([info.companyName]);
  if (info.address) rows.push([i18n.t('company.address'), info.address]);
  if (info.email) rows.push([i18n.t('company.email'), info.email]);
  if (info.phone) rows.push([i18n.t('company.phone'), info.phone]);
  rows.push([]);

  rows.push([i18n.t('bangLuong.pdf.title')]);
  rows.push([i18n.t('bangLuong.detail.employee'), empLabel]);
  rows.push([i18n.t('bangLuong.detail.period'), periodStr]);
  rows.push([]);

  rows.push([i18n.t('bangLuong.pdf.basicInfo')]);
  rows.push([i18n.t('bangLuong.detail.employee'), empLabel]);
  rows.push([i18n.t('bangLuong.detail.period'), periodStr]);
  rows.push([i18n.t('bangLuong.detail.department'), record.ten_phong_ban || '—']);
  rows.push([i18n.t('bangLuong.detail.ngayCong'), `${record.ngay_cong} / ${record.ngay_cong_chuan}`]);
  rows.push([]);

  const kpiLabel = record.kpi_dat ? i18n.t('bangLuong.detail.kpiDat') : i18n.t('bangLuong.detail.kpiKhongDat');
  const kpiVal = `${record.diem_kpi.toFixed(1)}${record.kpi_dat ? '' : ` (${(record.ty_le_kpi_khong_dat * 100).toFixed(0)}%)`}`;
  rows.push([i18n.t('bangLuong.pdf.salaryBreakdown')]);
  rows.push([i18n.t('bangLuong.detail.luongCoBan'), record.luong_co_ban_tinh]);
  rows.push([i18n.t('bangLuong.detail.luongKpi'), record.luong_kpi_tinh]);
  rows.push([kpiLabel, kpiVal]);
  rows.push([i18n.t('bangLuong.detail.luongTrachNhiem'), record.luong_trach_nhiem_tinh]);
  rows.push([i18n.t('bangLuong.detail.phuCap'), record.phu_cap_tinh]);
  rows.push([]);

  if (record.cong_tru_khac && record.cong_tru_khac.length > 0) {
    rows.push([i18n.t('bangLuong.detail.congTruKhac')]);
    record.cong_tru_khac.forEach((item) => {
      const loai = item.loai === 'cong' ? i18n.t('bangLuong.detail.cong') : i18n.t('bangLuong.detail.tru');
      rows.push([`${loai}: ${item.ly_do || '—'}`, item.loai === 'cong' ? item.so_tien : -item.so_tien]);
    });
    rows.push([i18n.t('bangLuong.store.congTruNetCol'), record.cong_tru_net]);
    rows.push([]);
  }

  rows.push([i18n.t('bangLuong.detail.tongLuong'), record.tong_luong]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 36 }, { wch: 28 }];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = range.s.r; R <= range.e.r; R++) {
    const cell = ws[XLSX.utils.encode_cell({ r: R, c: 1 })];
    if (cell && typeof cell.v === 'number') cell.z = '#,##0';
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Phieu luong');
  const filename = `Phieu_luong_${sanitizeFileName(empLabel)}_${periodStr}_${getTodayISODate()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/** Xuất phiếu lương Doc (HTML mở bằng Word) – layout giống preview */
export async function exportBangLuongDoc(record: BangLuongRecord): Promise<void> {
  const { periodStr, empLabel } = getPayslipData(record);
  const html = buildPayslipFullHTML(record);
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Phieu_luong_${sanitizeFileName(empLabel)}_${periodStr}_${getTodayISODate()}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
