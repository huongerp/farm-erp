/**
 * Xuất phiếu kiểm kê kho đợt ra PDF/DOC/XLSX.
 *
 * PDF dùng html2canvas qua jsPDF để giữ font tiếng Việt theo trình duyệt,
 * tương tự chuẩn phiếu kho.
 */
import type { DotKiemKeKho, ChiTietKiemKeKho } from '../core/types';
import { formatDate, formatDateTime, formatNumberVN, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';
import { getTrangThaiDotLabel } from '../core/constants';
import { getKetQuaLabel } from '../core/constants';

const FONT = "Arial, 'Helvetica Neue', sans-serif";
const FONT_DOC = "'Times New Roman', Times, serif";

function safeText(v: string | number | null | undefined): string {
  if (v == null || v === '') return '—';
  return String(v);
}

function escapeHtml(v: string | number | null | undefined): string {
  return safeText(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getVariance(row: ChiTietKiemKeKho): number | null {
  if (row.so_luong_thuc_te == null) return null;
  return Number(row.so_luong_thuc_te) - Number(row.so_luong_so);
}

function formatQtyWithUnit(value: number | null | undefined, unit?: string | null): string {
  if (value == null) return '—';
  return `${formatNumberVN(value)}${unit ? ` ${unit}` : ''}`;
}

function getStats(chiTiet: ChiTietKiemKeKho[]) {
  return {
    total: chiTiet.length,
    khop: chiTiet.filter((c) => c.ket_qua === 'khop').length,
    thieu: chiTiet.filter((c) => c.ket_qua === 'thieu').length,
    thua: chiTiet.filter((c) => c.ket_qua === 'thua').length,
    chuaKiem: chiTiet.filter((c) => c.ket_qua === 'chua_kiem').length,
  };
}

function buildCompanyHeaderHTML(font = FONT): string {
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
<div style="display:flex;align-items:flex-start;gap:16px;padding-bottom:16px;margin-bottom:16px;border-bottom:2px solid #333;font-family:${font}">
  ${logoHtml}
  <div style="flex:1;min-width:0">
    <div style="font-size:14pt;font-weight:bold;color:#111;text-transform:uppercase;letter-spacing:0.02em">${escapeHtml(info.companyName)}</div>
    ${addr ? `<p style="font-size:9pt;color:#444;margin:2px 0 0 0">${escapeHtml(addr)}</p>` : ''}
    ${contactLine ? `<p style="font-size:9pt;color:#444;margin:2px 0 0 0">${escapeHtml(contactLine)}</p>` : ''}
  </div>
</div>`;
}

const TABLE_CELL =
  (label: string, value: string, font = FONT) =>
  `<tr><td style="padding:4px 6px;border:1px solid #ddd;font-weight:600;width:40%;color:#444;font-family:${font}">${escapeHtml(label)}</td><td style="padding:4px 6px;border:1px solid #ddd;font-family:${font}">${escapeHtml(value)}</td></tr>`;

function buildPhieuKiemKeKhoBodyHTML(dot: DotKiemKeKho, chiTiet: ChiTietKiemKeKho[]): string {
  const t = i18n.t.bind(i18n);
  const title = t('kiemKeKho.preview.title');
  const printedAt = formatDateTime(new Date());
  const subtitle = `${dot.ma_dot} · ${dot.ten_dot} · ${getTrangThaiDotLabel(dot.trang_thai, t)}`;
  const stats = getStats(chiTiet);

  const infoRows = [
    [t('kiemKeKho.store.maDotCol'), dot.ma_dot],
    [t('kiemKeKho.store.tenDotCol'), dot.ten_dot],
    [t('kiemKeKho.store.ngayBatDauCol'), formatDate(dot.ngay_bat_dau)],
    [t('kiemKeKho.store.ngayKetThucCol'), formatDate(dot.ngay_ket_thuc)],
    [t('kiemKeKho.store.trangThaiCol'), getTrangThaiDotLabel(dot.trang_thai, t)],
    [t('kiemKeKho.store.nguoiPhuTrachCol'), dot.ten_nguoi_phu_trach || dot.ma_nguoi_phu_trach || '—'],
    [t('kiemKeKho.store.ghiChuCol'), dot.ghi_chu ?? '—'],
  ];

  const statsLine = `${t('kiemKeKho.stats.total')}: ${formatNumberVN(stats.total, { maxFractionDigits: 0 })} · ${t('kiemKeKho.ketQua.khop')}: ${formatNumberVN(stats.khop, { maxFractionDigits: 0 })} · ${t('kiemKeKho.ketQua.thieu')}: ${formatNumberVN(stats.thieu, { maxFractionDigits: 0 })} · ${t('kiemKeKho.ketQua.thua')}: ${formatNumberVN(stats.thua, { maxFractionDigits: 0 })} · ${t('kiemKeKho.ketQua.chua_kiem')}: ${formatNumberVN(stats.chuaKiem, { maxFractionDigits: 0 })}`;

  let section2 = '';
  if (chiTiet.length > 0) {
    const theadCells = [
      'TT',
      t('kiemKeKho.store.khoCol'),
      t('kiemKeKho.store.hangHoaCol'),
      t('kiemKeKho.store.soLuongSoCol'),
      t('kiemKeKho.store.soLuongThucTeCol'),
      t('kiemKeKho.detail.chenhLech', { defaultValue: 'Chênh lệch' }),
      t('kiemKeKho.store.ketQuaCol'),
      t('kiemKeKho.store.ghiChuCol'),
    ]
      .map(
        (text) =>
          `<th style="padding:6px 8px;border:1px solid #ddd;text-align:left;font-size:9pt;font-family:${FONT};background:#3b82f6;color:#fff">${escapeHtml(text)}</th>`
      )
      .join('');
    const tbodyRows = chiTiet
      .map((c, idx) => {
        const variance = getVariance(c);
        return (
          `<tr>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT};font-size:9pt;text-align:center">${idx + 1}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT};font-size:9pt">${escapeHtml(c.ten_kho || c.ma_kho)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT};font-size:9pt">${escapeHtml(c.ten_hang || c.ma_hang)}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT};font-size:9pt;text-align:right">${escapeHtml(formatQtyWithUnit(c.so_luong_so, c.don_vi_tinh))}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT};font-size:9pt;text-align:right">${escapeHtml(formatQtyWithUnit(c.so_luong_thuc_te, c.don_vi_tinh))}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT};font-size:9pt;text-align:right">${variance == null ? '—' : escapeHtml(formatNumberVN(variance))}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT};font-size:9pt">${escapeHtml(getKetQuaLabel(c.ket_qua, t))}</td>
            <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT};font-size:9pt">${escapeHtml(c.ghi_chu_dong)}</td>
          </tr>`
        );
      })
      .join('');
    section2 = `
