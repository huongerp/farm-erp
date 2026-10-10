/**
 * Tải phiếu in dạng XLSX (PDF / DOC do khung in dùng chung chụp từ bản xem trước).
 */
import type { TFunction } from 'i18next';
import type { DangKyNhanHang } from '../core/types';
import type { NhomHangHoa } from '../core/gop-hang-hoa';
import { taoSheetXlsx, tenFileIn, type LoaiIn } from '../core/mau-in';

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
