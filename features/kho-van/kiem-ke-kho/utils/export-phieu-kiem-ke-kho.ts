/**
 * Xuất phiếu kiểm kê kho đợt ra PDF – header công ty + thông tin đợt + bảng chi tiết (kho, hàng hóa, SL sổ, SL thực tế, kết quả).
 */
import type { DotKiemKeKho, ChiTietKiemKeKho } from '../core/types';
import { formatDate, formatDateTime, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';
import { getTrangThaiDotLabel } from '../core/constants';
import { getKetQuaLabel } from '../core/constants';

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

function buildPhieuKiemKeKhoBodyHTML(dot: DotKiemKeKho, chiTiet: ChiTietKiemKeKho[]): string {
  const t = i18n.t.bind(i18n);
  const title = t('kiemKeKho.preview.title');
  const printedAt = formatDateTime(new Date());
  const subtitle = `${dot.ma_dot} · ${dot.ten_dot} · ${getTrangThaiDotLabel(dot.trang_thai, t)}`;

  const infoRows = [
    [t('kiemKeKho.store.maDotCol'), dot.ma_dot],
    [t('kiemKeKho.store.tenDotCol'), dot.ten_dot],
    [t('kiemKeKho.store.ngayBatDauCol'), formatDate(dot.ngay_bat_dau)],
    [t('kiemKeKho.store.ngayKetThucCol'), formatDate(dot.ngay_ket_thuc)],
    [t('kiemKeKho.store.trangThaiCol'), getTrangThaiDotLabel(dot.trang_thai, t)],
    [t('kiemKeKho.store.nguoiPhuTrachCol'), dot.ten_nguoi_phu_trach || dot.ma_nguoi_phu_trach || '—'],
    [t('kiemKeKho.store.ghiChuCol'), dot.ghi_chu ?? '—'],
  ];

  let section2 = '';
  if (chiTiet.length > 0) {
    const theadCells = [
      t('kiemKeKho.store.khoCol'),
      t('kiemKeKho.store.hangHoaCol'),
      t('kiemKeKho.store.soLuongSoCol'),
      t('kiemKeKho.store.soLuongThucTeCol'),
      t('kiemKeKho.store.ketQuaCol'),
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
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(c.ten_kho || c.ma_kho)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(c.ten_hang || c.ma_hang)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${c.so_luong_so} ${c.don_vi_tinh ? safeStr(c.don_vi_tinh) : ''}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${c.so_luong_thuc_te != null ? `${c.so_luong_thuc_te} ${c.don_vi_tinh ? safeStr(c.don_vi_tinh) : ''}` : '—'}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${getKetQuaLabel(c.ket_qua, t)}</td>
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
  <thead><tr style="background:#3b82f6;color:#fff"><th colspan="2" style="padding:6px;text-align:left;font-size:9pt">${t('kiemKeKho.form.infoSection')}</th></tr></thead>
  <tbody>${infoRows.map(([l, v]) => TABLE_CELL(l, safeStr(v))).join('')}</tbody>
</table>
${chiTiet.length > 0 ? `<h2 style="font-size:11pt;margin:16px 0 8px;font-family:${FONT_STACK}">${t('kiemKeKho.chiTietSection')}</h2>${section2}` : ''}
<p style="font-size:7pt;color:#888;margin-top:20px;font-family:${FONT_STACK}">${t('kiemKeKho.preview.printedAt')} ${printedAt}</p>
</div>`;
}

function getFileName(dot: DotKiemKeKho): string {
  const slug = `${dot.ma_dot}_${dot.ten_dot}`.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Phieu_kiem_ke_kho_${slug}_${getTodayISODate()}`;
}

export async function exportPhieuKiemKeKhoToPDF(
  dot: DotKiemKeKho,
  chiTiet: ChiTietKiemKeKho[]
): Promise<void> {
  const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:210mm;padding:20px;font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:10pt;background:#fff';
  container.innerHTML = buildPhieuKiemKeKhoBodyHTML(dot, chiTiet);
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
    a.download = `${getFileName(dot)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(container);
  }
}
