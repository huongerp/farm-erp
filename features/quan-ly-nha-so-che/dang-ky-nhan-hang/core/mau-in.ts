/**
 * Mẫu in phiếu đăng ký nhận hàng: loại phiếu, khổ / hướng giấy, tham số URL preview
 * và dữ liệu sheet XLSX. Thuần — không phụ thuộc React hay store.
 */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { DangKyNhanHang } from './types';
import type { NhomHangHoa } from './gop-hang-hoa';
import { TZ_MAC_DINH, formatThoiLuong, soPhutTrongFarm } from './thoi-gian';

dayjs.extend(utc);
dayjs.extend(timezone);

export const LOAI_IN = ['dang-ky', 'kiem-hang', 'tong-hop'] as const;
export type LoaiIn = (typeof LOAI_IN)[number];

const laLoaiIn = (v: string | null | undefined): v is LoaiIn => v != null && (LOAI_IN as readonly string[]).includes(v);

/** Loại phiếu trong URL preview; lạ → phiếu đăng ký. Khổ / hướng / cỡ chữ do khung in nhớ theo mẫu. */
export function docLoaiIn(sp: URLSearchParams): LoaiIn {
  const v = sp.get('loai');
  return laLoaiIn(v) ? v : 'dang-ky';
}

export function taoUrlPreview(id: string, loai: LoaiIn = 'dang-ky'): string {
  return `/quan-ly-nha-so-che/dang-ky-nhan-hang/preview/${encodeURIComponent(id)}?loai=${loai}`;
}

/**
 * Mặc định in của từng loại: phiếu đăng ký A5 dọc (vừa mẫu giấy ở cổng, lề hẹp),
 * kiểm hàng / tổng hợp A4 dọc. Người dùng đổi trên trang preview thì khung in nhớ đè.
 */
export function macDinhIn(loai: LoaiIn): { kho: 'a4' | 'a5'; huong: 'doc' | 'ngang'; leMm: number } {
  return loai === 'dang-ky' ? { kho: 'a5', huong: 'doc', leMm: 10 } : { kho: 'a4', huong: 'doc', leMm: 15 };
}

export function tenFileIn(loai: LoaiIn, phieu: Pick<DangKyNhanHang, 'id' | 'so_xe' | 'ngay_dang_ky'>): string {
  const xe = (phieu.so_xe || `phieu-${phieu.id}`).replace(/[^A-Za-z0-9-]+/g, '');
  return `phieu-${loai}-${xe}-${phieu.ngay_dang_ky.replace(/-/g, '')}`;
}

// ── XLSX ─────────────────────────────────────────────────────────────────────

const ngayVn = (ymd: string) => (ymd ? ymd.split('-').reverse().join('/') : '');
const gioVn = (iso: string | null, tz: string) => (iso ? dayjs(iso).tz(tz).format('HH:mm DD/MM/YYYY') : '');

export type NhanXlsx = (key: string) => string;

export interface SheetXlsx {
  ten: string;
  dong: (string | number)[][];
}

/**
 * Dữ liệu các sheet XLSX. `nhan(key)` trả nhãn theo key trong `dangKyNhanHang.*`
 * (truyền `t` của i18n), để hàm vẫn thuần.
 */
export function taoSheetXlsx(
  loai: LoaiIn,
  phieu: DangKyNhanHang,
  nhom: NhomHangHoa[],
  nhan: NhanXlsx,
  tz = TZ_MAC_DINH
): SheetXlsx[] {
  const phut = soPhutTrongFarm(phieu.tg_vao_thuc_te, phieu.tg_ra_thuc_te);
  const thongTin: (string | number)[][] = [
    [nhan(`preview.title.${loai}`)],
    [],
    [nhan('col.ngay'), ngayVn(phieu.ngay_dang_ky)],
    [nhan('col.chiNhanh'), phieu.ten_chi_nhanh ?? ''],
    [nhan('col.khachHang'), phieu.khach_hang ?? ''],
    [nhan('col.loaiHang'), phieu.loai_hang_hoa ?? ''],
    [nhan('col.soXe'), phieu.so_xe ?? ''],
    [nhan('col.soCont'), phieu.so_cont ?? ''],
    [nhan('col.taiXe'), phieu.ten_tai_xe ?? ''],
    [nhan('col.sdtTaiXe'), phieu.sdt_tai_xe ?? ''],
    [nhan('form.tuGio'), phieu.gio_dang_ky_tu ?? ''],
    [nhan('form.denGio'), phieu.gio_dang_ky_den ?? ''],
    [nhan('col.gioVao'), gioVn(phieu.tg_vao_thuc_te, tz)],
    [nhan('col.gioRa'), gioVn(phieu.tg_ra_thuc_te, tz)],
  ];
  if (loai !== 'dang-ky') thongTin.push([nhan('col.thoiLuong'), phut != null ? formatThoiLuong(phut) : '']);
  thongTin.push([nhan('col.ghiChu'), phieu.ghi_chu ?? '']);

  const sheets: SheetXlsx[] = [{ ten: nhan('preview.sheetThongTin'), dong: thongTin }];
  if (loai !== 'dang-ky') {
    const tong = nhom.reduce((s, n) => s + n.so_luong, 0);
    sheets.push({
      ten: nhan('preview.sheetHangHoa'),
      dong: [
        ['STT', nhan('preview.maHang'), nhan('preview.tenHang'), nhan('hangHoa.dvt'), nhan('hangHoa.soLuong')],
        ...nhom.map((n, i) => [i + 1, n.ma_hang_hoa, n.ten_hang_hoa, n.dvt, n.so_luong]),
        ['', '', nhan('preview.tong'), '', tong],
      ],
    });
  }
  return sheets;
}
