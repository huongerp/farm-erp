/**
 * Xuất phiếu lương ra nhiều định dạng: PDF, Excel, Doc
 * PDF dùng html2canvas để hiển thị đúng font tiếng Việt
 * Header: logo + thông tin công ty (từ store Thông tin công ty)
 */
import type { BangLuongRecord } from '../core/types';
import { formatCurrency, formatDateTime, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';

const FONT_STACK = "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif";

function getPayslipData(record: BangLuongRecord) {
  const periodStr = `${record.nam}-${String(record.thang).padStart(2, '0')}`;
  const empLabel = record.ten_nhan_vien
    ? `${record.ten_nhan_vien}${record.ma_nhan_vien ? ` (${record.ma_nhan_vien})` : ''}`
    : record.ma_nhan_vien || '—';
  return { periodStr, empLabel };
}

/** HTML header công ty (logo, tên, địa chỉ, email, SĐT) */
function buildCompanyHeaderHTML(): string {
  const info = useUIStore.getState().companyInfo;
  const logoHtml = info.appLogo
    ? `<img src="${info.appLogo}" alt="Logo" style="width:64px;height:64px;object-fit:contain;flex-shrink:0" />`
    : '';
  const addr = info.address ? `${i18n.t('company.address')}: ${info.address}` : '';
  const contact: string[] = [];
  if (info.email) contact.push(`${i18n.t('company.email')}: ${info.email}`);
  if (info.phone) contact.push(`${i18n.t('company.phone')}: ${info.phone}`);
  const contactLine = contact.join(' · ');
  return `
<div style="display:flex;align-items:flex-start;gap:16px;padding-bottom:16px;margin-bottom:16px;border-bottom:2px solid #333;font-family:${FONT_STACK}">
  ${logoHtml}
  <div style="flex:1;min-width:0">
    <div style="font-size:14pt;font-weight:bold;color:#111;text-transform:uppercase;letter-spacing:0.02em">${info.companyName}</div>
    ${addr ? `<p style="font-size:9pt;color:#444;margin:2px 0 0 0">${addr}</p>` : ''}
    ${contactLine ? `<p style="font-size:9pt;color:#444;margin:2px 0 0 0">${contactLine}</p>` : ''}
  </div>
</div>`;
}

const TABLE_CELL =
  (label: string, value: string) =>
  `<tr><td style="padding:4px 6px;border:1px solid #ddd;font-weight:600;width:40%;color:#444;font-family:${FONT_STACK}">${label}</td><td style="padding:4px 6px;border:1px solid #ddd;font-family:${FONT_STACK}">${value}</td></tr>`;

/** Nội dung HTML cho PDF (chỉ phần body, dùng trong div) */
function buildPayslipBodyHTML(record: BangLuongRecord): string {
  const { periodStr, empLabel } = getPayslipData(record);
  const title = i18n.t('bangLuong.pdf.title');
  const printedAt = formatDateTime(new Date());

  const basicRows = [
    [i18n.t('bangLuong.detail.employee'), empLabel],
    [i18n.t('bangLuong.detail.period'), periodStr],
    [i18n.t('bangLuong.detail.department'), record.ten_phong_ban || '—'],
    [i18n.t('bangLuong.detail.ngayCong'), `${record.ngay_cong} / ${record.ngay_cong_chuan}`],
  ];

  const luongRows = [
    [i18n.t('bangLuong.detail.luongCoBan'), formatCurrency(record.luong_co_ban_tinh)],
    [i18n.t('bangLuong.detail.luongKpi'), formatCurrency(record.luong_kpi_tinh)],
    [
      record.kpi_dat ? i18n.t('bangLuong.detail.kpiDat') : i18n.t('bangLuong.detail.kpiKhongDat'),
      `${record.diem_kpi.toFixed(1)}${record.kpi_dat ? '' : ` (${(record.ty_le_kpi_khong_dat * 100).toFixed(0)}%)`}`,
    ],
    [i18n.t('bangLuong.detail.luongTrachNhiem'), formatCurrency(record.luong_trach_nhiem_tinh)],
    [i18n.t('bangLuong.detail.phuCap'), formatCurrency(record.phu_cap_tinh)],
  ];

  let congTruHTML = '';
  if (record.cong_tru_khac && record.cong_tru_khac.length > 0) {
    const rows = record.cong_tru_khac
      .map(
        (item) =>
          `<tr><td style="font-family:${FONT_STACK}">${item.loai === 'cong' ? i18n.t('bangLuong.detail.cong') : i18n.t('bangLuong.detail.tru')}: ${item.ly_do || '—'}</td><td style="font-family:${FONT_STACK}">${formatCurrency(item.so_tien)}</td></tr>`
      )
      .join('');
    congTruHTML = `
      <table style="width:100%;border-collapse:collapse;margin-top:12px;font-family:${FONT_STACK};font-size:10pt">
        <thead><tr style="background:#3b82f6;color:#fff"><th colspan="2" style="padding:6px;text-align:left;font-size:9pt">${i18n.t('bangLuong.detail.congTruKhac')}</th></tr></thead>
        <tbody>${rows}
        <tr style="font-weight:bold"><td style="font-family:${FONT_STACK}">${i18n.t('bangLuong.store.congTruNetCol')}</td><td style="font-family:${FONT_STACK}">${record.cong_tru_net >= 0 ? '+' : ''}${formatCurrency(record.cong_tru_net)}</td></tr>
        </tbody>
      </table>`;
  }

  return `
<div style="font-family:${FONT_STACK};font-size:10pt;color:#222;padding:20px;min-width:600px">
${buildCompanyHeaderHTML()}
<h1 style="font-size:16pt;text-align:center;margin:0 0 8px;font-family:${FONT_STACK}">${title}</h1>
<p style="font-size:10pt;color:#555;text-align:center;margin-bottom:12px;font-family:${FONT_STACK}">${i18n.t('bangLuong.detail.employee')}: ${empLabel} &bull; ${i18n.t('bangLuong.detail.period')}: ${periodStr}</p>
<hr style="border:0;border-top:1px solid #ccc;margin:12px 0">

<table style="width:100%;border-collapse:collapse;margin-top:12px;font-family:${FONT_STACK};font-size:10pt">
<thead><tr style="background:#3b82f6;color:#fff"><th colspan="2" style="padding:6px;text-align:left;font-size:9pt">${i18n.t('bangLuong.pdf.basicInfo')}</th></tr></thead>
<tbody>${basicRows.map(([l, v]) => TABLE_CELL(l, v)).join('')}</tbody>
</table>

<table style="width:100%;border-collapse:collapse;margin-top:12px;font-family:${FONT_STACK};font-size:10pt">
<thead><tr style="background:#3b82f6;color:#fff"><th colspan="2" style="padding:6px;text-align:left;font-size:9pt">${i18n.t('bangLuong.pdf.salaryBreakdown')}</th></tr></thead>
<tbody>${luongRows.map(([l, v]) => TABLE_CELL(l, v)).join('')}</tbody>
</table>
${congTruHTML}

<table style="width:100%;border-collapse:collapse;margin-top:12px;font-family:${FONT_STACK};font-size:10pt">
<thead><tr style="background:#3b82f6;color:#fff"><th colspan="2" style="padding:6px;text-align:left;font-size:9pt">${i18n.t('bangLuong.detail.tongLuong')}</th></tr></thead>
<tbody><tr><td style="font-weight:bold;padding:4px 6px;border:1px solid #ddd;font-family:${FONT_STACK}">${i18n.t('bangLuong.detail.tongLuong')}</td><td style="font-weight:bold;padding:4px 6px;border:1px solid #ddd;font-family:${FONT_STACK}">${formatCurrency(record.tong_luong)}</td></tr></tbody>
</table>

<table style="width:100%;margin-top:24px;padding-top:16px;font-size:9pt;font-family:${FONT_STACK};border-collapse:collapse">
  <tr>
    <td style="width:25%;text-align:center;vertical-align:top;padding:0 8px"><p style="font-weight:600;color:#374151;margin:0 0 32px 0">${i18n.t('bangLuong.signature.creator')}</p><p style="color:#6b7280;font-style:italic;margin:0">${i18n.t('bangLuong.signature.signHint')}</p></td>
    <td style="width:25%;text-align:center;vertical-align:top;padding:0 8px"><p style="font-weight:600;color:#374151;margin:0 0 32px 0">${i18n.t('bangLuong.signature.checker')}</p><p style="color:#6b7280;font-style:italic;margin:0">${i18n.t('bangLuong.signature.signHint')}</p></td>
    <td style="width:25%;text-align:center;vertical-align:top;padding:0 8px"><p style="font-weight:600;color:#374151;margin:0 0 32px 0">${i18n.t('bangLuong.signature.related')}</p><p style="color:#6b7280;font-style:italic;margin:0">${i18n.t('bangLuong.signature.signHint')}</p></td>
    <td style="width:25%;text-align:center;vertical-align:top;padding:0 8px"><p style="font-weight:600;color:#374151;margin:0 0 32px 0">${i18n.t('bangLuong.signature.approver')}</p><p style="color:#6b7280;font-style:italic;margin:0">${i18n.t('bangLuong.signature.signHint')}</p></td>
  </tr>
</table>

<p style="font-size:7pt;color:#888;margin-top:20px;font-family:${FONT_STACK}">${i18n.t('bangLuong.pdf.printedAt')} ${printedAt}</p>
</div>`;
}

/** HTML đầy đủ cho Doc (file .doc mở bằng Word) */
function buildPayslipFullHTML(record: BangLuongRecord): string {
  const body = buildPayslipBodyHTML(record);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${body}</body></html>`;
}

export type BangLuongExportFormat = 'pdf' | 'excel' | 'doc';

/** Xuất phiếu lương ra PDF (dùng HTML + html2canvas để font tiếng Việt hiển thị đúng) */
export async function exportBangLuongPDF(record: BangLuongRecord): Promise<void> {
  const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:210mm;padding:20px;font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:10pt;background:#fff';
  container.innerHTML = buildPayslipBodyHTML(record);
  document.body.appendChild(container);

  try {
    await doc.html(container, {
      callback: () => {},
      html2canvas: { scale: 0.5, useCORS: true },
      x: 10,
      y: 10,
      width: 190,
      windowWidth: 794,
    });

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } finally {
    document.body.removeChild(container);
  }
}

/** Xuất phiếu lương ra Excel */
export async function exportBangLuongExcel(record: BangLuongRecord): Promise<void> {
  const XLSX = await import('xlsx');
  const { periodStr, empLabel } = getPayslipData(record);
  const info = useUIStore.getState().companyInfo;

  const data: (string | number)[][] = [
    [info.companyName],
    ...(info.address ? [[i18n.t('company.address'), info.address]] : []),
    ...(info.email ? [[i18n.t('company.email'), info.email]] : []),
    ...(info.phone ? [[i18n.t('company.phone'), info.phone]] : []),
    [],
    [i18n.t('bangLuong.pdf.title')],
    [],
    [i18n.t('bangLuong.detail.employee'), empLabel],
    [i18n.t('bangLuong.detail.period'), periodStr],
    [i18n.t('bangLuong.detail.department'), record.ten_phong_ban || '—'],
    [i18n.t('bangLuong.detail.ngayCong'), `${record.ngay_cong} / ${record.ngay_cong_chuan}`],
    [],
    [i18n.t('bangLuong.detail.luongCoBan'), record.luong_co_ban_tinh],
    [i18n.t('bangLuong.detail.luongKpi'), record.luong_kpi_tinh],
    [i18n.t('bangLuong.detail.luongTrachNhiem'), record.luong_trach_nhiem_tinh],
    [i18n.t('bangLuong.detail.phuCap'), record.phu_cap_tinh],
    [],
    [i18n.t('bangLuong.detail.tongLuong'), record.tong_luong],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 30 }, { wch: 25 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Phiếu lương');
  XLSX.writeFile(wb, `Phieu_luong_${empLabel.replace(/\s+/g, '_')}_${periodStr}_${getTodayISODate()}.xlsx`);
}

/** Xuất phiếu lương ra Doc (HTML mở được bằng Word) */
export async function exportBangLuongDoc(record: BangLuongRecord): Promise<void> {
  const { periodStr, empLabel } = getPayslipData(record);
  const html = buildPayslipFullHTML(record);
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Phieu_luong_${empLabel.replace(/\s+/g, '_')}_${periodStr}_${getTodayISODate()}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
