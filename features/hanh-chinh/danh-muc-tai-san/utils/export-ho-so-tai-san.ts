/**
 * Xuất hồ sơ tài sản ra PDF, Excel, Doc – tham chiếu export-bang-luong.
 */
import type { TaiSan } from '../core/types';
import { getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';

export function getFileName(record: TaiSan): string {
  const slug = `${record.ma_tai_san}_${record.ten_tai_san}`.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Ho_so_tai_san_${slug}_${getTodayISODate()}`;
}

/** Xuất hồ sơ tài sản ra Excel */
export async function exportHoSoTaiSanExcel(record: TaiSan): Promise<void> {
  const XLSX = await import('xlsx');
  const info = useUIStore.getState().companyInfo;

  const nguoiGiu =
    record.ten_nhan_vien_dang_giu
      ? `${record.ten_nhan_vien_dang_giu}${record.ma_nhan_vien_dang_giu ? ` (${record.ma_nhan_vien_dang_giu})` : ''}`
      : '—';

  const data: (string | number | null)[][] = [
    [info.companyName],
    ...(info.address ? [[i18n.t('company.address'), info.address]] : []),
    ...(info.email ? [[i18n.t('company.email'), info.email]] : []),
    ...(info.phone ? [[i18n.t('company.phone'), info.phone]] : []),
    [],
    [i18n.t('danhSachTaiSan.preview.title')],
    [record.ma_tai_san, record.ten_tai_san],
    [],
    [i18n.t('danhSachTaiSan.store.maCol'), record.ma_tai_san],
    [i18n.t('danhSachTaiSan.store.tenCol'), record.ten_tai_san],
    [i18n.t('danhSachTaiSan.store.nhomCol'), record.ten_nhom ?? '—'],
    [i18n.t('danhSachTaiSan.store.noiLuuCol'), record.ten_noi_luu ?? '—'],
    [i18n.t('danhSachTaiSan.store.trangThaiCol'), record.ten_trang_thai ?? '—'],
    [i18n.t('danhSachTaiSan.store.nguoiGiuCol'), nguoiGiu],
    [i18n.t('danhSachTaiSan.store.ngayNhapCol'), record.ngay_nhap],
    [i18n.t('danhSachTaiSan.store.nguyenGiaCol'), record.nguyen_gia ?? '—'],
    [i18n.t('danhSachTaiSan.form.ghiChu'), record.ghi_chu ?? '—'],
    [i18n.t('danhSachTaiSan.store.updatedCol'), record.tg_cap_nhat],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 28 }, { wch: 40 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ho so tai san');
  XLSX.writeFile(wb, `${getFileName(record)}.xlsx`);
}
