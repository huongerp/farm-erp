/**
 * Mẫu in phiếu hành chính (A4 dọc, 1 trang) — MỘT chuỗi HTML style inline dùng chung cho
 * xem trước (iframe), In, PDF và DOC → bản in và file tải luôn giống nhau.
 */
import i18n from '../../../../lib/i18n';
import { formatDate, formatDateTime, getTodayISODate } from '../../../../lib/utils';
import { downloadBlob } from '../../../../lib/download-blob';
import { useUIStore } from '../../../../store/useStore';
import type { AdminFormRequest } from '../core/types';
import { duLieuPhieuIn, escapeHtml as e, type DuLieuPhieuIn, type KetQuaIn } from '../core/phieu-in';

export type PhieuHanhChinhExportFormat = 'pdf' | 'doc' | 'xlsx';

const FONT = "'Times New Roman', Times, serif";

const MAU_DAU: Record<KetQuaIn, string> = {
  dong_y: '#15803d',
  khong_dong_y: '#b91c1c',
  cho: '#b45309',
  huy: '#6b7280',
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
.kinh-gui{text-align:center;font-style:italic;margin:0 0 18px}
.muc{font-weight:bold;font-size:12pt;margin:14px 0 6px;text-transform:uppercase}
.tt td{padding:4px 6px;border:1px solid #999}
.tt td.nhan{width:32%;background:#f3f4f6;font-weight:bold}
.tick{display:inline-block;margin-right:28px}
.dau-tt{position:absolute;right:4px;top:14px;transform:rotate(-8deg);border:2.5px solid;border-radius:6px;padding:4px 14px;font-weight:bold;font-size:14pt;letter-spacing:1px}
.chim{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%) rotate(-30deg);font-size:90pt;font-weight:bold;color:rgba(107,114,128,.13);white-space:nowrap;pointer-events:none}
.ngay-ky{text-align:right;font-style:italic;margin:26px 0 6px}
.ky td{width:33.33%;text-align:center;padding:0 4px}
.ky .chuc{font-weight:bold;font-size:10.5pt;white-space:nowrap}
.ky .goi-y{font-style:italic;font-size:9.5pt;color:#555}
.ky .ten{padding-top:72px;font-weight:bold}
.chan{margin-top:auto;padding-top:10px;border-top:1px solid #ccc;font-size:8.5pt;color:#666}
`;

function dong(nhan: string, giaTri: string): string {
  return `<tr><td class="nhan">${e(nhan)}</td><td>${e(giaTri) || '&nbsp;'}</td></tr>`;
}

function tick(dangChon: boolean, nhan: string): string {
  return `<span class="tick">${dangChon ? '&#9745;' : '&#9744;'} ${e(nhan)}</span>`;
}

function headerCongTyHTML(d: DuLieuPhieuIn): string {
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const logo = info.appLogo
    ? `<td style="width:64px;padding-right:10px"><img src="${e(info.appLogo)}" alt="" style="width:56px;height:56px;object-fit:contain"/></td>`
    : '';
  const lienHe = [
    info.address && `${t('company.address')}: ${info.address}`,
    info.phone && `${t('company.phone')}: ${info.phone}`,
    info.taxId && `${t('company.taxId')}: ${info.taxId}`,
  ]
    .filter(Boolean)
    .map((s) => `<div class="nho">${e(s as string)}</div>`)
    .join('');
  return `<table class="dau"><tr>${logo}<td><div class="cty">${e(info.companyName ?? '')}</div>${lienHe}</td>
<td class="so"><div>${e(t('adminForm.print.soPhieu'))}: <b>${e(d.soPhieu)}</b></div>
<div class="nho">${e(t('adminForm.print.ngayLap'))}: ${e(d.ngayLap)}</div></td></tr></table>`;
}

/** Phần thân (không có <html>) — dùng cho DOC và ghép vào trang đầy đủ. */
export function buildPhieuHanhChinhBodyHTML(p: AdminFormRequest): string {
  const t = i18n.t.bind(i18n);
  const d = duLieuPhieuIn(p, t, formatDate);
  const info = useUIStore.getState().companyInfo;
  const kinhGui = [
    `${t('adminForm.print.banGiamDoc')}${info.companyName ? ` ${info.companyName}` : ''}`,
    d.phongBan && `${t('adminForm.print.truong')} ${d.phongBan}`,
  ]
    .filter(Boolean)
    .join('; ');

  const noiDung = [
    dong(t('adminForm.print.loaiPhieu'), d.loaiPhieu),
    dong(t('adminForm.print.thoiGian'), d.thoiGian),
    d.soNgay != null ? dong(t('adminForm.print.soNgay'), d.soNgay) : '',
    dong(t('adminForm.print.lyDo'), d.lyDo),
  ].join('');

  const mau = MAU_DAU[d.ketQua];
  return `<div class="trang">
${d.ketQua === 'huy' ? `<div class="chim">${e(t('adminForm.print.dau.huy'))}</div>` : ''}
${headerCongTyHTML(d)}
<hr class="ke"/>
<h1>${e(d.tieuDe)}</h1>
<p class="kinh-gui">${e(t('adminForm.print.kinhGui'))}: ${e(kinhGui)}</p>

<div class="muc">${e(t('adminForm.print.mucNguoi'))}</div>
<table class="tt">${dong(t('adminForm.print.hoTen'), d.nguoiDeNghi)}${dong(t('adminForm.print.phongBan'), d.phongBan)}</table>

<div class="muc">${e(t('adminForm.print.mucNoiDung'))}</div>
<table class="tt">${noiDung}</table>

<div style="position:relative">
<div class="muc">${e(t('adminForm.print.mucKetQua'))}</div>
<span class="dau-tt" style="color:${mau};border-color:${mau}">${e(t(`adminForm.print.dau.${d.ketQua}`))}</span>
<p style="margin:4px 0 8px">${tick(d.ketQua === 'dong_y', t('adminForm.print.dongY'))}${tick(d.ketQua === 'khong_dong_y', t('adminForm.print.khongDongY'))}</p>
<table class="tt">${dong(t('adminForm.print.ghiChu'), d.ghiChu)}${dong(t('adminForm.print.ngayXuLy'), d.ngayXuLy ?? '')}</table>
</div>

<p class="ngay-ky">${e(t('adminForm.print.ngayKy'))}</p>
<table class="ky"><tr>
<td><div class="chuc">${e(t('adminForm.print.ky.nguoiDeNghi'))}</div><div class="goi-y">${e(t('adminForm.print.ky.goiY'))}</div><div class="ten">${e(d.nguoiDeNghi)}</div></td>
<td><div class="chuc">${e(t('adminForm.print.ky.truongBoPhan'))}</div><div class="goi-y">${e(t('adminForm.print.ky.goiY'))}</div></td>
<td><div class="chuc">${e(t('adminForm.print.ky.hcns'))}</div><div class="goi-y">${e(t('adminForm.print.ky.goiY'))}</div></td>
</tr></table>

<div class="chan">${e(t('adminForm.print.inLuc'))} ${e(formatDateTime(new Date()))}</div>
</div>`;
}

/** Trang HTML đầy đủ — nạp vào iframe xem trước / in / chụp PDF. */
export function buildPhieuHanhChinhHTML(p: AdminFormRequest): string {
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>${e(
    `${i18n.t('adminForm.print.pageTitle')} ${p.id}`
  )}</title><style>${CSS}</style></head><body>${buildPhieuHanhChinhBodyHTML(p)}</body></html>`;
}

function tenFile(p: AdminFormRequest): string {
  return `Phieu_hanh_chinh_PHC-${p.id.padStart(5, '0')}_${getTodayISODate()}`;
}

export async function exportPhieuHanhChinhPDF(p: AdminFormRequest): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('srcdoc', buildPhieuHanhChinhHTML(p));
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

export async function exportPhieuHanhChinhDOC(p: AdminFormRequest): Promise<void> {
  const html = [
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">',
    '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>',
    // Word không hiểu flex / position: bỏ dấu trạng thái và chữ chìm, giữ phần nội dung.
    `<style>${CSS}.trang{width:auto;min-height:0;padding:0;display:block}.dau-tt,.chim{display:none}</style></head>`,
    `<body>${buildPhieuHanhChinhBodyHTML(p)}</body></html>`,
  ].join('');
  downloadBlob(new Blob(['﻿' + html], { type: 'application/msword;charset=utf-8' }), `${tenFile(p)}.doc`);
}

export async function exportPhieuHanhChinhXLSX(p: AdminFormRequest): Promise<void> {
  const XLSX = await import('xlsx');
  const t = i18n.t.bind(i18n);
  const d = duLieuPhieuIn(p, t, formatDate);
  const info = useUIStore.getState().companyInfo;
  const rows: string[][] = [
    [info.companyName ?? ''],
    [d.tieuDe],
    [t('adminForm.print.soPhieu'), d.soPhieu],
    [t('adminForm.print.ngayLap'), d.ngayLap],
    [t('adminForm.print.hoTen'), d.nguoiDeNghi],
    [t('adminForm.print.phongBan'), d.phongBan],
    [t('adminForm.print.loaiPhieu'), d.loaiPhieu],
    [t('adminForm.print.thoiGian'), d.thoiGian],
    ...(d.soNgay != null ? [[t('adminForm.print.soNgay'), d.soNgay]] : []),
    [t('adminForm.print.lyDo'), d.lyDo],
    [t('adminForm.print.trangThai'), t(`adminForm.print.dau.${d.ketQua}`)],
    [t('adminForm.print.ghiChu'), d.ghiChu],
    [t('adminForm.print.ngayXuLy'), d.ngayXuLy ?? ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 60 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Phieu');
  XLSX.writeFile(wb, `${tenFile(p)}.xlsx`);
}
