/**
 * Mẫu in phiếu bảo trì / sửa chữa (A4 dọc, 1 trang) — MỘT chuỗi HTML style inline dùng chung cho
 * xem trước (iframe), In, PDF và DOC → bản in và file tải luôn giống nhau.
 * Khuôn lấy theo phieu-hanh-chinh/utils/phieu-in-html.ts.
 */
import i18n from '../../../../lib/i18n';
import { formatCurrency, formatDate, formatDateTime, getTodayISODate } from '../../../../lib/utils';
import { downloadBlob } from '../../../../lib/download-blob';
import { useUIStore } from '../../../../store/useStore';
import { escapeHtml as e } from '../../phieu-hanh-chinh/core/phieu-in';
import type { PhieuBaoTriSuaChua, TrangThaiPhieu } from '../core/types';
import { duLieuPhieuIn, type DuLieuPhieuIn } from '../core/phieu-in';

export type PhieuBaoTriExportFormat = 'pdf' | 'doc' | 'xlsx';

const FONT = "'Times New Roman', Times, serif";

const MAU_DAU: Record<TrangThaiPhieu, string> = {
  da_duyet: '#15803d',
  khong_duyet: '#b91c1c',
  cho_duyet: '#b45309',
};

const CSS = `
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff;color:#111;font-family:${FONT};font-size:12pt;line-height:1.45}
@page{size:A4 portrait;margin:15mm 15mm 15mm 20mm}
.trang{position:relative;width:210mm;min-height:297mm;padding:15mm 15mm 15mm 20mm;display:flex;flex-direction:column;overflow:hidden}
@media print{.trang{width:auto;min-height:0;padding:0}}
table{border-collapse:collapse;width:100%}
td{vertical-align:top}
.dau td{padding:0}
.cty{font-size:12.5pt;font-weight:bold;text-transform:uppercase}
.nho{font-size:9.5pt;color:#444}
.so{text-align:right;white-space:nowrap;font-size:11pt}
.ke{border:0;border-top:1.5px solid #111;margin:8px 0 18px}
h1{text-align:center;font-size:17pt;margin:0 0 4px;letter-spacing:.5px}
.ngay-phieu{text-align:center;font-style:italic;margin:0 0 18px}
.muc{font-weight:bold;font-size:12pt;margin:14px 0 6px;text-transform:uppercase}
.tt td{padding:4px 6px;border:1px solid #999}
.tt td.nhan{width:32%;background:#f3f4f6;font-weight:bold}
.tien{font-weight:bold}
.chu{font-style:italic}
.dau-tt{position:absolute;right:0;top:-6px;transform:rotate(-8deg);border:2.5px solid;border-radius:6px;padding:4px 14px;font-weight:bold;font-size:14pt;letter-spacing:1px;text-transform:uppercase}
.ngay-ky{text-align:right;font-style:italic;margin:26px 0 6px}
.ky td{width:33.33%;text-align:center;padding:0 4px}
.ky .chuc{font-weight:bold;font-size:11pt}
.ky .goi-y{font-style:italic;font-size:9.5pt;color:#555}
.ky .ten{padding-top:72px;font-weight:bold}
.chan{margin-top:auto;padding-top:10px;border-top:1px solid #ccc;font-size:8.5pt;color:#666}
`;

const t = (k: string) => i18n.t(`baoTriSuaChua.print.${k}`);

function duLieu(p: PhieuBaoTriSuaChua): DuLieuPhieuIn {
  return duLieuPhieuIn(p, i18n.t.bind(i18n), { tien: formatCurrency, ngayGio: formatDate });
}

function dong(nhan: string, giaTri: string, cls = ''): string {
  return `<tr><td class="nhan">${e(nhan)}</td><td${cls ? ` class="${cls}"` : ''}>${e(giaTri) || '&nbsp;'}</td></tr>`;
}

function headerCongTyHTML(d: DuLieuPhieuIn): string {
  const info = useUIStore.getState().companyInfo;
  const logo = info.appLogo
    ? `<td style="width:64px;padding-right:10px"><img src="${e(info.appLogo)}" alt="" style="width:56px;height:56px;object-fit:contain"/></td>`
    : '';
  const lienHe = [
    info.address && `${i18n.t('company.address')}: ${info.address}`,
    info.phone && `${i18n.t('company.phone')}: ${info.phone}`,
    info.taxId && `${i18n.t('company.taxId')}: ${info.taxId}`,
  ]
    .filter(Boolean)
    .map((s) => `<div class="nho">${e(s as string)}</div>`)
    .join('');
  return `<table class="dau"><tr>${logo}<td><div class="cty">${e(info.companyName ?? '')}</div>${lienHe}</td>
<td class="so"><div>${e(t('soPhieu'))}: <b>${e(d.soPhieu)}</b></div>
<div class="nho">${e(t('ngayLap'))}: ${e(d.ngayLap)}</div></td></tr></table>`;
}

