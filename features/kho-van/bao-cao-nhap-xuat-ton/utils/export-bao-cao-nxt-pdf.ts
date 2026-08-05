/**
 * Xuất báo cáo NXT ra PDF – header công ty + kỳ báo cáo + bảng tổng hợp theo kho và theo hàng.
 */
import { formatDateTime, getTodayISODate } from '../../../../lib/utils';
import { downloadBlob } from '../../../../lib/download-blob';
import { useUIStore } from '../../../../store/useStore';
import i18n from '../../../../lib/i18n';
import { ensureJsPDFVietnameseFont } from '../../../../lib/jspdf-vietnamese-font';
import type { NXTReportFilters } from '../core/types';
import type { TFunction } from 'i18next';
import { getNXTByPeriod, getPhieuInPeriod, getTonAtDate } from '../services/bao-cao-nxt-service';

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

function buildBodyHTML(
  filters: NXTReportFilters,
  t: TFunction
): string {
  const title = t('baoCaonhapXuatTon.reportTitle');
  const period = `${t('baoCaonhapXuatTon.period')}: ${filters.dateFrom} – ${filters.dateTo}`;
  const printedAt = formatDateTime(new Date());

  return `
<div style="font-family:${FONT_STACK};font-size:10pt;color:#222;padding:20px;min-width:600px" id="nxt-report-content">
${buildCompanyHeaderHTML()}
<h1 style="font-size:16pt;text-align:center;margin:0 0 8px;font-family:${FONT_STACK}">${title}</h1>
<p style="font-size:10pt;color:#555;text-align:center;margin-bottom:12px;font-family:${FONT_STACK}">${period}</p>
<p style="font-size:9pt;color:#888;margin-bottom:16px;font-family:${FONT_STACK}">${printedAt}</p>
<hr style="border:0;border-top:1px solid #ccc;margin:12px 0" />
{{BY_WAREHOUSE_TABLE}}
{{BY_PRODUCT_TABLE}}
{{PHIEU_TABLE}}
{{TON_TABLE}}
</div>`;
}

function buildTableWarehouse(rows: { ma_kho: string; ten_kho: string; ton_dau_ky: number; tong_nhap: number; tong_xuat: number; ton_cuoi_ky: number }[], t: TFunction): string {
  if (rows.length === 0) return '';
  const thead = [
    t('baoCaonhapXuatTon.byWarehouse.maKho'),
    t('baoCaonhapXuatTon.byWarehouse.tenKho'),
    t('baoCaonhapXuatTon.byWarehouse.tonDauKy'),
    t('baoCaonhapXuatTon.byWarehouse.tongNhap'),
    t('baoCaonhapXuatTon.byWarehouse.tongXuat'),
    t('baoCaonhapXuatTon.byWarehouse.tonCuoiKy'),
  ].map((text) => `<th style="padding:6px 8px;border:1px solid #ddd;text-align:left;font-size:9pt;font-family:${FONT_STACK};background:#6366f1;color:#fff">${text}</th>`).join('');
  const tbody = rows.map((r) => `
    <tr>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(r.ma_kho)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(r.ten_kho)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${r.ton_dau_ky.toLocaleString()}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${r.tong_nhap.toLocaleString()}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${r.tong_xuat.toLocaleString()}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${r.ton_cuoi_ky.toLocaleString()}</td>
    </tr>`).join('');
  return `<h2 style="font-size:11pt;margin:16px 0 8px;font-family:${FONT_STACK}">${t('baoCaonhapXuatTon.byWarehouse.tenKho')}</h2>
<table style="width:100%;border-collapse:collapse;margin-top:8px;font-family:${FONT_STACK};font-size:9pt"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
}

function buildTableProduct(rows: { ma_hang: string; ten_hang: string; ten_danh_muc?: string; don_vi_tinh: string; ton_dau_ky: number; tong_nhap: number; tong_xuat: number; ton_cuoi_ky: number }[], t: TFunction): string {
  if (rows.length === 0) return '';
  const thead = [
    t('baoCaonhapXuatTon.byProduct.maHang'),
    t('baoCaonhapXuatTon.byProduct.tenHang'),
    t('baoCaonhapXuatTon.byProduct.donViTinh'),
    t('baoCaonhapXuatTon.byProduct.tonDauKy'),
    t('baoCaonhapXuatTon.byProduct.tongNhap'),
    t('baoCaonhapXuatTon.byProduct.tongXuat'),
    t('baoCaonhapXuatTon.byProduct.tonCuoiKy'),
  ].map((text) => `<th style="padding:6px 8px;border:1px solid #ddd;text-align:left;font-size:9pt;font-family:${FONT_STACK};background:#6366f1;color:#fff">${text}</th>`).join('');
  const tbody = rows.slice(0, 50).map((r) => `
    <tr>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(r.ma_hang)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(r.ten_hang)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(r.don_vi_tinh)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${r.ton_dau_ky.toLocaleString()}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${r.tong_nhap.toLocaleString()}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${r.tong_xuat.toLocaleString()}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${r.ton_cuoi_ky.toLocaleString()}</td>
    </tr>`).join('');
  return `<h2 style="font-size:11pt;margin:16px 0 8px;font-family:${FONT_STACK}">${t('baoCaonhapXuatTon.byProduct.tenHang')}</h2>
<table style="width:100%;border-collapse:collapse;margin-top:8px;font-family:${FONT_STACK};font-size:9pt"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
}

