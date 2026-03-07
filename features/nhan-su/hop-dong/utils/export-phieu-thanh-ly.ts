/**
 * Xuất phiếu thanh lý ra PDF / DOC.
 */
import i18n from '../../../../lib/i18n';
import { formatDate, formatDateTime, getTodayISODate } from '../../../../lib/utils';
import type { PhieuThanhLy } from '../core/types';
import type { HopDong } from '../core/types';

const t = i18n.t.bind(i18n);

const LY_DO_LABEL_KEYS: Record<string, string> = {
  'nghi-viec': 'hopDong.phieuThanhLy.lyDoNghiViec',
  'het-han-hd': 'hopDong.phieuThanhLy.lyDoHetHanHD',
  'thoa-thuan': 'hopDong.phieuThanhLy.lyDoThoaThuan',
  'vi-pham': 'hopDong.phieuThanhLy.lyDoViPham',
  khac: 'hopDong.phieuThanhLy.lyDoKhac',
};

function getLyDoLabel(lyDo: string): string {
  return t(LY_DO_LABEL_KEYS[lyDo] ?? lyDo);
}

function sanitizeFileName(name: string): string {
  return name.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
}

function getBaseFileName(phieu: PhieuThanhLy, hopDong: HopDong): string {
  const slug = sanitizeFileName(hopDong.ten_ung_vien ?? hopDong.id_ung_vien) + '_' + phieu.so_phieu;
  return `phieu_thanh_ly_${slug}_${getTodayISODate()}`;
}

function getPhieuThanhLyContentHtml(phieu: PhieuThanhLy, hopDong: HopDong): string {
  const rows = [
    [t('hopDong.table.ungVien'), hopDong.ten_ung_vien ?? '—'],
    [t('hopDong.table.soHopDong'), hopDong.so_hop_dong],
    [t('hopDong.phieuThanhLy.title'), phieu.so_phieu],
    [t('hopDong.phieuThanhLy.ngayThanhLy'), formatDate(phieu.ngay_thanh_ly)],
    [t('hopDong.phieuThanhLy.lyDo'), getLyDoLabel(phieu.ly_do)],
    [t('hopDong.ghiChu'), phieu.ghi_chu ?? '—'],
  ];
  const tableHtml = `<table style="width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:16px"><tbody>${rows
    .map(
      ([label, value]) =>
        `<tr><td style="width:38%;border:1px solid #ccc;padding:6px;font-weight:600;color:#444;background:#f9fafb;vertical-align:top">${label}</td><td style="border:1px solid #ccc;padding:6px;color:#111;vertical-align:top">${value}</td></tr>`
    )
    .join('')}</tbody></table>`;
  const printedAt = formatDateTime(new Date());
  return `
    <h1 style="font-size:14pt;font-weight:bold;margin-bottom:4px;color:#111">${t('hopDong.phieuThanhLy.title')}</h1>
    <p style="font-size:10pt;color:#666;margin-bottom:16px">${phieu.so_phieu} · ${hopDong.ten_ung_vien ?? hopDong.id_ung_vien}</p>
    ${tableHtml}
    <p style="font-size:9pt;color:#666;margin-top:24px">${t('hopDong.preview.printedAt')} ${printedAt}</p>
  `;
}

export async function exportPhieuThanhLyToPDF(
  phieu: PhieuThanhLy,
  hopDong: HopDong
): Promise<void> {
  const bodyHtml = getPhieuThanhLyContentHtml(phieu, hopDong);
  const fileName = getBaseFileName(phieu, hopDong);
  const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:210mm;padding:24px;font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:10pt;background:#fff;color:#111';
  container.innerHTML = `<div class="phieu-thanh-ly-export">${bodyHtml}</div>`;
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

export async function exportPhieuThanhLyToDoc(
  phieu: PhieuThanhLy,
  hopDong: HopDong
): Promise<void> {
  const bodyHtml = getPhieuThanhLyContentHtml(phieu, hopDong);
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"></head><body style="font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:10pt;padding:24px;">${bodyHtml}</body></html>`;
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${getBaseFileName(phieu, hopDong)}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
