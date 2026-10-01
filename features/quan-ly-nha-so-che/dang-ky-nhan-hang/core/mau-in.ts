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
export const KHO_GIAY = ['a4', 'a5'] as const;
export type KhoGiay = (typeof KHO_GIAY)[number];
export const HUONG_GIAY = ['doc', 'ngang'] as const;
export type HuongGiay = (typeof HUONG_GIAY)[number];

export interface ThamSoIn {
  loai: LoaiIn;
  kho: KhoGiay;
  huong: HuongGiay;
}

/** Phiếu đăng ký mặc định A5 dọc — vừa cỡ mẫu giấy đang dùng ở cổng. */
export const THAM_SO_IN_MAC_DINH: ThamSoIn = { loai: 'dang-ky', kho: 'a5', huong: 'doc' };

const thuoc = <T extends string>(ds: readonly T[], v: string | null | undefined): v is T =>
  v != null && (ds as readonly string[]).includes(v);

/** Chỉ phiếu đăng ký được chọn khổ / hướng; hai loại còn lại cố định A4 dọc. */
export function chuanHoaThamSoIn(v: { loai?: string | null; kho?: string | null; huong?: string | null }): ThamSoIn {
  const loai = thuoc(LOAI_IN, v.loai) ? v.loai : THAM_SO_IN_MAC_DINH.loai;
  if (loai !== 'dang-ky') return { loai, kho: 'a4', huong: 'doc' };
  return {
    loai,
    kho: thuoc(KHO_GIAY, v.kho) ? v.kho : THAM_SO_IN_MAC_DINH.kho,
    huong: thuoc(HUONG_GIAY, v.huong) ? v.huong : THAM_SO_IN_MAC_DINH.huong,
  };
}

export function docThamSoIn(sp: URLSearchParams): ThamSoIn {
  return chuanHoaThamSoIn({ loai: sp.get('loai'), kho: sp.get('kho'), huong: sp.get('huong') });
}

export function taoUrlPreview(id: string, ts: Partial<ThamSoIn> = {}): string {
  const p = chuanHoaThamSoIn(ts);
  const q = new URLSearchParams({ loai: p.loai });
  if (p.loai === 'dang-ky') {
    q.set('kho', p.kho);
    q.set('huong', p.huong);
  }
  return `/quan-ly-nha-so-che/dang-ky-nhan-hang/preview/${encodeURIComponent(id)}?${q.toString()}`;
}

/** Kích thước tờ giấy (mm). */
export function kichThuocGiay(kho: KhoGiay, huong: HuongGiay): { wMm: number; hMm: number } {
  const [ngan, dai] = kho === 'a4' ? [210, 297] : [148, 210];
  return huong === 'doc' ? { wMm: ngan, hMm: dai } : { wMm: dai, hMm: ngan };
}

/** Lề in (mm) — A5 hẹp hơn để còn chỗ cho nội dung. */
export function leTrang(kho: KhoGiay): number {
  return kho === 'a4' ? 15 : 10;
}

/** Chuỗi cho CSS `@page { size: … }`, vd `A5 landscape`. */
export function cssPageSize(kho: KhoGiay, huong: HuongGiay): string {
  return `${kho.toUpperCase()} ${huong === 'doc' ? 'portrait' : 'landscape'}`;
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
