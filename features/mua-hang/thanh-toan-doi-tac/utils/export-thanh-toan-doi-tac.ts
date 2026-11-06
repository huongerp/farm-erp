/**
 * Xuất thanh toán đối tác: một phiếu ra Excel + cột/mapper cho dialog Xuất danh sách.
 */
import type { TFunction } from 'i18next';
import type { ThanhToanDoiTac } from '../core/types';
import type { ExportColumn, KieuCotXuat } from '../../../../lib/export/dinh-dang-o';
import { formatDate, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { tenFileAnToan } from '../../../../lib/phieu-in/ten-file';

export function getFileName(item: ThanhToanDoiTac): string {
  const slug = tenFileAnToan(item.so_phieu);
  return `Thanh_toan_doi_tac_${slug}_${getTodayISODate()}`;
}

/** Xuất thanh toán đối tác ra Excel */
export async function exportThanhToanDoiTacToXLSX(item: ThanhToanDoiTac): Promise<void> {
  const t = i18n.t.bind(i18n);
  const XLSX = await import('xlsx');
  const rows: (string | number)[][] = [
    [t('thanhToanDoiTac.form.soPhieu'), item.so_phieu],
    [t('thanhToanDoiTac.form.hangMuc'), item.hang_muc_thanh_toan],
    [t('thanhToanDoiTac.form.noiDungChiTiet'), item.noi_dung_chi_tiet ?? '—'],
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

/* ───────────── Xuất danh sách (dialog Xuất chuẩn: Excel / CSV / PDF / Google Sheet) ───────────── */

/**
 * Thứ tự cột file xuất danh sách. Mapper trả giá trị THÔ (số, `YYYY-MM-DD`, ISO); kiểu cột
 * quyết định Excel nhận số/ngày thật — xem `lib/export/dinh-dang-o.ts`.
 */
export const TTDT_LIST_EXPORT_KEYS = [
  'so_phieu',
  'ngay',
  'hang_muc_thanh_toan',
  'noi_dung_chi_tiet',
  'ten_don_vi',
  'ten_nhom',
  'ma_doi_tac',
  'ten_doi_tac',
  'trang_thai',
  'so_tien',
  'ngay_xu_ly',
  'ghi_chu',
  'ten_nguoi_tao',
  'tg_tao',
  'tg_cap_nhat',
  'id',
] as const;

const KIEU_COT_TTDT: Partial<Record<(typeof TTDT_LIST_EXPORT_KEYS)[number], KieuCotXuat>> = {
  id: 'text',
  so_phieu: 'text',
  ma_doi_tac: 'text',
  ngay: 'date',
  ngay_xu_ly: 'date',
  so_tien: 'money',
  tg_tao: 'datetime',
  tg_cap_nhat: 'datetime',
};

export function mapThanhToanDoiTacListRow(p: ThanhToanDoiTac): Record<string, unknown> {
  return {
    id: p.id,
    so_phieu: (p.so_phieu ?? '').trim(),
    ngay: p.ngay ?? '',
    hang_muc_thanh_toan: (p.hang_muc_thanh_toan ?? '').trim(),
    noi_dung_chi_tiet: (p.noi_dung_chi_tiet ?? '').trim(),
    ten_don_vi: (p.ten_don_vi ?? '').trim(),
    ten_nhom: (p.ten_nhom ?? '').trim(),
    ma_doi_tac: (p.ma_doi_tac ?? '').trim(),
    ten_doi_tac: (p.ten_doi_tac ?? '').trim(),
    trang_thai: p.ten_trang_thai ?? '',
    // Giữ số thật (kể cả 0) — ô trống chỉ khi dữ liệu thiếu.
    so_tien: Number.isFinite(p.so_tien) ? p.so_tien : '',
    ngay_xu_ly: p.ngay_xu_ly ?? '',
    ghi_chu: (p.ghi_chu ?? '').trim(),
    ten_nguoi_tao: (p.ten_nguoi_tao ?? '').trim(),
    tg_tao: p.tg_tao ?? '',
    tg_cap_nhat: p.tg_cap_nhat ?? '',
  };
}

export function getExportColumnsThanhToanDoiTacList(t: TFunction): ExportColumn[] {
  return TTDT_LIST_EXPORT_KEYS.map((key) => ({
    key,
    label: t(`thanhToanDoiTac.export.list.${key}`),
    type: KIEU_COT_TTDT[key],
  }));
}

/** Tên file (ExportDialog tự thêm _YYYY-MM-DD). */
export const TTDT_LIST_EXPORT_FILE_NAME = 'Thanh_toan_doi_tac';
export const TTDT_LIST_EXPORT_SHEET_NAME = 'Thanh_toan';
