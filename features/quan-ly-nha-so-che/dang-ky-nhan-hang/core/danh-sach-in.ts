/**
 * In "Danh sách dự kiến xe giao nhận hàng" theo bộ lọc đang áp trên toolbar danh sách:
 * tham số URL, tiêu đề, dòng bảng in và dữ liệu sheet XLSX. Thuần — không phụ thuộc React hay store.
 */
import dayjs from 'dayjs';
import { TRANG_THAI_DKNH, type DangKyNhanHang, type TrangThaiDkNh } from './types';
import { chuanHoaGio, TZ_MAC_DINH } from './thoi-gian';
import { DKNH_SORTABLE_DB_COLUMNS } from '../services/dang-ky-nhan-hang-list-query';

const DUONG_DAN = '/quan-ly-nha-so-che/dang-ky-nhan-hang/in-danh-sach';
const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Bộ lọc danh sách mang sang trang in (cùng nghĩa với DangKyNhanHangListServerQuery). */
export interface LocInDanhSach {
  /** YYYY-MM-DD, rỗng = không giới hạn */
  tu: string;
  den: string;
  q: string;
  trangThai: TrangThaiDkNh[];
  idChiNhanh: string[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export function taoUrlInDanhSach(loc: LocInDanhSach): string {
  const sp = new URLSearchParams();
  if (loc.tu) sp.set('tu', loc.tu);
  if (loc.den) sp.set('den', loc.den);
  if (loc.q.trim()) sp.set('q', loc.q.trim());
  if (loc.trangThai.length) sp.set('tt', loc.trangThai.join(','));
  if (loc.idChiNhanh.length) sp.set('cn', loc.idChiNhanh.join(','));
  if (loc.sortColumn && loc.sortDirection) {
    sp.set('sort', loc.sortColumn);
    sp.set('dir', loc.sortDirection);
  }
  const qs = sp.toString();
  return qs ? `${DUONG_DAN}?${qs}` : DUONG_DAN;
}

const ngayHopLe = (v: string | null) => (v && YMD.test(v) && !Number.isNaN(Date.parse(v)) ? v : '');
const dsTach = (v: string | null) =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/** Đọc lại bộ lọc từ URL; giá trị lạ (ngày sai, trạng thái / cột sort không có) bị bỏ qua. */
export function docThamSoInDanhSach(sp: URLSearchParams): LocInDanhSach {
  const sort = sp.get('sort');
  const dir = sp.get('dir');
  const sortHopLe = sort != null && DKNH_SORTABLE_DB_COLUMNS.has(sort) && (dir === 'asc' || dir === 'desc');
  return {
    tu: ngayHopLe(sp.get('tu')),
    den: ngayHopLe(sp.get('den')),
    q: (sp.get('q') ?? '').trim(),
    trangThai: dsTach(sp.get('tt')).filter((s): s is TrangThaiDkNh =>
      (TRANG_THAI_DKNH as readonly string[]).includes(s)
    ),
    idChiNhanh: dsTach(sp.get('cn')).filter((s) => /^\d+$/.test(s)),
    sortColumn: sortHopLe ? sort : null,
    sortDirection: sortHopLe ? dir : null,
  };
}

export const ngayVn = (ymd: string) => ymd.split('-').reverse().join('/');

/** Khoá tiêu đề (trong `dangKyNhanHang.inDanhSach.tieuDe.*`) + biến theo khoảng ngày đang lọc. */
export function tieuDeDanhSach(tu: string, den: string): { key: string; vars: Record<string, string> } {
  if (tu && den && tu === den) return { key: 'ngay', vars: { ngay: ngayVn(tu) } };
  if (tu && den) return { key: 'khoang', vars: { tu: ngayVn(tu), den: ngayVn(den) } };
  if (tu) return { key: 'tu', vars: { tu: ngayVn(tu) } };
  if (den) return { key: 'den', vars: { den: ngayVn(den) } };
  return { key: 'tatCa', vars: {} };
}

export function tenFileDanhSach(tu: string, den: string): string {
  const d = (ymd: string) => ngayVn(ymd).replace(/\//g, '-');
  if (tu && den && tu === den) return `danh-sach-xe-${d(tu)}`;
  if (tu || den) return `danh-sach-xe-${tu ? d(tu) : ''}_${den ? d(den) : ''}`;
  return 'danh-sach-xe';
}

export interface DongDanhSachIn {
  id: string;
  stt: number;
  /** dd/mm/yyyy */
  ngay: string;
  soXe: string;
  taiXe: string;
  trangThai: string;
  kho: string;
  /** Khung giờ đăng ký "HH:mm – HH:mm" */
  tgDuKien: string;
  /** Giờ vào – ra thực tế; mốc khác ngày đăng ký thì kèm "DD/MM" */
  tgThucTe: string;
  thongTin: string;
  khachHang: string;
  soLuong: number | null;
  loaiHang: string;
}

/** "07:00 – 09:00"; thiếu một đầu thì "…"; không có giờ nào → rỗng. */
export function khoangGio(tu: string | null | undefined, den: string | null | undefined): string {
  if (!tu && !den) return '';
  return `${tu || '…'} – ${den || '…'}`;
}

/** Giờ thực tế `HH:mm` theo `tz`; khác ngày đăng ký thì thêm ` DD/MM`. */
function gioThucTe(iso: string | null, ngay: string, tz: string): string | null {
  if (!iso) return null;
  const d = dayjs(iso).tz(tz);
  if (!d.isValid()) return null;
  return d.format('YYYY-MM-DD') === ngay ? d.format('HH:mm') : d.format('HH:mm DD/MM');
}

/** Giữ nguyên thứ tự server (theo sort của danh sách), chỉ đánh STT và map cột. */
export function taoDongDanhSachIn(
  phieu: DangKyNhanHang[],
  nhanTrangThai: (tt: TrangThaiDkNh) => string,
  tz: string = TZ_MAC_DINH
): DongDanhSachIn[] {
  return phieu.map((p, i) => ({
    id: p.id,
    stt: i + 1,
    ngay: ngayVn(p.ngay_dang_ky),
    soXe: p.so_xe || p.so_cont || '',
    taiXe: p.ten_tai_xe ?? '',
    trangThai: nhanTrangThai(p.trang_thai),
    kho: p.ten_chi_nhanh ?? '',
    tgDuKien: khoangGio(chuanHoaGio(p.gio_dang_ky_tu), chuanHoaGio(p.gio_dang_ky_den)),
    tgThucTe: khoangGio(gioThucTe(p.tg_vao_thuc_te, p.ngay_dang_ky, tz), gioThucTe(p.tg_ra_thuc_te, p.ngay_dang_ky, tz)),
    thongTin: p.ghi_chu ?? '',
    khachHang: p.khach_hang ?? '',
    soLuong: p.so_luong_dang_ky,
    loaiHang: p.loai_hang_hoa ?? '',
  }));
}

export type CotDanhSachIn = Exclude<keyof DongDanhSachIn, 'id'>;

/** Cột in theo thứ tự; danh sách trải nhiều ngày thì thêm cột Ngày sau STT. */
export function cotDanhSachIn(dong: DongDanhSachIn[]): CotDanhSachIn[] {
  const nhieuNgay = new Set(dong.map((d) => d.ngay)).size > 1;
  return [
    'stt',
    ...(nhieuNgay ? (['ngay'] as const) : []),
    'soXe',
    'taiXe',
    'trangThai',
    'kho',
    'tgDuKien',
    'tgThucTe',
    'thongTin',
    'khachHang',
    'soLuong',
    'loaiHang',
  ];
}

/**
 * Dòng sheet XLSX: tiêu đề, "Số lượng xe: N", dòng trống, header, dữ liệu.
 * `nhan(key)` trả nhãn theo key trong `dangKyNhanHang.inDanhSach.*` (truyền `t` của i18n).
 */
export function taoAoaDanhSachXlsx(
  tieuDe: string,
  dong: DongDanhSachIn[],
  nhan: (key: string, vars?: Record<string, unknown>) => string
): (string | number)[][] {
  const cot = cotDanhSachIn(dong);
  return [
    [tieuDe],
    [nhan('soLuongXe', { n: dong.length })],
    [],
    cot.map((c) => nhan(`col.${c}`)),
    ...dong.map((d) => cot.map((c) => d[c] ?? '')),
  ];
}
