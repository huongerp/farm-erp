/**
 * Xuất báo cáo kỳ khấu hao ra PDF – header công ty + thông tin kỳ + bảng chi tiết.
 */
import type { KyKhauHao, ChiTietKhauHao } from '../core/types';
import { formatDateTime, formatCurrency, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { ensureJsPDFVietnameseFont } from '../../../../lib/jspdf-vietnamese-font';
import { useUIStore } from '../../../../store/useStore';
import { getTrangThaiKyLabel } from '../core/constants';

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

function buildBaoCaoKhauHaoBodyHTML(ky: KyKhauHao, chiTiet: ChiTietKhauHao[]): string {
  const t = i18n.t.bind(i18n);
  const title = t('khauHaoTaiSan.preview.title');
  const printedAt = formatDateTime(new Date());
  const subtitle = `${t('khauHaoTaiSan.store.thangCol')} ${ky.thang} / ${ky.nam} · ${getTrangThaiKyLabel(ky.trang_thai, t)}`;

  const infoRows = [
    [t('khauHaoTaiSan.store.thangCol'), String(ky.thang)],
    [t('khauHaoTaiSan.store.namCol'), String(ky.nam)],
    [t('khauHaoTaiSan.store.trangThaiCol'), getTrangThaiKyLabel(ky.trang_thai, t)],
    [t('khauHaoTaiSan.store.tongNguyenGiaCol'), ky.tong_nguyen_gia != null ? formatCurrency(ky.tong_nguyen_gia) : '—'],
    [t('khauHaoTaiSan.store.tongKhauHaoKyCol'), ky.tong_khau_hao_ky != null ? formatCurrency(ky.tong_khau_hao_ky) : '—'],
    [t('khauHaoTaiSan.preview.updatedAt'), ky.tg_cap_nhat ? formatDateTime(ky.tg_cap_nhat) : '—'],
  ];

  let section2 = '';
  if (chiTiet.length > 0) {
    const theadCells = [
      t('khauHaoTaiSan.detail.maTaiSanCol'),
      t('khauHaoTaiSan.detail.tenTaiSanCol'),
      t('khauHaoTaiSan.detail.nhomCol'),
      t('khauHaoTaiSan.detail.nguyenGiaCol'),
      t('khauHaoTaiSan.detail.giaTriDauKyCol'),
      t('khauHaoTaiSan.detail.khauHaoKyCol'),
      t('khauHaoTaiSan.detail.khauHaoLuyKeCol'),
      t('khauHaoTaiSan.detail.giaTriCuoiKyCol'),
    ]
      .map(
        (text) =>
          `<th style="padding:6px 8px;border:1px solid #ddd;text-align:left;font-size:9pt;font-family:${FONT_STACK};background:#6366f1;color:#fff">${text}</th>`
      )
      .join('');
    const tbodyRows = chiTiet
      .map(
        (c) =>
          `<tr>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(c.ma_tai_san)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(c.ten_tai_san)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(c.ten_nhom)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${formatCurrency(c.nguyen_gia)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${formatCurrency(c.gia_tri_con_lai_dau_ky)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${formatCurrency(c.khau_hao_ky)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${formatCurrency(c.khau_hao_luy_ke)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${formatCurrency(c.gia_tri_con_lai_cuoi_ky)}</td>
          </tr>`
      )
      .join('');
    section2 = `
<table style="width:100%;border-collapse:collapse;margin-top:12px;font-family:${FONT_STACK};font-size:9pt">
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
  <thead><tr style="background:#6366f1;color:#fff"><th colspan="2" style="padding:6px;text-align:left;font-size:9pt">${t('khauHaoTaiSan.preview.kyInfo')}</th></tr></thead>
  <tbody>${infoRows.map(([l, v]) => TABLE_CELL(l, safeStr(v))).join('')}</tbody>
</table>
${chiTiet.length > 0 ? `<h2 style="font-size:11pt;margin:16px 0 8px;font-family:${FONT_STACK}">${t('khauHaoTaiSan.detail.chiTietSection')}</h2>${section2}` : ''}
<p style="font-size:7pt;color:#888;margin-top:20px;font-family:${FONT_STACK}">${t('khauHaoTaiSan.preview.printedAt')} ${printedAt}</p>
</div>`;
}

function getFileName(ky: KyKhauHao): string {
  return `Bao_cao_khau_hao_${ky.thang}_${ky.nam}_${getTodayISODate()}`;
}

export async function exportBaoCaoKhauHaoToPDF(
  ky: KyKhauHao,
  chiTiet: ChiTietKhauHao[]
): Promise<void> {
  const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  await ensureJsPDFVietnameseFont(doc);

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:210mm;padding:20px;font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:10pt;background:#fff';
  container.innerHTML = buildBaoCaoKhauHaoBodyHTML(ky, chiTiet);
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
    a.download = `${getFileName(ky)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(container);
  }
}
