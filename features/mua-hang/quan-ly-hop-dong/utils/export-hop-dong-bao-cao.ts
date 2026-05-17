import type { TFunction } from 'i18next';
import { formatDateTime, formatNumberVN, getTodayISODate } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import i18n from '../../../../lib/i18n';

const FONT_STACK = "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif";

export interface BaoCaoNccRow {
  tenNcc: string;
  soHd: number;
  tongGiaTri: number;
  daTT: number;
  tongCay: number;
  daGiao: number;
}

export interface BaoCaoMonthRow {
  label: string;
  soHd: number;
  soDot: number;
  tongTien: number;
  tongCay: number;
}

export interface BaoCaoHopDongExportSnapshot {
  periodLabel: string;
  kpiRows: { label: string; value: string }[];
  kpiThangNayRows: { label: string; value: string }[];
  kpiTrongKyRows: { label: string; value: string }[];
  byNcc: BaoCaoNccRow[];
  byMonth: BaoCaoMonthRow[];
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

function buildKpiTable(title: string, rows: { label: string; value: string }[]): string {
  if (rows.length === 0) return '';
  const tbody = rows
    .map(
      (r) => `
    <tr>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${r.label}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${r.value}</td>
    </tr>`
    )
    .join('');
  return `<h2 style="font-size:11pt;margin:16px 0 8px;font-family:${FONT_STACK}">${title}</h2>
<table style="width:100%;border-collapse:collapse;font-family:${FONT_STACK};font-size:9pt"><tbody>${tbody}</tbody></table>`;
}

function buildNccTable(rows: BaoCaoNccRow[], t: TFunction): string {
  if (rows.length === 0) return '';
  const thead = [
    t('hopDong.baoCao.col.tenNcc'),
    t('hopDong.baoCao.col.soHd'),
    t('hopDong.baoCao.col.tongGiaTri'),
    t('hopDong.baoCao.col.daTT'),
    t('hopDong.baoCao.col.conLai'),
    t('hopDong.baoCao.col.tongCay'),
    t('hopDong.baoCao.col.daGiao'),
  ]
    .map(
      (text, i) =>
        `<th style="padding:6px 8px;border:1px solid #ddd;font-size:9pt;font-family:${FONT_STACK};background:#6366f1;color:#fff;text-align:${i === 0 ? 'left' : 'right'}">${text}</th>`
    )
    .join('');
  const tbody = rows
    .map(
      (r) => `
    <tr>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${r.tenNcc}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${r.soHd}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${formatNumberVN(r.tongGiaTri)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${formatNumberVN(r.daTT)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${formatNumberVN(r.tongGiaTri - r.daTT)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${formatNumberVN(r.tongCay)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${formatNumberVN(r.daGiao)}</td>
    </tr>`
    )
    .join('');
  return `<h2 style="font-size:11pt;margin:16px 0 8px;font-family:${FONT_STACK}">${t('hopDong.baoCao.sectionByNcc')}</h2>
<table style="width:100%;border-collapse:collapse;font-family:${FONT_STACK};font-size:9pt"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
}

function buildMonthTable(rows: BaoCaoMonthRow[], t: TFunction): string {
  if (rows.length === 0) return '';
  const thead = [
    t('hopDong.baoCao.col.thang'),
    t('hopDong.baoCao.col.soHdKy'),
    t('hopDong.baoCao.col.soDot'),
    t('hopDong.baoCao.col.tongTien'),
    t('hopDong.baoCao.col.tongCayNhan'),
  ]
    .map(
      (text, i) =>
        `<th style="padding:6px 8px;border:1px solid #ddd;font-size:9pt;font-family:${FONT_STACK};background:#6366f1;color:#fff;text-align:${i === 0 ? 'left' : 'right'}">${text}</th>`
    )
    .join('');
  const tbody = rows
    .map(
      (r) => `
    <tr>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${r.label}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${r.soHd}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${r.soDot}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${formatNumberVN(r.tongTien)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${formatNumberVN(r.tongCay)}</td>
    </tr>`
    )
    .join('');
  return `<h2 style="font-size:11pt;margin:16px 0 8px;font-family:${FONT_STACK}">${t('hopDong.baoCao.sectionByMonth')}</h2>
<table style="width:100%;border-collapse:collapse;font-family:${FONT_STACK};font-size:9pt"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
}

export async function exportBaoCaoHopDongToExcel(snapshot: BaoCaoHopDongExportSnapshot, t: TFunction): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const colLabel = t('hopDong.export.baoCao.metric');
  const colValue = t('hopDong.export.baoCao.value');

  const addPairSheet = (name: string, rows: { label: string; value: string }[]) => {
    if (rows.length === 0) return;
    const data = rows.map((r) => ({ [colLabel]: r.label, [colValue]: r.value }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), name.slice(0, 31));
  };

  addPairSheet('TongHop', snapshot.kpiRows);
  addPairSheet('ThangNay', snapshot.kpiThangNayRows);
  addPairSheet('TrongKy', snapshot.kpiTrongKyRows);

  if (snapshot.byNcc.length > 0) {
    const rows = snapshot.byNcc.map((r) => ({
      [t('hopDong.baoCao.col.tenNcc')]: r.tenNcc,
      [t('hopDong.baoCao.col.soHd')]: r.soHd,
      [t('hopDong.baoCao.col.tongGiaTri')]: r.tongGiaTri,
      [t('hopDong.baoCao.col.daTT')]: r.daTT,
      [t('hopDong.baoCao.col.conLai')]: r.tongGiaTri - r.daTT,
      [t('hopDong.baoCao.col.tongCay')]: r.tongCay,
      [t('hopDong.baoCao.col.daGiao')]: r.daGiao,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'TheoNCC');
  }

  if (snapshot.byMonth.length > 0) {
    const rows = snapshot.byMonth.map((r) => ({
      [t('hopDong.baoCao.col.thang')]: r.label,
      [t('hopDong.baoCao.col.soHdKy')]: r.soHd,
      [t('hopDong.baoCao.col.soDot')]: r.soDot,
      [t('hopDong.baoCao.col.tongTien')]: r.tongTien,
      [t('hopDong.baoCao.col.tongCayNhan')]: r.tongCay,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'TheoThang');
  }

  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([[t('hopDong.baoCao.noData')]]);
    XLSX.utils.book_append_sheet(wb, ws, 'BaoCao');
  }

  const suffix = snapshot.periodLabel.replace(/\s+/g, '_').slice(0, 40) || 'all';
  XLSX.writeFile(wb, `bao_cao_hop_dong_${suffix}_${getTodayISODate()}.xlsx`);
}

export async function exportBaoCaoHopDongToPdf(snapshot: BaoCaoHopDongExportSnapshot, t: TFunction): Promise<void> {
  const title = t('hopDong.tabs.baoCao');
  const printedAt = formatDateTime(new Date());

  const html = `
<div style="font-family:${FONT_STACK};font-size:10pt;color:#222;padding:20px;min-width:600px">
${buildCompanyHeaderHTML()}
<h1 style="font-size:16pt;text-align:center;margin:0 0 8px;font-family:${FONT_STACK}">${title}</h1>
<p style="font-size:10pt;color:#555;text-align:center;margin-bottom:12px;font-family:${FONT_STACK}">${snapshot.periodLabel}</p>
<p style="font-size:9pt;color:#888;margin-bottom:16px;font-family:${FONT_STACK}">${printedAt}</p>
<hr style="border:0;border-top:1px solid #ccc;margin:12px 0" />
${buildKpiTable(t('hopDong.baoCao.sectionTongHop'), snapshot.kpiRows)}
${buildKpiTable(t('hopDong.baoCao.sectionThangNay'), snapshot.kpiThangNayRows)}
${buildKpiTable(t('hopDong.baoCao.sectionTrongKy'), snapshot.kpiTrongKyRows)}
${buildNccTable(snapshot.byNcc, t)}
${buildMonthTable(snapshot.byMonth, t)}
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
    const suffix = snapshot.periodLabel.replace(/\s+/g, '_').slice(0, 40) || 'all';
    a.download = `bao_cao_hop_dong_${suffix}_${getTodayISODate()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(container);
  }
}
