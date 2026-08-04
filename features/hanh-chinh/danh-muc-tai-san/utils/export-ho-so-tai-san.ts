/**
 * Xuất hồ sơ tài sản ra PDF, Excel, Doc – tham chiếu export-bang-luong.
 */
import type { TaiSan } from '../core/types';
import { formatCurrency, formatDate, formatDateTime, getTodayISODate } from '../../../../lib/utils';
import { downloadBlob } from '../../../../lib/download-blob';
import i18n from '../../../../lib/i18n';
import { ensureJsPDFVietnameseFont } from '../../../../lib/jspdf-vietnamese-font';
import { useUIStore } from '../../../../store/useStore';

const FONT_STACK = "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif";

function safeStr(v: string | number | null | undefined): string {
  if (v == null) return '—';
  return String(v);
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

/** Nội dung HTML cho PDF/Doc (body) */
function buildHoSoTaiSanBodyHTML(record: TaiSan): string {
  const title = i18n.t('danhSachTaiSan.preview.title');
  const printedAt = formatDateTime(new Date());
  const nguoiGiu =
    record.ten_nhan_vien_dang_giu
      ? `${record.ten_nhan_vien_dang_giu}${record.ma_nhan_vien_dang_giu ? ` (${record.ma_nhan_vien_dang_giu})` : ''}`
      : '—';
  const nguyenGia =
    record.nguyen_gia != null ? formatCurrency(record.nguyen_gia) : '—';

  const rows = [
    [i18n.t('danhSachTaiSan.store.maCol'), record.ma_tai_san],
    [i18n.t('danhSachTaiSan.store.tenCol'), record.ten_tai_san],
    [i18n.t('danhSachTaiSan.store.nhomCol'), record.ten_nhom ?? '—'],
    [i18n.t('danhSachTaiSan.store.noiLuuCol'), record.ten_noi_luu ?? '—'],
    [i18n.t('danhSachTaiSan.store.trangThaiCol'), record.ten_trang_thai ?? '—'],
    [i18n.t('danhSachTaiSan.store.nguoiGiuCol'), nguoiGiu],
    [i18n.t('danhSachTaiSan.store.ngayNhapCol'), formatDate(record.ngay_nhap)],
    [i18n.t('danhSachTaiSan.store.nguyenGiaCol'), nguyenGia],
    [i18n.t('danhSachTaiSan.form.ghiChu'), record.ghi_chu ?? '—'],
    [i18n.t('danhSachTaiSan.store.updatedCol'), formatDate(record.tg_cap_nhat)],
  ];

  const imgHtml = record.hinh_anh
    ? `<div style="text-align:center;margin-bottom:16px"><img src="${record.hinh_anh}" alt="${record.ten_tai_san}" style="max-width:120px;max-height:120px;object-fit:contain;border:1px solid #ddd;border-radius:4px" /></div>`
    : '';

  return `
<div style="font-family:${FONT_STACK};font-size:10pt;color:#222;padding:20px;min-width:600px">
${buildCompanyHeaderHTML()}
<h1 style="font-size:16pt;text-align:center;margin:0 0 8px;font-family:${FONT_STACK}">${title}</h1>
<p style="font-size:10pt;color:#555;text-align:center;margin-bottom:12px;font-family:${FONT_STACK}">${record.ma_tai_san} · ${record.ten_tai_san}</p>
<hr style="border:0;border-top:1px solid #ccc;margin:12px 0" />
${imgHtml}
<table style="width:100%;border-collapse:collapse;margin-top:12px;font-family:${FONT_STACK};font-size:10pt">
<thead><tr style="background:#3b82f6;color:#fff"><th colspan="2" style="padding:6px;text-align:left;font-size:9pt">${i18n.t('danhSachTaiSan.form.basicInfo')}</th></tr></thead>
<tbody>${rows.map(([l, v]) => TABLE_CELL(l, safeStr(v))).join('')}</tbody>
</table>
<p style="font-size:7pt;color:#888;margin-top:20px;font-family:${FONT_STACK}">${i18n.t('danhSachTaiSan.preview.printedAt')} ${printedAt}</p>
</div>`;
}

/** HTML đầy đủ cho Doc */
function buildHoSoTaiSanFullHTML(record: TaiSan): string {
  const body = buildHoSoTaiSanBodyHTML(record);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${body}</body></html>`;
}

export type HoSoTaiSanExportFormat = 'pdf' | 'excel' | 'doc';

function getFileName(record: TaiSan): string {
  const slug = `${record.ma_tai_san}_${record.ten_tai_san}`.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Ho_so_tai_san_${slug}_${getTodayISODate()}`;
}

/** Xuất hồ sơ tài sản ra PDF */
export async function exportHoSoTaiSanPDF(record: TaiSan): Promise<void> {
  const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  await ensureJsPDFVietnameseFont(doc);

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:210mm;padding:20px;font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:10pt;background:#fff';
  container.innerHTML = buildHoSoTaiSanBodyHTML(record);
  document.body.appendChild(container);

  try {
    await doc.html(container, {
      callback: () => {},
      html2canvas: { useCORS: true },
      x: 10,
      y: 10,
      width: 190,
      windowWidth: 794,
    });

    const blob = doc.output('blob');
    downloadBlob(blob, `${getFileName(record)}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

/** Xuất hồ sơ tài sản ra Excel */
export async function exportHoSoTaiSanExcel(record: TaiSan): Promise<void> {
  const XLSX = await import('xlsx');
  const info = useUIStore.getState().companyInfo;

  const nguoiGiu =
    record.ten_nhan_vien_dang_giu
      ? `${record.ten_nhan_vien_dang_giu}${record.ma_nhan_vien_dang_giu ? ` (${record.ma_nhan_vien_dang_giu})` : ''}`
      : '—';

  const data: (string | number | null)[][] = [
    [info.companyName],
    ...(info.address ? [[i18n.t('company.address'), info.address]] : []),
    ...(info.email ? [[i18n.t('company.email'), info.email]] : []),
    ...(info.phone ? [[i18n.t('company.phone'), info.phone]] : []),
    [],
    [i18n.t('danhSachTaiSan.preview.title')],
    [record.ma_tai_san, record.ten_tai_san],
    [],
    [i18n.t('danhSachTaiSan.store.maCol'), record.ma_tai_san],
    [i18n.t('danhSachTaiSan.store.tenCol'), record.ten_tai_san],
    [i18n.t('danhSachTaiSan.store.nhomCol'), record.ten_nhom ?? '—'],
    [i18n.t('danhSachTaiSan.store.noiLuuCol'), record.ten_noi_luu ?? '—'],
    [i18n.t('danhSachTaiSan.store.trangThaiCol'), record.ten_trang_thai ?? '—'],
    [i18n.t('danhSachTaiSan.store.nguoiGiuCol'), nguoiGiu],
    [i18n.t('danhSachTaiSan.store.ngayNhapCol'), record.ngay_nhap],
    [i18n.t('danhSachTaiSan.store.nguyenGiaCol'), record.nguyen_gia ?? '—'],
    [i18n.t('danhSachTaiSan.form.ghiChu'), record.ghi_chu ?? '—'],
    [i18n.t('danhSachTaiSan.store.updatedCol'), record.tg_cap_nhat],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 28 }, { wch: 40 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ho so tai san');
  XLSX.writeFile(wb, `${getFileName(record)}.xlsx`);
}

/** Xuất hồ sơ tài sản ra Doc (HTML mở được bằng Word) */
export async function exportHoSoTaiSanDoc(record: TaiSan): Promise<void> {
  const html = buildHoSoTaiSanFullHTML(record);
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
  downloadBlob(blob, `${getFileName(record)}.doc`);
}
