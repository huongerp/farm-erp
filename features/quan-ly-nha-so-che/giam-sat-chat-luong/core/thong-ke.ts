/**
 * Thống kê Giám sát chất lượng — tính thuần trên danh sách phiếu trong khoảng ngày.
 * Phiếu huỷ chỉ được đếm riêng (`kpi.huy`), không tham gia bất kỳ chỉ tiêu nào khác.
 */
import type { GiamSatChatLuong } from './types';

const KHONG_RO = '—';

/** Trạng thái "đã xong" — phiếu đã qua khâu kiểm, đang chờ nộp / đã nộp / đã xuất. */
const TRANG_THAI_DA_XONG = new Set(['hoan_thanh', 'da_nop', 'da_xuat']);

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Tỉ lệ đạt (%) trên các phiếu đã có kết luận; chưa phiếu nào có kết luận → null. */
function tiLeDat(dat: number, khongDat: number): number | null {
  const mau = dat + khongDat;
  if (mau === 0) return null;
  return round1((dat / mau) * 100);
}

export interface ThongKeKpiGscl {
  /** Tổng phiếu (không tính phiếu huỷ). */
  tong: number;
  /** Số phiếu đã huỷ. */
  huy: number;
  /** Đang kiểm (chưa đủ thùng mẫu). */
  dangKiem: number;
  /** Đã xong: chờ nộp + đã nộp + đã xuất. */
  daXong: number;
  dat: number;
  khongDat: number;
  tiLeDat: number | null;
  /** Số ngày có phiếu (không tính ngày chỉ có phiếu huỷ). */
  soNgay: number;
  /** TB phiếu/ngày = tong / soNgay (1 chữ số thập phân; 0 khi không có phiếu). */
  tbPhieuNgay: number;
}

/** Một farm (chi nhánh) làm cột cho bảng ngày × farm, nhiều phiếu trước. */
export interface FarmThongKe {
  id: string;
  ten: string;
}

/** Nhóm theo farm / thành phẩm / người tạo — nhiều phiếu trước. */
export interface NhomThongKe {
  key: string;
  ten: string;
  tong: number;
  dat: number;
  khongDat: number;
  tiLeDat: number | null;
  soNgay: number;
  tbPhieuNgay: number;
}

/** Một ngày trong bảng ngày × farm, kèm tổng từng farm. */
export interface TheoNgayThongKe {
  ngay: string;
  tong: number;
  dat: number;
  khongDat: number;
  theoFarm: Record<string, { tong: number; dat: number; khongDat: number }>;
}

export interface ThongKeGscl {
  kpi: ThongKeKpiGscl;
  farms: FarmThongKe[];
  /** Ngày mới nhất lên đầu; farm không có phiếu ngày đó thì không có key. */
  theoNgay: TheoNgayThongKe[];
  theoFarm: NhomThongKe[];
  theoThanhPham: NhomThongKe[];
  theoNguoiTao: NhomThongKe[];
}

interface NhomAcc {
  key: string;
  ten: string;
  tong: number;
  dat: number;
  khongDat: number;
  ngay: Set<string>;
}

function nhomTheo(
  rows: GiamSatChatLuong[],
  keyOf: (p: GiamSatChatLuong) => string | null,
  tenOf: (p: GiamSatChatLuong) => string | null
): NhomThongKe[] {
  const map = new Map<string, NhomAcc>();
  for (const p of rows) {
    const key = (keyOf(p) ?? '').trim() || KHONG_RO;
    let cur = map.get(key);
    if (!cur) {
      cur = { key, ten: (tenOf(p) ?? '').trim() || KHONG_RO, tong: 0, dat: 0, khongDat: 0, ngay: new Set() };
      map.set(key, cur);
    }
    cur.tong += 1;
    if (p.ket_luan === 'dat') cur.dat += 1;
    else if (p.ket_luan === 'khong_dat') cur.khongDat += 1;
    cur.ngay.add(p.ngay);
  }
  return [...map.values()]
    .map((c) => ({
      key: c.key,
      ten: c.ten,
      tong: c.tong,
      dat: c.dat,
      khongDat: c.khongDat,
      tiLeDat: tiLeDat(c.dat, c.khongDat),
      soNgay: c.ngay.size,
      tbPhieuNgay: round1(c.tong / c.ngay.size),
    }))
    .sort((a, b) => b.tong - a.tong || a.key.localeCompare(b.key));
}

export function tinhThongKeGscl(phieu: GiamSatChatLuong[]): ThongKeGscl {
  const hopLe = phieu.filter((p) => p.trang_thai !== 'huy');

  const dat = hopLe.filter((p) => p.ket_luan === 'dat').length;
  const khongDat = hopLe.filter((p) => p.ket_luan === 'khong_dat').length;
  const soNgay = new Set(hopLe.map((p) => p.ngay)).size;

  const kpi: ThongKeKpiGscl = {
    tong: hopLe.length,
    huy: phieu.length - hopLe.length,
    dangKiem: hopLe.filter((p) => p.trang_thai === 'dang_kiem').length,
    daXong: hopLe.filter((p) => TRANG_THAI_DA_XONG.has(p.trang_thai)).length,
    dat,
    khongDat,
    tiLeDat: tiLeDat(dat, khongDat),
    soNgay,
    tbPhieuNgay: soNgay === 0 ? 0 : round1(hopLe.length / soNgay),
  };

  // Cột farm, nhiều phiếu trước.
  const farmMap = new Map<string, { id: string; ten: string; n: number }>();
  for (const p of hopLe) {
    const cur = farmMap.get(p.id_chi_nhanh) ?? { id: p.id_chi_nhanh, ten: (p.ten_chi_nhanh ?? '').trim() || KHONG_RO, n: 0 };
    cur.n += 1;
    farmMap.set(p.id_chi_nhanh, cur);
  }
  const farms: FarmThongKe[] = [...farmMap.values()]
    .sort((a, b) => b.n - a.n || a.id.localeCompare(b.id))
    .map(({ id, ten }) => ({ id, ten }));

  // Bảng ngày × farm.
  const ngayMap = new Map<string, TheoNgayThongKe>();
  for (const p of hopLe) {
    let cur = ngayMap.get(p.ngay);
    if (!cur) {
      cur = { ngay: p.ngay, tong: 0, dat: 0, khongDat: 0, theoFarm: {} };
      ngayMap.set(p.ngay, cur);
    }
    cur.tong += 1;
    if (p.ket_luan === 'dat') cur.dat += 1;
    else if (p.ket_luan === 'khong_dat') cur.khongDat += 1;
    const f = cur.theoFarm[p.id_chi_nhanh] ?? { tong: 0, dat: 0, khongDat: 0 };
    f.tong += 1;
    if (p.ket_luan === 'dat') f.dat += 1;
    else if (p.ket_luan === 'khong_dat') f.khongDat += 1;
    cur.theoFarm[p.id_chi_nhanh] = f;
  }
  const theoNgay = [...ngayMap.values()].sort((a, b) => b.ngay.localeCompare(a.ngay));

  return {
    kpi,
    farms,
    theoNgay,
    theoFarm: nhomTheo(hopLe, (p) => p.id_chi_nhanh, (p) => p.ten_chi_nhanh),
    theoThanhPham: nhomTheo(hopLe, (p) => p.id_hang_hoa, (p) => p.ten_hang_hoa),
    theoNguoiTao: nhomTheo(hopLe, (p) => p.id_nguoi_tao, (p) => p.ten_nguoi_tao),
  };
}