<table style="width:100%;border-collapse:collapse;margin-top:12px;font-family:${FONT};font-size:10pt">
  <thead><tr>${theadCells}</tr></thead>
  <tbody>${tbodyRows}</tbody>
</table>`;
  }

  return `
<div style="font-family:${FONT};font-size:10pt;color:#222;padding:20px;min-width:600px;background:#fff">
${buildCompanyHeaderHTML()}
<h1 style="font-size:16pt;text-align:center;margin:0 0 8px;font-family:${FONT};text-transform:uppercase">${escapeHtml(title)}</h1>
<p style="font-size:10pt;color:#555;text-align:center;margin-bottom:12px;font-family:${FONT}">${escapeHtml(subtitle)}</p>
<hr style="border:0;border-top:1px solid #ccc;margin:12px 0" />
<table style="width:100%;border-collapse:collapse;margin-top:12px;font-family:${FONT};font-size:10pt">
  <thead><tr style="background:#3b82f6;color:#fff"><th colspan="2" style="padding:6px;text-align:left;font-size:9pt">${escapeHtml(t('kiemKeKho.form.infoSection'))}</th></tr></thead>
  <tbody>${infoRows.map(([l, v]) => TABLE_CELL(l, safeText(v))).join('')}</tbody>
</table>
<p style="font-size:9pt;color:#555;margin:10px 0 0;font-family:${FONT}">${escapeHtml(statsLine)}</p>
${chiTiet.length > 0 ? `<h2 style="font-size:11pt;margin:16px 0 8px;font-family:${FONT}">${escapeHtml(t('kiemKeKho.chiTietSection'))}</h2>${section2}` : `<p style="font-size:10pt;color:#666;font-style:italic;font-family:${FONT}">${escapeHtml(t('kiemKeKho.chiTietEmpty'))}</p>`}
<div style="display:flex;gap:16px;margin-top:32px;padding-top:16px;border-top:1px solid #ccc">
  <div style="text-align:center;flex:1"><p style="font-size:10pt;font-weight:600;margin:0 0 2px">${escapeHtml(t('kiemKeKho.preview.signInCharge'))}</p><p style="font-size:8pt;color:#666;margin:0">${escapeHtml(t('kiemKeKho.preview.signHint'))}</p></div>
  <div style="text-align:center;flex:1"><p style="font-size:10pt;font-weight:600;margin:0 0 2px">${escapeHtml(t('kiemKeKho.preview.signCounter'))}</p><p style="font-size:8pt;color:#666;margin:0">${escapeHtml(t('kiemKeKho.preview.signHint'))}</p></div>
  <div style="text-align:center;flex:1"><p style="font-size:10pt;font-weight:600;margin:0 0 2px">${escapeHtml(t('kiemKeKho.preview.signWarehouseKeeper'))}</p><p style="font-size:8pt;color:#666;margin:0">${escapeHtml(t('kiemKeKho.preview.signHint'))}</p></div>
  <div style="text-align:center;flex:1"><p style="font-size:10pt;font-weight:600;margin:0 0 2px">${escapeHtml(t('kiemKeKho.preview.signApprover'))}</p><p style="font-size:8pt;color:#666;margin:0">${escapeHtml(t('kiemKeKho.preview.signHint'))}</p></div>
