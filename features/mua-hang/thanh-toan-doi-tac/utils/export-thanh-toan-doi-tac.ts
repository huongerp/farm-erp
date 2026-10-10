/**
 * Xuất thanh toán đối tác ra PDF – header công ty + thông tin phiếu.
 */
import type { ThanhToanDoiTac } from '../core/types';
import { formatDate, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';

export function getFileName(item: ThanhToanDoiTac): string {
  const slug = item.so_phieu.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Thanh_toan_doi_tac_${slug}_${getTodayISODate()}`;
}

/** Xuất thanh toán đối tác ra Excel */
export async function exportThanhToanDoiTacToXLSX(item: ThanhToanDoiTac): Promise<void> {
  const t = i18n.t.bind(i18n);
  const XLSX = await import('xlsx');
  const rows: (string | number)[][] = [
    [t('thanhToanDoiTac.form.soPhieu'), item.so_phieu],
    [t('thanhToanDoiTac.form.hangMuc'), item.hang_muc_thanh_toan],
    [t('thanhToanDoiTac.form.ngay'), formatDate(item.ngay)],
    [t('thanhToanDoiTac.form.donVi'), item.ten_don_vi ?? '—'],
    [t('thanhToanDoiTac.store.nhomDoiTacCol'), item.ten_nhom ?? '—'],
    [t('thanhToanDoiTac.form.doiTac'), item.ten_doi_tac ?? '—'],
    [t('thanhToanDoiTac.form.trangThai'), item.ten_trang_thai ?? '—'],
    [t('thanhToanDoiTac.form.soTien'), item.so_tien != null ? item.so_tien : '—'],
    [t('thanhToanDoiTac.form.ngayXuLy'), item.ngay_xu_ly ? formatDate(item.ngay_xu_ly) : '—'],
    [t('thanhToanDoiTac.form.ghiChu'), item.ghi_chu ?? '—'],
    [t('thanhToanDoiTac.form.nguoiTao'), item.ten_nguoi_tao ?? '—'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 40 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ThanhToan');
  XLSX.writeFile(wb, `${getFileName(item)}.xlsx`);
}
