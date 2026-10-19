/**
 * Tải phiếu in / danh sách xe dạng XLSX (PDF / DOC do khung in dùng chung chụp từ bản xem trước).
 */
import type { TFunction } from 'i18next';
import type { DangKyNhanHang } from '../core/types';
import type { NhomHangHoa } from '../core/gop-hang-hoa';
import { taoSheetXlsx, tenFileIn, type LoaiIn } from '../core/mau-in';
import {
  cotDanhSachIn,
  taoAoaDanhSachXlsx,
  type CotDanhSachIn,
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

/** Tải danh sách xe đang lọc dạng XLSX (cùng tiêu đề và cột với bản in). */
export async function taiXlsxDanhSach(
  tieuDe: string,
  tenFile: string,
  dong: DongDanhSachIn[],
  t: TFunction
): Promise<void> {
  const XLSX = await import('xlsx');
  const aoa = taoAoaDanhSachXlsx(tieuDe.toUpperCase(), dong, (k, vars) => t(`dangKyNhanHang.inDanhSach.${k}`, vars));
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const cot = cotDanhSachIn(dong);
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: cot.length - 1 } }];
  ws['!cols'] = cot.map((c) => ({ wch: RONG_COT_XLSX[c] }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sach xe');
  XLSX.writeFile(wb, `${tenFile}.xlsx`);
}

const RONG_COT_XLSX: Record<CotDanhSachIn, number> = {
  stt: 6,
  ngay: 12,
  soXe: 14,
  taiXe: 20,
  trangThai: 12,
  kho: 14,
  tgDuKien: 14,
  tgThucTe: 18,
  tongThoiGian: 16,
  thongTin: 26,
  khachHang: 18,
  soLuong: 12,
  loaiHang: 30,
};