</div>
<p style="font-size:7pt;color:#888;margin-top:20px;font-family:${FONT}">${escapeHtml(t('kiemKeKho.preview.printedAt'))} ${escapeHtml(printedAt)}</p>
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
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const bodyContent = buildPhieuKiemKeKhoBodyHTML(dot, chiTiet);
  const fullHtml = [
    '<!DOCTYPE html><html><head><meta charset="UTF-8">',
    `<style>*{box-sizing:border-box}body{margin:0;padding:0;background:#fff;color:#222;font-family:${FONT};font-size:10pt}img{max-width:100%}</style></head><body>`,
    bodyContent,
    '</body></html>',
  ].join('');

  const iframe = document.createElement('iframe');
  iframe.setAttribute('srcdoc', fullHtml);
  iframe.style.cssText = 'position:fixed;left:0;top:0;width:794px;height:1123px;border:0;z-index:-1';
  document.body.appendChild(iframe);

  await new Promise<void>((resolve, reject) => {
    iframe.onload = () => resolve();
    iframe.onerror = () => reject(new Error('iframe load failed'));
  });
  await new Promise((r) => setTimeout(r, 100));

  try {
    const docEl = iframe.contentDocument?.body;
    if (!docEl) throw new Error('iframe body not available');
    const canvas = await html2canvas(docEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    if (iframe.parentNode) document.body.removeChild(iframe);

    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const imgH = (canvas.height * pageW) / canvas.width;
    let remaining = imgH;
    let y = 0;

    doc.addImage(imgData, 'PNG', 0, y, pageW, imgH);
    remaining -= pageH;
    while (remaining > 0) {
      y -= pageH;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, y, pageW, imgH);
      remaining -= pageH;
    }

    download(doc.output('blob'), `${getFileName(dot)}.pdf`);
  } finally {
    if (iframe.parentNode) document.body.removeChild(iframe);
  }
}

