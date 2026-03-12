/**
 * Xuất báo cáo đề xuất vật tư ra PDF – header công ty + kỳ + bảng tổng hợp theo trạng thái, theo nơi đề xuất.
 */
import { formatDateTime, getTodayISODate } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import i18n from '../../../../lib/i18n';
import type { BaoCaoDeXuatVatTuFilters } from '../core/types';
import type { TFunction } from 'i18next';
import { getTongHopDeXuatKy, getPhieuDeXuatInPeriod } from '../services/bao-cao-de-xuat-vat-tu-service';

const FONT_STACK = "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif";

function getTrangThaiLabel(trang_thai: string, t: TFunction): string {
  if (trang_thai === 'Chờ duyệt') return t('baoCaodeXuatVatTu.trangThaiChoDuyet');
  if (trang_thai === 'Đã duyệt') return t('baoCaodeXuatVatTu.trangThaiDaDuyet');
  if (trang_thai === 'Không duyệt') return t('baoCaodeXuatVatTu.trangThaiKhongDuyet');
  return trang_thai;
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

function buildTableTrangThai(
  rows: { trang_thai: string; count: number }[],
  t: TFunction
): string {
  if (rows.length === 0) return '';
  const thead = [
    t('baoCaodeXuatVatTu.tongHop.statusCol'),
    t('baoCaodeXuatVatTu.tongHop.countCol'),
  ]
    .map((text) => `<th style="padding:6px 8px;border:1px solid #ddd;text-align:left;font-size:9pt;font-family:${FONT_STACK};background:#6366f1;color:#fff">${text}</th>`)
    .join('');
  const tbody = rows
    .map(
      (r) => `
    <tr>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${getTrangThaiLabel(r.trang_thai, t)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${r.count}</td>
    </tr>`
    )
    .join('');
  return `<h2 style="font-size:11pt;margin:16px 0 8px;font-family:${FONT_STACK}">${t('baoCaodeXuatVatTu.tongHop.byStatus')}</h2>
<table style="width:100%;border-collapse:collapse;margin-top:8px;font-family:${FONT_STACK};font-size:9pt"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
}

function buildTableNoiDeXuat(
  rows: { id_noi_de_xuat: string; ten_noi_de_xuat?: string; count: number }[],
  t: TFunction
): string {
  if (rows.length === 0) return '';
  const colNoi = t('baoCaodeXuatVatTu.chiTiet.noiDeXuat');
  const colCount = t('baoCaodeXuatVatTu.tongHop.countCol');
  const thead = [
    `<th style="padding:6px 8px;border:1px solid #ddd;text-align:left;font-size:9pt;font-family:${FONT_STACK};background:#6366f1;color:#fff">${colNoi}</th>`,
    `<th style="padding:6px 8px;border:1px solid #ddd;text-align:right;font-size:9pt;font-family:${FONT_STACK};background:#6366f1;color:#fff">${colCount}</th>`,
  ].join('');
  const tbody = rows
    .slice(0, 25)
    .map(
      (r) => `
    <tr>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${r.ten_noi_de_xuat ?? r.id_noi_de_xuat}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${r.count}</td>
    </tr>`
    )
    .join('');
  return `<h2 style="font-size:11pt;margin:16px 0 8px;font-family:${FONT_STACK}">${t('baoCaodeXuatVatTu.tongHop.byNoiDeXuat')}</h2>
<table style="width:100%;border-collapse:collapse;margin-top:8px;font-family:${FONT_STACK};font-size:9pt"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
}

function buildTableChiTiet(
  rows: { so_phieu: string; ngay: string; ten_noi_de_xuat?: string; ten_nguoi_de_xuat?: string; trang_thai: string }[],
  t: TFunction
): string {
  if (rows.length === 0) return '';
  const thead = [
    t('baoCaodeXuatVatTu.chiTiet.soPhieu'),
    t('baoCaodeXuatVatTu.chiTiet.ngay'),
    t('baoCaodeXuatVatTu.chiTiet.noiDeXuat'),
    t('baoCaodeXuatVatTu.chiTiet.nguoiDeXuat'),
    t('baoCaodeXuatVatTu.chiTiet.trangThai'),
  ]
    .map((text) => `<th style="padding:6px 8px;border:1px solid #ddd;text-align:left;font-size:9pt;font-family:${FONT_STACK};background:#6366f1;color:#fff">${text}</th>`)
    .join('');
  const tbody = rows
    .slice(0, 20)
    .map(
      (p) => `
    <tr>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${p.so_phieu}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${p.ngay}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${p.ten_noi_de_xuat ?? '—'}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${p.ten_nguoi_de_xuat ?? '—'}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${getTrangThaiLabel(p.trang_thai, t)}</td>
    </tr>`
    )
    .join('');
  return `<h2 style="font-size:11pt;margin:16px 0 8px;font-family:${FONT_STACK}">${t('baoCaodeXuatVatTu.tabs.chiTietPhieu')}</h2>
<table style="width:100%;border-collapse:collapse;margin-top:8px;font-family:${FONT_STACK};font-size:9pt"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
}

export async function exportBaoCaoDeXuatVatTuToPdf(
  filters: BaoCaoDeXuatVatTuFilters,
  t: TFunction
): Promise<void> {
  const [tongHop, chiTietList] = await Promise.all([
    filters.dateFrom && filters.dateTo ? getTongHopDeXuatKy(filters) : Promise.resolve(null),
    filters.dateFrom && filters.dateTo ? getPhieuDeXuatInPeriod(filters) : Promise.resolve([]),
  ]);

  const title = t('baoCaodeXuatVatTu.reportTitle');
  const period = `${t('baoCaodeXuatVatTu.period')}: ${filters.dateFrom} – ${filters.dateTo}`;
  const printedAt = formatDateTime(new Date());

  const table1 = tongHop ? buildTableTrangThai(tongHop.byTrangThai, t) : '';
  const table2 = tongHop ? buildTableNoiDeXuat(tongHop.byNoiDeXuat, t) : '';
  const table3 = buildTableChiTiet(chiTietList, t);

  const html = `
<div style="font-family:${FONT_STACK};font-size:10pt;color:#222;padding:20px;min-width:600px" id="bao-cao-de-xuat-vat-tu-pdf">
${buildCompanyHeaderHTML()}
<h1 style="font-size:16pt;text-align:center;margin:0 0 8px;font-family:${FONT_STACK}">${title}</h1>
<p style="font-size:10pt;color:#555;text-align:center;margin-bottom:12px;font-family:${FONT_STACK}">${period}</p>
<p style="font-size:9pt;color:#888;margin-bottom:16px;font-family:${FONT_STACK}">${printedAt}</p>
<hr style="border:0;border-top:1px solid #ccc;margin:12px 0" />
${table1}
${table2}
${table3}
</div>`;

  const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:210mm;padding:20px;font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:10pt;background:#fff';
  container.innerHTML = html;
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
    a.download = `bao_cao_de_xuat_vat_tu_${filters.dateFrom}_${filters.dateTo}_${getTodayISODate()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(container);
  }
}
