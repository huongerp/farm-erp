/**
 * Xuất phiếu kiểm kê đợt ra PDF – theo chuẩn in hồ sơ tài sản (export-ho-so-tai-san):
 * Header công ty (logo, tên, địa chỉ, liên hệ) + nội dung HTML + doc.html() + tải file.
 */
import type { DotKiemKe, ChiTietKiemKe } from '../core/types';
import { formatDate, formatDateTime, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { ensureJsPDFVietnameseFont } from '../../../../lib/jspdf-vietnamese-font';
import { useUIStore } from '../../../../store/useStore';
import { getTrangThaiDotLabel } from '../core/constants';
import { getKetQuaLabel } from '../core/constants';

const FONT_STACK = "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif";

function safeStr(v: string | number | null | undefined): string {
  if (v == null) return '—';
  return String(v);
}

/** HTML header công ty (logo, tên, địa chỉ, email, SĐT) – giống hồ sơ tài sản */
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

/** Nội dung HTML cho phiếu kiểm kê (body) – cấu trúc giống hồ sơ tài sản */
function buildPhieuKiemKeBodyHTML(dot: DotKiemKe, chiTiet: ChiTietKiemKe[]): string {
  const t = i18n.t.bind(i18n);
  const title = t('kiemKeTaiSan.preview.title');
  const printedAt = formatDateTime(new Date());
  const subtitle = `${dot.ma_dot} · ${dot.ten_dot} · ${getTrangThaiDotLabel(dot.trang_thai)}`;

  const infoRows = [
    [t('kiemKeTaiSan.store.maDotCol'), dot.ma_dot],
    [t('kiemKeTaiSan.store.tenDotCol'), dot.ten_dot],
    [t('kiemKeTaiSan.store.ngayBatDauCol'), formatDate(dot.ngay_bat_dau)],
    [t('kiemKeTaiSan.store.ngayKetThucCol'), formatDate(dot.ngay_ket_thuc)],
    [t('kiemKeTaiSan.store.trangThaiCol'), getTrangThaiDotLabel(dot.trang_thai)],
    [t('kiemKeTaiSan.store.nguoiPhuTrachCol'), dot.ten_nguoi_phu_trach || dot.ma_nguoi_phu_trach || '—'],
    [t('kiemKeTaiSan.store.ghiChuCol'), dot.ghi_chu ?? '—'],
  ];

  let section2 = '';
  if (chiTiet.length > 0) {
    const theadCells = [
      t('kiemKeTaiSan.store.taiSanCol'),
      t('kiemKeTaiSan.store.noiLuuSoCol'),
      t('kiemKeTaiSan.store.nguoiGiuSoCol'),
      t('kiemKeTaiSan.store.ketQuaCol'),
    ]
      .map(
        (text) =>
          `<th style="padding:6px 8px;border:1px solid #ddd;text-align:left;font-size:9pt;font-family:${FONT_STACK};background:#3b82f6;color:#fff">${text}</th>`
      )
      .join('');
    const tbodyRows = chiTiet
      .map(
        (c) =>
          `<tr>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(c.ten_tai_san || c.ma_tai_san)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(c.ten_noi_luu_so)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(c.ten_nguoi_giu_so)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${getKetQuaLabel(c.ket_qua)}</td>
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
  <thead><tr style="background:#3b82f6;color:#fff"><th colspan="2" style="padding:6px;text-align:left;font-size:9pt">${t('kiemKeTaiSan.form.infoSection')}</th></tr></thead>
  <tbody>${infoRows.map(([l, v]) => TABLE_CELL(l, safeStr(v))).join('')}</tbody>
</table>
${chiTiet.length > 0 ? `<h2 style="font-size:11pt;margin:16px 0 8px;font-family:${FONT_STACK}">${t('kiemKeTaiSan.chiTietSection')}</h2>${section2}` : ''}
<p style="font-size:7pt;color:#888;margin-top:20px;font-family:${FONT_STACK}">${t('kiemKeTaiSan.preview.printedAt')} ${printedAt}</p>
</div>`;
}

function getFileName(dot: DotKiemKe): string {
  const slug = `${dot.ma_dot}_${dot.ten_dot}`.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Phieu_kiem_ke_${slug}_${getTodayISODate()}`;
}

/** Xuất phiếu kiểm kê đợt ra PDF – chuẩn in hồ sơ tài sản (doc.html + html2canvas) */
export async function exportPhieuKiemKeToPDF(
  dot: DotKiemKe,
  chiTiet: ChiTietKiemKe[]
): Promise<void> {
  const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  await ensureJsPDFVietnameseFont(doc);

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:210mm;padding:20px;font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:10pt;background:#fff';
  container.innerHTML = buildPhieuKiemKeBodyHTML(dot, chiTiet);
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getFileName(dot)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(container);
  }
}
