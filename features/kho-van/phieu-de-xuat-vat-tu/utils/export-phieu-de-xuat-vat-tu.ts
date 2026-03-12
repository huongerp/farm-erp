/**
 * Xuất phiếu đề xuất vật tư ra PDF – header công ty + thông tin phiếu + bảng chi tiết hàng hóa.
 */
import type { PhieuDeXuatVatTu, PhieuDeXuatVatTuChiTiet } from '../core/types';
import { TRANG_THAI_CHO_DUYET, TRANG_THAI_DA_DUYET, TRANG_THAI_KHONG_DUYET } from '../core/constants';
import { formatDate, formatDateTime, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';

const FONT_STACK = "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif";

function safeStr(v: string | number | null | undefined): string {
  if (v == null) return '—';
  return String(v);
}

function getTrangThaiLabel(trangThai: string, t: (k: string) => string): string {
  if (trangThai === TRANG_THAI_CHO_DUYET) return t('phieuDeXuatVatTu.status.pending');
  if (trangThai === TRANG_THAI_DA_DUYET) return t('phieuDeXuatVatTu.status.approved');
  if (trangThai === TRANG_THAI_KHONG_DUYET) return t('phieuDeXuatVatTu.status.rejected');
  return trangThai;
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

export function buildPhieuDeXuatVatTuBodyHTML(phieu: PhieuDeXuatVatTu, chiTiet: PhieuDeXuatVatTuChiTiet[]): string {
  const t = i18n.t.bind(i18n);
  const title = t('phieuDeXuatVatTu.preview.title');
  const printedAt = formatDateTime(new Date());
  const subtitle = `${phieu.so_phieu} · ${getTrangThaiLabel(phieu.trang_thai, t)}`;

  const infoRows: [string, string][] = [
    [t('phieuDeXuatVatTu.form.code'), phieu.so_phieu],
    [t('phieuDeXuatVatTu.form.date'), formatDate(phieu.ngay)],
    [t('phieuDeXuatVatTu.form.requiredDate'), formatDate(phieu.ngay_can)],
    [t('phieuDeXuatVatTu.form.place'), phieu.ten_noi_de_xuat ?? '—'],
    [t('phieuDeXuatVatTu.form.requester'), phieu.ten_nguoi_de_xuat ?? '—'],
    [t('phieuDeXuatVatTu.form.approver'), phieu.ten_nguoi_duyet ?? '—'],
    [t('phieuDeXuatVatTu.form.notes'), phieu.ghi_chu ?? '—'],
    [t('phieuDeXuatVatTu.store.statusCol'), getTrangThaiLabel(phieu.trang_thai, t)],
  ];

  let section2 = '';
  if (chiTiet.length > 0) {
    const theadCells = [
      '#',
      t('phieuDeXuatVatTu.form.itemCode'),
      t('phieuDeXuatVatTu.form.itemName'),
      t('phieuDeXuatVatTu.form.unit'),
      t('phieuDeXuatVatTu.form.quantity'),
      t('phieuDeXuatVatTu.form.specs'),
      t('phieuDeXuatVatTu.form.note'),
    ]
      .map(
        (text) =>
          `<th style="padding:6px 8px;border:1px solid #ddd;text-align:left;font-size:9pt;font-family:${FONT_STACK};background:#3b82f6;color:#fff">${text}</th>`
      )
      .join('');
    const tbodyRows = chiTiet
      .map(
        (c, idx) =>
          `<tr>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${idx + 1}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(c.ma_hang)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(c.ten_hang)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(c.don_vi_tinh)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${c.so_luong}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(c.thong_so)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(c.ghi_chu)}</td>
          </tr>`
      )
      .join('');
    section2 = `
<table style="width:100%;border-collapse:collapse;margin-top:12px;font-family:${FONT_STACK};font-size:10pt">
  <thead><tr>${theadCells}</tr></thead>
  <tbody>${tbodyRows}</tbody>
</table>`;
  }

  return `
<div style="font-family:${FONT_STACK};font-size:10pt;color:#222;padding:20px;min-width:600px">
${buildCompanyHeaderHTML()}
<h1 style="font-size:16pt;text-align:center;margin:0 0 8px;font-family:${FONT_STACK}">${title}</h1>
<p style="font-size:10pt;color:#555;text-align:center;margin-bottom:12px;font-family:${FONT_STACK}">${subtitle}</p>
<hr style="border:0;border-top:1px solid #ccc;margin:12px 0" />
<table style="width:100%;border-collapse:collapse;margin-top:12px;font-family:${FONT_STACK};font-size:10pt">
  <thead><tr style="background:#3b82f6;color:#fff"><th colspan="2" style="padding:6px;text-align:left;font-size:9pt">${t('phieuDeXuatVatTu.detail.basicInfo')}</th></tr></thead>
  <tbody>${infoRows.map(([l, v]) => TABLE_CELL(l, safeStr(v))).join('')}</tbody>
</table>
${chiTiet.length > 0 ? `<h2 style="font-size:11pt;margin:16px 0 8px;font-family:${FONT_STACK}">${t('phieuDeXuatVatTu.form.itemsSection')}</h2>${section2}` : ''}
<p style="font-size:7pt;color:#888;margin-top:20px;font-family:${FONT_STACK}">${t('phieuDeXuatVatTu.preview.printedAt')} ${printedAt}</p>
</div>`;
}

function getFileName(phieu: PhieuDeXuatVatTu): string {
  const slug = phieu.so_phieu.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Phieu_de_xuat_vat_tu_${slug}_${getTodayISODate()}`;
}

export async function exportPhieuDeXuatVatTuToPDF(
  phieu: PhieuDeXuatVatTu,
  chiTiet: PhieuDeXuatVatTuChiTiet[]
): Promise<void> {
  const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:210mm;padding:20px;font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:10pt;background:#fff';
  container.innerHTML = buildPhieuDeXuatVatTuBodyHTML(phieu, chiTiet);
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
    a.download = `${getFileName(phieu)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(container);
  }
}

/** Xuất phiếu đề xuất vật tư ra Word (HTML mở được bằng Word) */
export function exportPhieuDeXuatVatTuToDoc(
  phieu: PhieuDeXuatVatTu,
  chiTiet: PhieuDeXuatVatTuChiTiet[]
): void {
  const body = buildPhieuDeXuatVatTuBodyHTML(phieu, chiTiet);
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"></head><body>${body}</body></html>`;
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${getFileName(phieu)}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Xuất phiếu đề xuất vật tư ra Excel */
export async function exportPhieuDeXuatVatTuToXLSX(
  phieu: PhieuDeXuatVatTu,
  chiTiet: PhieuDeXuatVatTuChiTiet[]
): Promise<void> {
  const t = i18n.t.bind(i18n);
  const XLSX = await import('xlsx');
  const infoRows: (string | number)[][] = [
    [t('phieuDeXuatVatTu.form.code'), phieu.so_phieu],
    [t('phieuDeXuatVatTu.form.date'), formatDate(phieu.ngay)],
    [t('phieuDeXuatVatTu.form.requiredDate'), formatDate(phieu.ngay_can)],
    [t('phieuDeXuatVatTu.form.place'), phieu.ten_noi_de_xuat ?? '—'],
    [t('phieuDeXuatVatTu.form.requester'), phieu.ten_nguoi_de_xuat ?? '—'],
    [t('phieuDeXuatVatTu.form.approver'), phieu.ten_nguoi_duyet ?? '—'],
    [t('phieuDeXuatVatTu.form.notes'), phieu.ghi_chu ?? '—'],
    [t('phieuDeXuatVatTu.store.statusCol'), getTrangThaiLabel(phieu.trang_thai, t)],
  ];
  const rows: (string | number)[][] = [...infoRows, []];
  if (chiTiet.length > 0) {
    rows.push(
      ['#', t('phieuDeXuatVatTu.form.itemCode'), t('phieuDeXuatVatTu.form.itemName'), t('phieuDeXuatVatTu.form.unit'), t('phieuDeXuatVatTu.form.quantity'), t('phieuDeXuatVatTu.form.specs'), t('phieuDeXuatVatTu.form.note')]
    );
    chiTiet.forEach((c, idx) => {
      rows.push([idx + 1, safeStr(c.ma_hang), safeStr(c.ten_hang), safeStr(c.don_vi_tinh), c.so_luong, safeStr(c.thong_so), safeStr(c.ghi_chu)]);
    });
  }
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 20 }, { wch: 35 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Phieu');
  XLSX.writeFile(wb, `${getFileName(phieu)}.xlsx`);
}
