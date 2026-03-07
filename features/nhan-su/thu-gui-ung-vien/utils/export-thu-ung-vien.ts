/**
 * Xuất thư (từ chối / mời nhận việc) ra PDF / XLSX / DOC – chuẩn như module khác.
 */
import i18n from '../../../../lib/i18n';
import { getTodayISODate } from '../../../../lib/utils';

export type ThuUngVienExportFormat = 'pdf' | 'xlsx' | 'doc';

export interface ExportThuUngVienOptions {
  title: string;
  bodyHtml: string;
  /** Tên ứng viên (để đặt tên file) */
  hoTen?: string;
  /** Loại thư: tu-choi | moi-nhan-viec */
  loaiThu?: string;
}

function sanitizeFileName(name: string): string {
  return name.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
}

function getBaseFileName(hoTen?: string, loaiThu?: string): string {
  const slug = sanitizeFileName(hoTen || 'thu') + '_' + (loaiThu === 'moi-nhan-viec' ? 'moi_nhan_viec' : 'tu_choi');
  return `thu_ung_vien_${slug}_${getTodayISODate()}`;
}

/** Chuyển HTML sang text thuần (để XLSX / mô tả) */
function htmlToPlainText(html: string): string {
  if (!html) return '';
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').trim().replace(/\s+/g, ' ');
  }
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Xuất thư ứng viên ra PDF (HTML → jsPDF.html) */
export async function exportThuUngVienToPDF(options: ExportThuUngVienOptions): Promise<void> {
  const { title, bodyHtml, hoTen, loaiThu } = options;
  const fileName = getBaseFileName(hoTen, loaiThu);
  const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:210mm;padding:24px;font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:10pt;background:#fff;color:#111';
  container.innerHTML = `
    <div class="thu-ung-vien-preview-content">
      ${title ? `<h1 style="font-size:14pt;font-weight:bold;margin-bottom:16px;color:#111">${title}</h1>` : ''}
      <div style="line-height:1.5;max-width:100%">${bodyHtml}</div>
    </div>`;

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

/** Xuất thư ứng viên ra Excel (1 dòng metadata + nội dung) */
export async function exportThuUngVienToXLSX(options: ExportThuUngVienOptions): Promise<void> {
  const { title, bodyHtml, hoTen, loaiThu } = options;
  const t = i18n.t.bind(i18n);
  const XLSX = await import('xlsx');
  const loaiLabel = loaiThu === 'moi-nhan-viec' ? t('thuGuiUngVien.letterJobOffer') : t('thuGuiUngVien.letterReject');
  const bodyText = htmlToPlainText(bodyHtml);

  const data: (string | number)[][] = [
    [t('thuGuiUngVien.table.ungVien'), hoTen ?? '—'],
    [t('thuGuiUngVien.table.loaiPhieu'), loaiLabel],
    [t('thuGuiUngVien.previewTitle'), title || '—'],
    [],
    [t('thuGuiUngVien.export.contentCol'), bodyText],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 18 }, { wch: 60 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Thư');
  XLSX.writeFile(wb, `${getBaseFileName(hoTen, loaiThu)}.xlsx`);
}

/** Xuất thư ứng viên ra Word (HTML mở được bằng Word) */
export async function exportThuUngVienToDoc(options: ExportThuUngVienOptions): Promise<void> {
  const { title, bodyHtml, hoTen, loaiThu } = options;
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"></head><body style="font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:10pt;padding:24px;">${title ? `<h1 style="font-size:14pt;margin-bottom:16px;">${title}</h1>` : ''}<div>${bodyHtml}</div></body></html>`;
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${getBaseFileName(hoTen, loaiThu)}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
