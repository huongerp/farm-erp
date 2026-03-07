/**
 * Xuất hợp đồng ra PDF / XLSX / DOC.
 */
import i18n from '../../../../lib/i18n';
import { formatDate, formatDateTime, getTodayISODate } from '../../../../lib/utils';
import { getLoaiHopDongLabel } from '../core/constants';
import type { HopDong } from '../core/types';

export type HopDongExportFormat = 'pdf' | 'xlsx' | 'doc';

const t = i18n.t.bind(i18n);

function sanitizeFileName(name: string): string {
  return name.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
}

function getBaseFileName(data: HopDong): string {
  const slug = sanitizeFileName(data.ten_ung_vien ?? data.id_ung_vien) + '_' + (data.so_hop_dong || 'hd');
  return `hop_dong_${slug}_${getTodayISODate()}`;
}

/** Tạo HTML nội dung HĐ để in/PDF/DOC */
function getHopDongContentHtml(data: HopDong): string {
  const loaiLabel = getLoaiHopDongLabel(data.loai_hop_dong, t);
  const rows1 = [
    [t('hopDong.table.ungVien'), data.ten_ung_vien ?? '—'],
    [t('hopDong.table.soHopDong'), data.so_hop_dong],
    [t('hopDong.table.loaiHopDong'), loaiLabel],
    [t('hopDong.table.ngayBatDau'), formatDate(data.ngay_bat_dau)],
    [t('hopDong.table.ngayKetThuc'), data.ngay_ket_thuc ? formatDate(data.ngay_ket_thuc) : '—'],
    [t('hopDong.table.trangThai'), data.trang_thai],
    [t('hopDong.ghiChu'), data.ghi_chu ?? '—'],
  ];
  const rows2 = [
    [t('hopDong.bacLuong'), data.bac_luong ?? '—'],
    [t('hopDong.mucLuong'), data.muc_luong ?? '—'],
    [t('hopDong.ngayVaoLam'), data.ngay_vao_lam ? formatDate(data.ngay_vao_lam) : '—'],
    [t('hopDong.coCheKhac'), data.co_che_khac ?? '—'],
    [t('hopDong.ghiChuKhac'), data.ghi_chu_khac ?? '—'],
  ];
  const tableHtml = (rows: [string, string][]) =>
    `<table style="width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:16px"><tbody>${rows
      .map(
        ([label, value]) =>
          `<tr><td style="width:38%;border:1px solid #ccc;padding:6px;font-weight:600;color:#444;background:#f9fafb;vertical-align:top">${label}</td><td style="border:1px solid #ccc;padding:6px;color:#111;vertical-align:top">${value}</td></tr>`
      )
      .join('')}</tbody></table>`;

  const printedAt = formatDateTime(new Date());
  return `
    <h1 style="font-size:14pt;font-weight:bold;margin-bottom:4px;color:#111">${t('hopDong.pageTitle')}</h1>
    <p style="font-size:10pt;color:#666;margin-bottom:16px">${data.so_hop_dong} · ${data.ten_ung_vien ?? data.id_ung_vien}</p>
    <h2 style="font-size:11pt;font-weight:bold;color:#333;margin-top:16px;margin-bottom:8px;border-bottom:1px solid #ccc;padding-bottom:4px">${t('hopDong.detail.basicInfo')}</h2>
    ${tableHtml(rows1)}
    <h2 style="font-size:11pt;font-weight:bold;color:#333;margin-top:16px;margin-bottom:8px;border-bottom:1px solid #ccc;padding-bottom:4px">${t('hopDong.detail.terms')}</h2>
    ${tableHtml(rows2)}
    <p style="font-size:9pt;color:#666;margin-top:24px">${t('hopDong.preview.printedAt')} ${printedAt}</p>
  `;
}

/** Xuất hợp đồng ra PDF */
export async function exportHopDongToPDF(data: HopDong): Promise<void> {
  const bodyHtml = getHopDongContentHtml(data);
  const fileName = getBaseFileName(data);
  const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:210mm;padding:24px;font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:10pt;background:#fff;color:#111';
  container.innerHTML = `<div class="hop-dong-export">${bodyHtml}</div>`;
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
    a.download = `${fileName}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(container);
  }
}

/** Xuất hợp đồng ra Excel (metadata) */
export async function exportHopDongToXLSX(data: HopDong): Promise<void> {
  const XLSX = await import('xlsx');
  const rows: (string | number)[][] = [
    [t('hopDong.table.ungVien'), data.ten_ung_vien ?? '—'],
    [t('hopDong.table.soHopDong'), data.so_hop_dong],
    [t('hopDong.table.loaiHopDong'), getLoaiHopDongLabel(data.loai_hop_dong, t)],
    [t('hopDong.table.ngayBatDau'), data.ngay_bat_dau],
    [t('hopDong.table.ngayKetThuc'), data.ngay_ket_thuc ?? '—'],
    [t('hopDong.table.trangThai'), data.trang_thai],
    [t('hopDong.bacLuong'), data.bac_luong ?? '—'],
    [t('hopDong.mucLuong'), data.muc_luong ?? '—'],
    [t('hopDong.ngayVaoLam'), data.ngay_vao_lam ?? '—'],
    [t('hopDong.coCheKhac'), data.co_che_khac ?? '—'],
    [t('hopDong.ghiChu'), data.ghi_chu ?? '—'],
    [t('hopDong.ghiChuKhac'), data.ghi_chu_khac ?? '—'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 50 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'HopDong');
  XLSX.writeFile(wb, `${getBaseFileName(data)}.xlsx`);
}

/** Xuất hợp đồng ra Word */
export async function exportHopDongToDoc(data: HopDong): Promise<void> {
  const bodyHtml = getHopDongContentHtml(data);
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"></head><body style="font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:10pt;padding:24px;">${bodyHtml}</body></html>`;
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${getBaseFileName(data)}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