function buildDocHTML(dot: DotKiemKeKho, chiTiet: ChiTietKiemKeKho[]): string {
  const body = buildPhieuKiemKeKhoBodyHTML(dot, chiTiet).replaceAll(FONT, FONT_DOC);
  return [
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">',
    '<head>',
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>',
    `<style>body,td,th,p{font-family:${FONT_DOC};font-size:11pt;}</style>`,
    '</head>',
    `<body style="font-family:${FONT_DOC};margin:40px">${body}</body>`,
    '</html>',
  ].join('');
}

export async function exportPhieuKiemKeKhoToDoc(
  dot: DotKiemKeKho,
  chiTiet: ChiTietKiemKeKho[]
): Promise<void> {
  download(
    new Blob(['\ufeff' + buildDocHTML(dot, chiTiet)], { type: 'application/msword;charset=utf-8' }),
    `${getFileName(dot)}.doc`,
  );
}

export async function exportPhieuKiemKeKhoToXLSX(
  dot: DotKiemKeKho,
  chiTiet: ChiTietKiemKeKho[]
): Promise<void> {
  const XLSX = await import('xlsx');
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const stats = getStats(chiTiet);

  const rows: (string | number)[][] = [
    [safeText(info.companyName)],
    ...(info.address ? [[t('company.address'), info.address]] : []),
    ...(info.email ? [[t('company.email'), info.email]] : []),
    ...(info.phone ? [[t('company.phone'), info.phone]] : []),
    [],
    [t('kiemKeKho.preview.title')],
    [t('kiemKeKho.store.maDotCol'), dot.ma_dot],
    [t('kiemKeKho.store.tenDotCol'), dot.ten_dot],
    [t('kiemKeKho.store.ngayBatDauCol'), formatDate(dot.ngay_bat_dau)],
    [t('kiemKeKho.store.ngayKetThucCol'), formatDate(dot.ngay_ket_thuc)],
    [t('kiemKeKho.store.trangThaiCol'), getTrangThaiDotLabel(dot.trang_thai, t)],
    [t('kiemKeKho.store.nguoiPhuTrachCol'), safeText(dot.ten_nguoi_phu_trach || dot.ma_nguoi_phu_trach)],
    [t('kiemKeKho.store.ghiChuCol'), safeText(dot.ghi_chu)],
    [],
    [t('kiemKeKho.stats.total'), stats.total],
    [t('kiemKeKho.ketQua.khop'), stats.khop],
    [t('kiemKeKho.ketQua.thieu'), stats.thieu],
    [t('kiemKeKho.ketQua.thua'), stats.thua],
    [t('kiemKeKho.ketQua.chua_kiem'), stats.chuaKiem],
    [],
    [
      'TT',
      t('kiemKeKho.store.khoCol'),
      t('kiemKeKho.store.hangHoaCol'),
      t('kiemKeKho.store.soLuongSoCol'),
      t('kiemKeKho.store.soLuongThucTeCol'),
      t('kiemKeKho.detail.chenhLech', { defaultValue: 'Chênh lệch' }),
      t('kiemKeKho.store.ketQuaCol'),
      t('kiemKeKho.store.dvtCol'),
      t('kiemKeKho.store.ghiChuCol'),
    ],
  ];

  chiTiet.forEach((c, idx) => {
    rows.push([
      idx + 1,
      safeText(c.ten_kho || c.ma_kho),
      safeText(c.ten_hang || c.ma_hang),
      Number(c.so_luong_so) || 0,
      c.so_luong_thuc_te != null ? Number(c.so_luong_thuc_te) : '',
      getVariance(c) ?? '',
      getKetQuaLabel(c.ket_qua, t),
      safeText(c.don_vi_tinh),
      safeText(c.ghi_chu_dong),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 24 },
    { wch: 32 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 10 },
    { wch: 28 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Phieu_kiem_ke_kho');
  XLSX.writeFile(wb, `${getFileName(dot)}.xlsx`);
}