/** Phần thân (không có <html>) — dùng cho DOC và ghép vào trang đầy đủ. */
export function buildPhieuBaoTriBodyHTML(p: PhieuBaoTriSuaChua): string {
  const d = duLieu(p);
  const mau = MAU_DAU[d.trangThai];
  return `<div class="trang">
${headerCongTyHTML(d)}
<hr class="ke"/>
<h1>${e(t('title'))}</h1>
<p class="ngay-phieu">${e(t('ngay'))}: ${e(d.ngay)}</p>

<div class="muc">${e(t('mucChung'))}</div>
<table class="tt">${dong(t('nguoiDeNghi'), d.nguoiDeNghi)}${dong(t('chiNhanh'), d.chiNhanh)}${dong(t('taiSan'), d.taiSan)}${dong(t('hangMuc'), d.hangMuc)}</table>

<div class="muc">${e(t('mucNoiDung'))}</div>
<table class="tt">${dong(t('moTa'), d.moTa)}${dong(t('nhaCungCap'), d.nhaCungCap)}${dong(t('soTien'), d.soTien, 'tien')}${dong(t('bangChu'), d.soTienChu, 'chu')}${dong(t('ghiChu'), d.ghiChu)}</table>

<div style="position:relative">
<div class="muc">${e(t('mucKetQua'))}</div>
<span class="dau-tt" style="color:${mau};border-color:${mau}">${e(d.trangThaiLabel)}</span>
<table class="tt">${dong(t('trangThai'), d.trangThaiLabel)}${dong(t('nguoiDuyet'), d.nguoiDuyet)}</table>
</div>

<p class="ngay-ky">${e(t('ngayKy'))}</p>
<table class="ky"><tr>
<td><div class="chuc">${e(t('ky.nguoiDeNghi'))}</div><div class="goi-y">${e(t('ky.goiY'))}</div><div class="ten">${e(d.nguoiDeNghi)}</div></td>
<td><div class="chuc">${e(t('ky.truongBoPhan'))}</div><div class="goi-y">${e(t('ky.goiY'))}</div></td>
<td><div class="chuc">${e(t('ky.nguoiDuyet'))}</div><div class="goi-y">${e(t('ky.goiY'))}</div><div class="ten">${e(d.nguoiDuyet)}</div></td>
</tr></table>

<div class="chan">${e(t('inLuc'))} ${e(formatDateTime(new Date()))}</div>
</div>`;
}

/** Trang HTML đầy đủ — nạp vào iframe xem trước / in / chụp PDF. */
export function buildPhieuBaoTriHTML(p: PhieuBaoTriSuaChua): string {
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>${e(
    `${t('pageTitle')} ${p.ma_phieu}`
  )}</title><style>${CSS}</style></head><body>${buildPhieuBaoTriBodyHTML(p)}</body></html>`;
}

function tenFile(p: PhieuBaoTriSuaChua): string {
  return `Phieu_bao_tri_${p.ma_phieu}_${getTodayISODate()}`;
}

export async function exportPhieuBaoTriPDF(p: PhieuBaoTriSuaChua): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('srcdoc', buildPhieuBaoTriHTML(p));
  iframe.style.cssText = 'position:fixed;left:0;top:0;width:794px;height:1123px;border:0;z-index:-1;visibility:hidden';
  document.body.appendChild(iframe);
  try {
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve();
      iframe.onerror = () => reject(new Error('iframe load failed'));
    });
    await new Promise((r) => setTimeout(r, 200));
    const trang = iframe.contentDocument?.querySelector('.trang') as HTMLElement | null;
    if (!trang) throw new Error('iframe body not available');
    const canvas = await html2canvas(trang, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    // Mẫu thiết kế đúng 1 trang A4: co vừa trang thay vì cắt nhiều trang.
    const caoMm = Math.min(297, (canvas.height / canvas.width) * 210);
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, caoMm);
    downloadBlob(doc.output('blob'), `${tenFile(p)}.pdf`);
  } finally {
    iframe.remove();
  }
}

export async function exportPhieuBaoTriDOC(p: PhieuBaoTriSuaChua): Promise<void> {
  const html = [
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">',
    '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>',
    // Word không hiểu flex / position: bỏ dấu trạng thái, giữ phần nội dung.
    `<style>${CSS}.trang{width:auto;min-height:0;padding:0;display:block}.dau-tt{display:none}</style></head>`,
    `<body>${buildPhieuBaoTriBodyHTML(p)}</body></html>`,
  ].join('');
  downloadBlob(new Blob(['﻿' + html], { type: 'application/msword;charset=utf-8' }), `${tenFile(p)}.doc`);
}

export async function exportPhieuBaoTriXLSX(p: PhieuBaoTriSuaChua): Promise<void> {
  const XLSX = await import('xlsx');
  const d = duLieu(p);
  const info = useUIStore.getState().companyInfo;
  const rows: (string | number)[][] = [
    [info.companyName ?? ''],
    [t('title')],
    [t('soPhieu'), d.soPhieu],
    [t('ngay'), d.ngay],
    [t('ngayLap'), d.ngayLap],
    [t('nguoiDeNghi'), d.nguoiDeNghi],
    [t('chiNhanh'), d.chiNhanh],
    [t('taiSan'), d.taiSan],
    [t('hangMuc'), d.hangMuc],
    [t('moTa'), d.moTa],
    [t('nhaCungCap'), d.nhaCungCap],
    [t('soTien'), Number(p.so_tien) || 0],
    [t('bangChu'), d.soTienChu],
    [t('ghiChu'), d.ghiChu],
    [t('trangThai'), d.trangThaiLabel],
    [t('nguoiDuyet'), d.nguoiDuyet],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 60 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Phieu');
  XLSX.writeFile(wb, `${tenFile(p)}.xlsx`);
}