export async function exportBaoCaoNXTToPdf(
  filters: NXTReportFilters,
  t: TFunction
): Promise<void> {
  const [nxtResult, phieuList, tonRows] = await Promise.all([
    filters.dateFrom && filters.dateTo ? getNXTByPeriod(filters) : Promise.resolve({ byWarehouse: [], byProduct: [], byCell: [] }),
    filters.dateFrom && filters.dateTo ? getPhieuInPeriod(filters) : Promise.resolve([]),
    getTonAtDate(filters),
  ]);

  const byWarehouseTable = buildTableWarehouse(nxtResult.byWarehouse, t);
  const byProductTable = buildTableProduct(nxtResult.byProduct, t);
  let phieuTable = '';
  if (phieuList.length > 0) {
    const thead = [t('baoCaonhapXuatTon.chiTiet.soPhieu'), t('baoCaonhapXuatTon.chiTiet.ngay'), t('baoCaonhapXuatTon.chiTiet.loai'), t('baoCaonhapXuatTon.chiTiet.kho'), t('baoCaonhapXuatTon.chiTiet.trangThai')]
      .map((text) => `<th style="padding:6px 8px;border:1px solid #ddd;font-size:9pt;font-family:${FONT_STACK};background:#6366f1;color:#fff">${text}</th>`).join('');
    const tbody = phieuList.slice(0, 30).map((p) => `
      <tr>
        <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${p.so_phieu}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${p.ngay}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${p.loai}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${safeStr(p.ten_kho)}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${p.trang_thai}</td>
      </tr>`).join('');
    phieuTable = `<h2 style="font-size:11pt;margin:16px 0 8px;font-family:${FONT_STACK}">${t('baoCaonhapXuatTon.tabs.chiTietPhieu')}</h2>
<table style="width:100%;border-collapse:collapse;margin-top:8px;font-family:${FONT_STACK};font-size:9pt"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
  }
  let tonTable = '';
  if (tonRows.length > 0) {
    const thead = [t('baoCaonhapXuatTon.tonThoiDiem.maKho'), t('baoCaonhapXuatTon.tonThoiDiem.tenKho'), t('baoCaonhapXuatTon.tonThoiDiem.maHang'), t('baoCaonhapXuatTon.tonThoiDiem.soLuong')]
      .map((text) => `<th style="padding:6px 8px;border:1px solid #ddd;font-size:9pt;font-family:${FONT_STACK};background:#6366f1;color:#fff">${text}</th>`).join('');
    const tbody = tonRows.slice(0, 40).map((r) => `
      <tr>
        <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${r.ma_kho}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${r.ten_kho}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt">${r.ma_hang}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;font-family:${FONT_STACK};font-size:9pt;text-align:right">${r.so_luong.toLocaleString()}</td>
      </tr>`).join('');
    tonTable = `<h2 style="font-size:11pt;margin:16px 0 8px;font-family:${FONT_STACK}">${t('baoCaonhapXuatTon.tabs.tonTaiThoiDiem')}</h2>
<table style="width:100%;border-collapse:collapse;margin-top:8px;font-family:${FONT_STACK};font-size:9pt"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
  }

  const html = buildBodyHTML(filters, t)
    .replace('{{BY_WAREHOUSE_TABLE}}', byWarehouseTable)
    .replace('{{BY_PRODUCT_TABLE}}', byProductTable)
    .replace('{{PHIEU_TABLE}}', phieuTable)
    .replace('{{TON_TABLE}}', tonTable);

  const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  await ensureJsPDFVietnameseFont(doc);

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:210mm;padding:20px;font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:10pt;background:#fff';
  container.innerHTML = html;
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
    downloadBlob(blob, `bao_cao_nhap_xuat_ton_${filters.dateFrom}_${filters.dateTo}_${getTodayISODate()}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
