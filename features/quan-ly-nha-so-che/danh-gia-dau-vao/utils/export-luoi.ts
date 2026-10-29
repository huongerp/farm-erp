/**
 * Tải Tổng hợp ngày (khoảng ngày đang chọn, lưới đã cộng mọi chuyến) dạng XLSX — một sheet, mỗi ngày × chi nhánh một khối,
 * có băng hình đầu file (ghiXlsxCoBangHinh). Bản community của SheetJS không tô màu ô được: tiêu đề
 * dây ghi tên màu (kèm «xé đôi»), màu nền chỉ có ở bản in / PDF.
 */
import type { TFunction } from 'i18next';
import type { DgdvKhoiNgay, DgdvLuoiNgay } from '../core/bang-tinh';
import { nhanTiLeKsc } from './export-danh-sach';
import { formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import { ghiXlsxCoBangHinh } from '../../../../lib/export/xlsx-bang-hinh';
import { taoAoaLuoi, type DgdvNhanXuat } from './xuat-luoi-aoa';

export function tenFileLuoi(tu: string, den: string): string {
  return tu === den ? `danh-gia-dau-vao-${tu}` : `danh-gia-dau-vao-${tu}_${den}`;
}

/**
 * Lưới tổng ngày (chuyen = 0): «2 chuyến (C1: 320 · C2: 410) · % KSC 2,5%»; lưới một chuyến → null.
 * Dùng chung cho dòng thông tin của bản in và file XLSX.
 */
export function tomTatChuyenLuoi(l: Pick<DgdvLuoiNgay, 'chuyen' | 'dsChuyen' | 'ksc' | 'tongThu'>, t: TFunction): string | null {
  if (l.chuyen !== 0) return null;
  const ds = l.dsChuyen.map((c) => t('danhGiaDauVao.bang.chuyenNhan', { chuyen: c.chuyen, tongThu: formatNumberVN(c.tongThu) })).join(' · ');
  return [
    t('danhGiaDauVao.luoi.tomTatChuyen', { n: l.dsChuyen.length, ds }),
    t('danhGiaDauVao.bang.tiLeKsc', { tiLe: nhanTiLeKsc(l.ksc, l.tongThu) }),
  ].join(' · ');
}

export function nhanXuatLuoi(t: TFunction): DgdvNhanXuat {
  return {
    tieuDe: (cn) => t('danhGiaDauVao.preview.tieuDe', { chiNhanh: cn }).trim(),
    dongThongTin: (l) =>
      [
        `${t('danhGiaDauVao.luoi.ksc')} ${formatNumberVN(l.ksc)}`,
        `${t('danhGiaDauVao.luoi.tongThu')} ${formatNumberVN(l.tongThu)}`,
        tomTatChuyenLuoi(l, t),
        `${t('danhGiaDauVao.luoi.tuanThuHoach')} ${l.tuanThuHoach.length > 0 ? l.tuanThuHoach.map((x) => x.tuan).join(', ') : l.tuan}`,
        `${t('danhGiaDauVao.luoi.ngay')} ${formatYmdToDisplay(l.ngay)}`,
      ]
        .filter(Boolean)
        .join(' · '),
    lo: t('danhGiaDauVao.luoi.colLo'),
    slBuong: t('danhGiaDauVao.luoi.colSlBuong'),
    ghiChu: t('danhGiaDauVao.luoi.colGhiChu'),
    soLuong: t('danhGiaDauVao.luoi.colSoLuong'),
    danhGia: t('danhGiaDauVao.luoi.colDanhGia'),
    slLoi: t('danhGiaDauVao.luoi.colSlLoi'),
    lyDoLoi: t('danhGiaDauVao.luoi.colLyDoLoi'),
    tuan: (x) => t('danhGiaDauVao.luoi.tuan', { tuan: x.tuan }),
    chuaCoTuan: t('danhGiaDauVao.luoi.chuaCoTuan'),
    tongCong: t('danhGiaDauVao.luoi.tongCong'),
    chuaCoToTruong: t('danhGiaDauVao.luoi.chuaCoToTruong'),
    dutDay: (n) => t('danhGiaDauVao.luoi.dutDayN', { n: formatNumberVN(n) }),
  };
}

/** Trả false khi khoảng ngày không có phiếu nào (không tạo file rỗng). */
export async function taiXlsxLuoi(dsKhoi: DgdvKhoiNgay[], tu: string, den: string, t: TFunction, tenFile = tenFileLuoi(tu, den)): Promise<boolean> {
  const { aoa, merges, soCot } = taoAoaLuoi(dsKhoi, nhanXuatLuoi(t));
  if (aoa.length === 0) return false;
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = merges;
  ws['!cols'] = Array.from({ length: soCot }, (_, c) => {
    if (c === 0) return { wch: 24 };
    if (c === 1) return { wch: 10 };
    if (c === soCot - 1) return { wch: 24 };
    return { wch: (c - 2) % 2 === 0 ? 8 : 16 };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, t('danhGiaDauVao.title').slice(0, 31));
  await ghiXlsxCoBangHinh(XLSX, wb, `${tenFile}.xlsx`);
  return true;
}
