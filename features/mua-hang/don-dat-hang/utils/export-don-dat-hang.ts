/**
 * Xuất đơn đặt hàng ra PDF, DOC, XLSX – toàn bộ từ source (po, chiTiet), không phụ thuộc trang preview.
 *
 * - PDF: Tạo tài liệu HTML từ buildDonDatHangBodyHTML, render trong iframe rồi chụp bằng html2canvas
 *        → chèn ảnh vào jsPDF. Chữ màu đen (#222), font Arial, đúng tiếng Việt.
 * - DOC: HTML table-based, UTF-8 BOM, Times New Roman.
 * - XLSX: SheetJS, Unicode.
 */
import type { DonDatHang, DonDatHangChiTiet } from '../core/types';
import { TRANG_THAI_KEY } from '../core/constants';
import { formatDate, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';

function safe(v: string | number | null | undefined): string {
  if (v == null || v === '') return '–';
  return String(v);
}

function getTrangThaiLabel(trangThai: DonDatHang['trang_thai'], t: (k: string) => string): string {
  const key = TRANG_THAI_KEY[trangThai];
  return key ? t(`donDatHang.status.${key}`) : String(trangThai);
}

export function getFileName(po: DonDatHang): string {
  const slug = po.so_po.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Don_dat_hang_${slug}_${getTodayISODate()}`;
}

/** Xuất đơn đặt hàng ra Excel */
export async function exportDonDatHangToXLSX(po: DonDatHang, chiTiet: DonDatHangChiTiet[]): Promise<void> {
  const t = i18n.t.bind(i18n);
  const XLSX = await import('xlsx');
  const infoRows: (string | number)[][] = [
    [t('donDatHang.form.code'), po.so_po],
    [t('donDatHang.form.orderDate'), formatDate(po.ngay_dat)],
    [t('donDatHang.form.deliveryDate'), formatDate(po.ngay_giao_dk)],
    [t('donDatHang.form.supplier'), po.ten_nha_cung_cap ?? '—'],
    [t('donDatHang.form.warehouse'), po.ten_kho_nhan ?? '—'],
    [t('donDatHang.form.linkRequest'), po.so_phieu_de_xuat ?? '—'],
    [t('donDatHang.form.buyer'), po.ten_nguoi_dat ?? '—'],
    [t('donDatHang.form.approver'), po.ten_nguoi_duyet ?? '—'],
    [t('donDatHang.form.paymentTerms'), po.dieu_khoan_thanh_toan ?? '—'],
    [t('donDatHang.form.notes'), po.ghi_chu ?? '—'],
    [t('donDatHang.store.statusCol'), getTrangThaiLabel(po.trang_thai, t)],
  ];
  const rows: (string | number)[][] = [...infoRows, []];
  if (chiTiet.length > 0) {
    rows.push(
      [
        '#',
        t('donDatHang.form.item') + ' (mã)',
        t('donDatHang.form.item') + ' (tên)',
        t('donDatHang.form.unit'),
        t('donDatHang.form.quantity'),
        t('donDatHang.form.unitPrice'),
        'Thành tiền',
        t('donDatHang.chiTietTab.purposeOfUseCol'),
        t('donDatHang.form.note'),
      ]
    );
    chiTiet.forEach((c, idx) => {
      rows.push([
        idx + 1,
        safe(c.ma_hang),
        safe(c.ten_hang),
        safe(c.don_vi_tinh),
        c.so_luong,
        c.don_gia != null ? c.don_gia : '–',
        c.thanh_tien != null ? c.thanh_tien : '–',
        safe(c.muc_dich_su_dung),
        safe(c.ghi_chu),
      ]);
    });
  }
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 4 },
    { wch: 16 },
    { wch: 28 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 24 },
  ];
  // Đơn giá (col F, idx 5) và Thành tiền (col G, idx 6) là số thật → định dạng phân tách hàng nghìn
  const detailStartRow = infoRows.length + 2; // sau info + dòng trống + header
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = detailStartRow; R <= range.e.r; R++) {
    for (const C of [5, 6]) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell && typeof cell.v === 'number') cell.z = '#,##0';
    }
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DonDatHang');
  XLSX.writeFile(wb, `${getFileName(po)}.xlsx`);
}
