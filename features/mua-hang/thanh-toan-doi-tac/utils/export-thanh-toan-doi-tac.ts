/**
 * Xuất thanh toán đối tác ra PDF – header công ty + thông tin phiếu.
 */
import type { ThanhToanDoiTac } from '../core/types';
import { formatDate, formatDateTime, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';

const FONT_STACK = "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif";

function safeStr(v: string | number | null | undefined): string {
  if (v == null) return '—';
  return String(v);
}

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

export function buildThanhToanDoiTacBodyHTML(item: ThanhToanDoiTac): string {
  const t = i18n.t.bind(i18n);
  const title = t('thanhToanDoiTac.preview.title');
  const printedAt = formatDateTime(new Date());
  const subtitle = `${item.so_phieu} · ${item.ten_trang_thai ?? item.id_trang_thai_thanh_toan}`;

  const infoRows: [string, string][] = [
    [t('thanhToanDoiTac.form.soPhieu'), item.so_phieu],
    [t('thanhToanDoiTac.form.hangMuc'), item.hang_muc_thanh_toan],
    [t('thanhToanDoiTac.form.ngay'), formatDate(item.ngay)],
    [t('thanhToanDoiTac.form.donVi'), item.ten_don_vi ?? '—'],
    [t('thanhToanDoiTac.store.nhomDoiTacCol'), item.ten_nhom ?? '—'],
    [t('thanhToanDoiTac.form.doiTac'), item.ten_doi_tac ?? '—'],
    [t('thanhToanDoiTac.form.trangThai'), item.ten_trang_thai ?? '—'],
    [t('thanhToanDoiTac.form.soTien'), item.so_tien != null ? item.so_tien.toLocaleString('vi-VN') : '—'],
    [t('thanhToanDoiTac.form.ngayXuLy'), item.ngay_xu_ly ? formatDate(item.ngay_xu_ly) : '—'],
    [t('thanhToanDoiTac.form.ghiChu'), item.ghi_chu ?? '—'],
    [t('thanhToanDoiTac.form.nguoiTao'), item.ten_nguoi_tao ?? '—'],
  ];

  return `
<div style="font-family:${FONT_STACK};font-size:10pt;color:#222;padding:20px;min-width:600px">
${buildCompanyHeaderHTML()}
<h1 style="font-size:16pt;text-align:center;margin:0 0 8px;font-family:${FONT_STACK}">${title}</h1>
<p style="font-size:10pt;color:#555;text-align:center;margin-bottom:12px;font-family:${FONT_STACK}">${subtitle}</p>
<hr style="border:0;border-top:1px solid #ccc;margin:12px 0" />
<table style="width:100%;border-collapse:collapse;margin-top:12px;font-family:${FONT_STACK};font-size:10pt">
  <thead><tr style="background:#3b82f6;color:#fff"><th colspan="2" style="padding:6px;text-align:left;font-size:9pt">${t('thanhToanDoiTac.detail.basicInfo')}</th></tr></thead>
  <tbody>${infoRows.map(([l, v]) => TABLE_CELL(l, safeStr(v))).join('')}</tbody>
</table>
<p style="font-size:7pt;color:#888;margin-top:20px;font-family:${FONT_STACK}">${t('thanhToanDoiTac.preview.printedAt')} ${printedAt}</p>
</div>`;
}

function getFileName(item: ThanhToanDoiTac): string {
  const slug = item.so_phieu.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Thanh_toan_doi_tac_${slug}_${getTodayISODate()}`;
}

export async function exportThanhToanDoiTacToPDF(item: ThanhToanDoiTac): Promise<void> {
  const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:210mm;padding:20px;font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:10pt;background:#fff';
  container.innerHTML = buildThanhToanDoiTacBodyHTML(item);
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
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getFileName(item)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(container);
  }
}

/** Xuất thanh toán đối tác ra Word */
export function exportThanhToanDoiTacToDoc(item: ThanhToanDoiTac): void {
  const body = buildThanhToanDoiTacBodyHTML(item);
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"></head><body>${body}</body></html>`;
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${getFileName(item)}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Xuất thanh toán đối tác ra Excel */
export async function exportThanhToanDoiTacToXLSX(item: ThanhToanDoiTac): Promise<void> {
  const t = i18n.t.bind(i18n);
  const XLSX = await import('xlsx');
  const rows: (string | number)[][] = [
    [t('thanhToanDoiTac.form.soPhieu'), item.so_phieu],
    [t('thanhToanDoiTac.form.hangMuc'), item.hang_muc_thanh_toan],
    [t('thanhToanDoiTac.form.ngay'), formatDate(item.ngay)],
    [t('thanhToanDoiTac.form.donVi'), item.ten_don_vi ?? '—'],
    [t('thanhToanDoiTac.store.nhomDoiTacCol'), item.ten_nhom ?? '—'],
    [t('thanhToanDoiTac.form.doiTac'), item.ten_doi_tac ?? '—'],
    [t('thanhToanDoiTac.form.trangThai'), item.ten_trang_thai ?? '—'],
    [t('thanhToanDoiTac.form.soTien'), item.so_tien != null ? item.so_tien : '—'],
    [t('thanhToanDoiTac.form.ngayXuLy'), item.ngay_xu_ly ? formatDate(item.ngay_xu_ly) : '—'],
    [t('thanhToanDoiTac.form.ghiChu'), item.ghi_chu ?? '—'],
    [t('thanhToanDoiTac.form.nguoiTao'), item.ten_nguoi_tao ?? '—'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 40 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ThanhToan');
  XLSX.writeFile(wb, `${getFileName(item)}.xlsx`);
}
