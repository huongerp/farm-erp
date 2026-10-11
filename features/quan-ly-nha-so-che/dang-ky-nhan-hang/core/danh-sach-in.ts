/**
 * In "Danh sách dự kiến xe giao nhận hàng" theo ngày: tham số URL, dòng bảng in và dữ liệu
 * sheet XLSX. Thuần — không phụ thuộc React hay store.
 */
import type { DangKyNhanHang, TrangThaiDkNh } from './types';

const DUONG_DAN = '/quan-ly-nha-so-che/dang-ky-nhan-hang/in-danh-sach';
const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Trạng thái được in — phiếu huỷ không phải xe dự kiến vào. */
export const TRANG_THAI_IN_DANH_SACH: TrangThaiDkNh[] = ['cho_vao', 'da_vao', 'da_ra'];

export function taoUrlInDanhSach(ngay: string, idChiNhanh: string[] = []): string {
  const sp = new URLSearchParams({ ngay });
  if (idChiNhanh.length) sp.set('cn', idChiNhanh.join(','));
  return `${DUONG_DAN}?${sp.toString()}`;
}

/** Ngày sai định dạng / thiếu → null (trang in báo lỗi); chi nhánh chỉ giữ id số. */
export function docThamSoInDanhSach(sp: URLSearchParams): { ngay: string | null; idChiNhanh: string[] } {
  const ngay = sp.get('ngay');
  const idChiNhanh = (sp.get('cn') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s));
  return { ngay: ngay && YMD.test(ngay) && !Number.isNaN(Date.parse(ngay)) ? ngay : null, idChiNhanh };
}

export const ngayVn = (ymd: string) => ymd.split('-').reverse().join('/');

export function tenFileDanhSach(ngay: string): string {
  return `danh-sach-xe-${ngayVn(ngay).replace(/\//g, '-')}`;
}

export interface DongDanhSachIn {
  id: string;
  stt: number;
  soXe: string;
  taiXe: string;
  trangThai: string;
  kho: string;
  thongTin: string;
  khachHang: string;
  soLuong: number | null;
  loaiHang: string;
}

/** Bỏ phiếu huỷ, xếp theo giờ đăng ký (chưa có giờ xuống cuối), đánh STT. */
export function taoDongDanhSachIn(
  phieu: DangKyNhanHang[],
  nhanTrangThai: (tt: TrangThaiDkNh) => string
): DongDanhSachIn[] {
  return phieu
    .filter((p) => TRANG_THAI_IN_DANH_SACH.includes(p.trang_thai))
    .map((p, i) => ({ p, i }))
    .sort((a, b) => {
      const ga = a.p.gio_dang_ky_tu;
      const gb = b.p.gio_dang_ky_tu;
      if (ga && gb && ga !== gb) return ga.localeCompare(gb);
      if (!ga !== !gb) return ga ? -1 : 1;
      return a.i - b.i;
    })
    .map(({ p }, i) => ({
      id: p.id,
      stt: i + 1,
      soXe: p.so_xe || p.so_cont || '',
      taiXe: p.ten_tai_xe ?? '',
      trangThai: nhanTrangThai(p.trang_thai),
      kho: p.ten_chi_nhanh ?? '',
      thongTin: p.ghi_chu ?? '',
      khachHang: p.khach_hang ?? '',
      soLuong: p.so_luong_dang_ky,
      loaiHang: p.loai_hang_hoa ?? '',
    }));
}

/** Khoá nhãn cột (trong `dangKyNhanHang.inDanhSach.col.*`) theo đúng thứ tự in. */
export const COT_DANH_SACH_IN = [
  'stt',
  'soXe',
  'taiXe',
  'trangThai',
  'kho',
  'thongTin',
  'khachHang',
  'soLuong',
  'loaiHang',
] as const;

/**
 * Dòng sheet XLSX: tiêu đề, "Số lượng xe: N", dòng trống, header, dữ liệu.
 * `nhan(key)` trả nhãn theo key trong `dangKyNhanHang.inDanhSach.*` (truyền `t` của i18n).
 */
export function taoAoaDanhSachXlsx(
  ngay: string,
  dong: DongDanhSachIn[],
  nhan: (key: string, vars?: Record<string, unknown>) => string
): (string | number)[][] {
  return [
    [nhan('tieuDe', { ngay: ngayVn(ngay) })],
    [nhan('soLuongXe', { n: dong.length })],
    [],
    COT_DANH_SACH_IN.map((c) => nhan(`col.${c}`)),
    ...dong.map((d) => [
      d.stt,
      d.soXe,
      d.taiXe,
      d.trangThai,
      d.kho,
      d.thongTin,
      d.khachHang,
      d.soLuong ?? '',
      d.loaiHang,
    ]),
  ];
}
