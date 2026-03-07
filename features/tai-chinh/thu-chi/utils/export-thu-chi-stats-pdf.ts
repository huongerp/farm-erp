/**
 * Export Thu chi Stats report to PDF.
 */
import type { ThuChiStatsByLoai, ThuChiStatsByTaiKhoan, ThuChiStatsByDanhMuc } from '../services/thu-chi-service';
import { formatCurrency } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';

export interface ThuChiStatsExportMeta {
  dateRangeLabel: string;
  filterLoaiLabels: string[];
  exportedAt: string;
}

function loaiLabel(loai: string): string {
  if (loai === 'thu') return i18n.t('thuChi.loaiThu');
  if (loai === 'chi') return i18n.t('thuChi.loaiChi');
  return i18n.t('thuChi.loaiChuyenQuy');
}

export async function exportThuChiStatsToPdf(
  meta: ThuChiStatsExportMeta,
  byLoai: ThuChiStatsByLoai[],
  byTaiKhoan: ThuChiStatsByTaiKhoan[],
  byDanhMuc: ThuChiStatsByDanhMuc[]
): Promise<void> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  let y = 14;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(i18n.t('thuChi.stats.pdfTitle'), pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(
    `${i18n.t('thuChi.stats.pdfPeriod')} ${meta.dateRangeLabel}  •  ${i18n.t('thuChi.stats.pdfExportDate')} ${meta.exportedAt}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  doc.setTextColor(0);
  y += 6;

  if (meta.filterLoaiLabels.length > 0) {
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`${i18n.t('thuChi.stats.pdfFilterLoai')} ${meta.filterLoaiLabels.join(', ')}`, marginX, y);
    doc.setTextColor(0);
    y += 5;
  }

  y += 2;

  // Bảng theo loại (Tổng quan)
  const loaiHead = [i18n.t('thuChi.columns.loai'), i18n.t('thuChi.stats.soGiaoDich'), i18n.t('thuChi.columns.soTien')];
  const loaiBody = byLoai.map((r) => [loaiLabel(r.loai), String(r.so_giao_dich), formatCurrency(r.tong_tien)]);

  autoTable(doc, {
    startY: y,
    head: [loaiHead],
    body: loaiBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], fontSize: 8, fontStyle: 'bold', textColor: 255 },
    margin: { left: marginX, right: marginX },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  // Bảng theo tài khoản
  if (byTaiKhoan.length > 0) {
    if (y > 200) {
      doc.addPage();
      y = 14;
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(i18n.t('thuChi.stats.byTaiKhoan'), marginX, y);
    y += 6;

    const tkHead = [
      i18n.t('thuChi.columns.taiKhoan'),
      i18n.t('thuChi.stats.tongThu'),
      i18n.t('thuChi.stats.tongChi'),
      i18n.t('thuChi.stats.soGiaoDich'),
    ];
    const tkBody = byTaiKhoan.map((r) => [
      r.ten_tai_khoan,
      formatCurrency(r.tong_thu),
      formatCurrency(r.tong_chi),
      String(r.so_giao_dich),
    ]);

    autoTable(doc, {
      startY: y,
      head: [tkHead],
      body: tkBody,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], fontSize: 7, fontStyle: 'bold', textColor: 255 },
      margin: { left: marginX, right: marginX },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Bảng theo danh mục
  if (byDanhMuc.length > 0) {
    if (y > 200) {
      doc.addPage();
      y = 14;
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(i18n.t('thuChi.stats.byDanhMuc'), marginX, y);
    y += 6;

    const dmHead = [
      i18n.t('thuChi.columns.danhMuc'),
      i18n.t('thuChi.columns.loai'),
      i18n.t('thuChi.stats.soGiaoDich'),
      i18n.t('thuChi.columns.soTien'),
    ];
    const dmBody = byDanhMuc.map((r) => [
      r.ten_danh_muc,
      loaiLabel(r.loai),
      String(r.so_giao_dich),
      formatCurrency(r.tong_tien),
    ]);

    autoTable(doc, {
      startY: y,
      head: [dmHead],
      body: dmBody,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], fontSize: 7, fontStyle: 'bold', textColor: 255 },
      margin: { left: marginX, right: marginX },
    });
  }

  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
}
