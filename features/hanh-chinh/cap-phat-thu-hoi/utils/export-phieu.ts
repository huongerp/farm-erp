/**
 * Xuất danh sách phiếu cấp phát/thu hồi ra Excel/PDF.
 * Xuất 1 phiếu ra PDF (in phiếu).
 */
import type { PhieuCapPhatThuHoi } from '../core/types';
import { formatDate, formatDateTimeShort, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { getLoaiPhieuLabel } from '../core/constants';

export interface PhieuExportRow {
  loai_phieu: string;
  ma_tai_san: string;
  ten_tai_san: string;
  ten_noi_luu_truoc: string;
  ten_noi_luu_sau: string;
  ten_nguoi_giu_truoc: string;
  ten_nguoi_giu_sau: string;
  ngay_thuc_hien: string;
  ten_nguoi_thuc_hien: string;
  ghi_chu: string;
  tg_cap_nhat: string;
}

export function phieuToExportRow(p: PhieuCapPhatThuHoi): PhieuExportRow {
  return {
    loai_phieu: getLoaiPhieuLabel(p.loai_phieu, i18n.t),
    ma_tai_san: p.ma_tai_san ?? '',
    ten_tai_san: p.ten_tai_san ?? '',
    ten_noi_luu_truoc: p.ten_noi_luu_truoc ?? '',
    ten_noi_luu_sau: p.ten_noi_luu_sau ?? '',
    ten_nguoi_giu_truoc: p.ten_nguoi_giu_truoc ?? '',
    ten_nguoi_giu_sau: p.ten_nguoi_giu_sau ?? '',
    ngay_thuc_hien: formatDate(p.ngay_thuc_hien),
    ten_nguoi_thuc_hien: p.ten_nguoi_thuc_hien ?? '',
    ghi_chu: p.ghi_chu ?? '',
    tg_cap_nhat: formatDateTimeShort(p.tg_cap_nhat),
  };
}

export const PHIEU_EXPORT_COLUMNS: { key: keyof PhieuExportRow; label: string }[] = [
  { key: 'loai_phieu', label: i18n.t('capPhatThuHoi.store.loaiCol') },
  { key: 'ma_tai_san', label: i18n.t('capPhatThuHoi.store.maTaiSanCol') },
  { key: 'ten_tai_san', label: i18n.t('capPhatThuHoi.store.taiSanCol') },
  { key: 'ten_noi_luu_truoc', label: i18n.t('capPhatThuHoi.store.noiLuuTruocCol') },
  { key: 'ten_noi_luu_sau', label: i18n.t('capPhatThuHoi.store.noiLuuSauCol') },
  { key: 'ten_nguoi_giu_truoc', label: i18n.t('capPhatThuHoi.store.nguoiGiuTruocCol') },
  { key: 'ten_nguoi_giu_sau', label: i18n.t('capPhatThuHoi.store.nguoiGiuSauCol') },
  { key: 'ngay_thuc_hien', label: i18n.t('capPhatThuHoi.store.ngayCol') },
  { key: 'ten_nguoi_thuc_hien', label: i18n.t('capPhatThuHoi.store.nguoiThucHienCol') },
  { key: 'ghi_chu', label: i18n.t('capPhatThuHoi.store.ghiChuCol') },
  { key: 'tg_cap_nhat', label: i18n.t('capPhatThuHoi.store.updatedCol') },
];

export function exportPhieuToPDF(phieu: PhieuCapPhatThuHoi): Promise<void> {
  return Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]).then(([{ jsPDF }, autoTableModule]) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const title = i18n.t('capPhatThuHoi.detail.title');
    doc.setFontSize(14);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`${getLoaiPhieuLabel(phieu.loai_phieu, i18n.t)} · ${phieu.ma_tai_san ?? phieu.id_tai_san}`, 14, 22);

    const rows = [
      [i18n.t('capPhatThuHoi.store.taiSanCol'), phieu.ten_tai_san ?? '—'],
      [i18n.t('capPhatThuHoi.store.noiLuuTruocCol'), phieu.ten_noi_luu_truoc ?? '—'],
      [i18n.t('capPhatThuHoi.store.noiLuuSauCol'), phieu.ten_noi_luu_sau ?? '—'],
      [i18n.t('capPhatThuHoi.store.nguoiGiuTruocCol'), phieu.ten_nguoi_giu_truoc ?? '—'],
      [i18n.t('capPhatThuHoi.store.nguoiGiuSauCol'), phieu.ten_nguoi_giu_sau ?? '—'],
      [i18n.t('capPhatThuHoi.store.ngayCol'), formatDate(phieu.ngay_thuc_hien)],
      [i18n.t('capPhatThuHoi.store.nguoiThucHienCol'), phieu.ten_nguoi_thuc_hien ?? '—'],
      [i18n.t('capPhatThuHoi.store.ghiChuCol'), phieu.ghi_chu ?? '—'],
    ];
    const autoTable = autoTableModule.default;
    autoTable(doc, {
      head: [['Trường', 'Nội dung']],
      body: rows,
      startY: 28,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 130 } },
    });
    doc.save(`phieu_cap_phat_thu_hoi_${phieu.id}_${getTodayISODate()}.pdf`);
  });
}
