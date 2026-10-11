/**
 * Tải phiếu in / danh sách xe dạng XLSX (PDF / DOC do khung in dùng chung chụp từ bản xem trước).
 */
import type { TFunction } from 'i18next';
import type { DangKyNhanHang } from '../core/types';
import type { NhomHangHoa } from '../core/gop-hang-hoa';
import { taoSheetXlsx, tenFileIn, type LoaiIn } from '../core/mau-in';
import {
  COT_DANH_SACH_IN,
  ngayVn,
  taoAoaDanhSachXlsx,
  tenFileDanhSach,
  type DongDanhSachIn,
} from '../core/danh-sach-in';

export async function taiXlsx(phieu: DangKyNhanHang, nhom: NhomHangHoa[], loai: LoaiIn, t: TFunction): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const sheets = taoSheetXlsx(loai, phieu, nhom, (k) => t(`dangKyNhanHang.${k}`));
  sheets.forEach((sh, i) => {
    const ws = XLSX.utils.aoa_to_sheet(sh.dong);
    ws['!cols'] =
      i === 0 ? [{ wch: 24 }, { wch: 44 }] : [{ wch: 6 }, { wch: 16 }, { wch: 34 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, sh.ten.slice(0, 31));
  });
  XLSX.writeFile(wb, `${tenFileIn(loai, phieu)}.xlsx`);
}

/** Tải "Danh sách dự kiến xe giao nhận hàng" của một ngày dạng XLSX (cùng cột với bản in). */
export async function taiXlsxDanhSach(ngay: string, dong: DongDanhSachIn[], t: TFunction): Promise<void> {
  const XLSX = await import('xlsx');
  const aoa = taoAoaDanhSachXlsx(ngay, dong, (k, vars) => t(`dangKyNhanHang.inDanhSach.${k}`, vars));
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: COT_DANH_SACH_IN.length - 1 } }];
  ws['!cols'] = [6, 14, 20, 12, 14, 26, 18, 12, 30].map((wch) => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, ngayVn(ngay).slice(0, 5).replace('/', '-'));
  XLSX.writeFile(wb, `${tenFileDanhSach(ngay)}.xlsx`);
}
