/**
 * Thống kê đăng ký nhận hàng — tính thuần trên danh sách phiếu trong khoảng ngày
 * + tổng hàng hoá theo phiếu (view v_farm_dang_ky_nhan_hang_tong_hh).
 * Phiếu huỷ chỉ được đếm, không tham gia thời lượng / số lượng.
 */
import type { DangKyNhanHang, TongHangHoaPhieu } from './types';
import {
  NGUONG_TRE_PHUT,
  soPhutDangOTrongFarm,
  soPhutRaQuaGio,
  soPhutTrongFarm,
  soPhutVaoTre,
  TZ_MAC_DINH,
} from './thoi-gian';

export interface ThongKeKpi {
  tongPhieu: number;
  choVao: number;
  dangTrongFarm: number;
  daRa: number;
  huy: number;
  tongSoLuong: number;
  soPhieuCoHang: number;
  tbPhutTrongFarm: number | null;
  minPhutTrongFarm: number | null;
  maxPhutTrongFarm: number | null;
  soXeVaoTre: number;
  soXeRaQuaGio: number;
}

export interface ThongKeNhom {
  key: string;
  soXe: number;
  soLuong: number;
  tbPhut: number | null;
}

export interface ThongKeHangHoa {
  id_hang_hoa: string;
  ma_hang_hoa: string;
  ten_hang_hoa: string;
  dvt: string;
  soLuong: number;
  soXe: number;
}

export interface PhieuThoiGian {
  phieu: DangKyNhanHang;
  phutTrongFarm: number | null;
  phutVaoTre: number | null;
  phutRaQuaGio: number | null;
  soLuong: number;
}

export interface ThongKeDangKyNhanHang {
  kpi: ThongKeKpi;
  theoNgay: ThongKeNhom[];
  theoKhachHang: ThongKeNhom[];
  theoLoaiHang: ThongKeNhom[];
  theoChiNhanh: ThongKeNhom[];
  theoHangHoa: ThongKeHangHoa[];
  /** Xe đã ra, ở lâu nhất trước. */
  xeLauNhat: PhieuThoiGian[];
  /** Vào trễ hoặc ra quá giờ đăng ký (vượt ngưỡng). */
  xeTreHoacQuaGio: PhieuThoiGian[];
  /** Đang trong farm — `phutTrongFarm` tính tới `bayGio`. */
  xeChuaRa: PhieuThoiGian[];
}

const KHONG_RO = '—';

function trungBinh(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
}

function nhom(
  rows: PhieuThoiGian[],
  keyOf: (p: DangKyNhanHang) => string,
  sortByKey = false
): ThongKeNhom[] {
  const map = new Map<string, { soXe: number; soLuong: number; phut: number[] }>();
  for (const r of rows) {
    const k = keyOf(r.phieu).trim() || KHONG_RO;
    const cur = map.get(k) ?? { soXe: 0, soLuong: 0, phut: [] };
    cur.soXe += 1;
    cur.soLuong += r.soLuong;
    if (r.phutTrongFarm != null) cur.phut.push(r.phutTrongFarm);
    map.set(k, cur);
  }
  const out = [...map.entries()].map(([key, v]) => ({
    key,
    soXe: v.soXe,
    soLuong: v.soLuong,
    tbPhut: trungBinh(v.phut),
  }));
  return sortByKey
    ? out.sort((a, b) => a.key.localeCompare(b.key))
    : out.sort((a, b) => b.soXe - a.soXe || b.soLuong - a.soLuong || a.key.localeCompare(b.key));
}

export function tinhThongKeDangKyNhanHang(
  phieuList: DangKyNhanHang[],
  tongHangHoa: TongHangHoaPhieu[],
  opts: { bayGio?: number; tz?: string; topN?: number } = {}
): ThongKeDangKyNhanHang {
  const bayGio = opts.bayGio ?? Date.now();
  const tz = opts.tz ?? TZ_MAC_DINH;
  const topN = opts.topN ?? 10;

  const idsHopLe = new Set(phieuList.filter((p) => p.trang_thai !== 'huy').map((p) => p.id));
  const soLuongTheoPhieu = new Map<string, number>();
  const hangHoaMap = new Map<string, ThongKeHangHoa & { phieu: Set<string> }>();
  for (const t of tongHangHoa) {
    if (!idsHopLe.has(t.id_phieu)) continue;
    soLuongTheoPhieu.set(t.id_phieu, (soLuongTheoPhieu.get(t.id_phieu) ?? 0) + t.tong_so_luong);
    const cur = hangHoaMap.get(t.id_hang_hoa) ?? {
      id_hang_hoa: t.id_hang_hoa,
      ma_hang_hoa: t.ma_hang_hoa ?? KHONG_RO,
      ten_hang_hoa: t.ten_hang_hoa ?? KHONG_RO,
      dvt: t.dvt ?? '',
      soLuong: 0,
      soXe: 0,
      phieu: new Set<string>(),
    };
    cur.soLuong += t.tong_so_luong;
    cur.phieu.add(t.id_phieu);
    hangHoaMap.set(t.id_hang_hoa, cur);
  }

  const hopLe: PhieuThoiGian[] = phieuList
    .filter((p) => p.trang_thai !== 'huy')
    .map((p) => ({
      phieu: p,
      phutTrongFarm: soPhutTrongFarm(p.tg_vao_thuc_te, p.tg_ra_thuc_te),
      phutVaoTre: soPhutVaoTre(p.ngay_dang_ky, p.gio_dang_ky_tu, p.tg_vao_thuc_te, tz),
      phutRaQuaGio: soPhutRaQuaGio(p.ngay_dang_ky, p.gio_dang_ky_tu, p.gio_dang_ky_den, p.tg_ra_thuc_te, tz),
      soLuong: soLuongTheoPhieu.get(p.id) ?? 0,
    }));

  const phutDaRa = hopLe.map((r) => r.phutTrongFarm).filter((x): x is number => x != null);
  const laTre = (r: PhieuThoiGian) => (r.phutVaoTre ?? 0) > NGUONG_TRE_PHUT;
  const laQuaGio = (r: PhieuThoiGian) => (r.phutRaQuaGio ?? 0) > NGUONG_TRE_PHUT;

  const kpi: ThongKeKpi = {
    tongPhieu: phieuList.length,
    choVao: phieuList.filter((p) => p.trang_thai === 'cho_vao').length,
    dangTrongFarm: phieuList.filter((p) => p.trang_thai === 'da_vao').length,
    daRa: phieuList.filter((p) => p.trang_thai === 'da_ra').length,
    huy: phieuList.filter((p) => p.trang_thai === 'huy').length,
    tongSoLuong: hopLe.reduce((s, r) => s + r.soLuong, 0),
    soPhieuCoHang: hopLe.filter((r) => r.soLuong > 0).length,
    tbPhutTrongFarm: trungBinh(phutDaRa),
    minPhutTrongFarm: phutDaRa.length ? Math.min(...phutDaRa) : null,
    maxPhutTrongFarm: phutDaRa.length ? Math.max(...phutDaRa) : null,
    soXeVaoTre: hopLe.filter(laTre).length,
    soXeRaQuaGio: hopLe.filter(laQuaGio).length,
  };

  return {
    kpi,
    theoNgay: nhom(hopLe, (p) => p.ngay_dang_ky, true),
    theoKhachHang: nhom(hopLe, (p) => p.khach_hang ?? ''),
    theoLoaiHang: nhom(hopLe, (p) => p.loai_hang_hoa ?? ''),
    theoChiNhanh: nhom(hopLe, (p) => p.ten_chi_nhanh ?? ''),
    theoHangHoa: [...hangHoaMap.values()]
      .map(({ phieu, ...h }) => ({ ...h, soXe: phieu.size }))
      .sort((a, b) => b.soLuong - a.soLuong || a.ma_hang_hoa.localeCompare(b.ma_hang_hoa)),
    xeLauNhat: hopLe
      .filter((r) => r.phutTrongFarm != null)
      .sort((a, b) => (b.phutTrongFarm ?? 0) - (a.phutTrongFarm ?? 0))
      .slice(0, topN),
    xeTreHoacQuaGio: hopLe
      .filter((r) => laTre(r) || laQuaGio(r))
      .sort((a, b) => Math.max(b.phutVaoTre ?? 0, b.phutRaQuaGio ?? 0) - Math.max(a.phutVaoTre ?? 0, a.phutRaQuaGio ?? 0)),
    xeChuaRa: hopLe
      .filter((r) => r.phieu.trang_thai === 'da_vao')
      .map((r) => ({ ...r, phutTrongFarm: soPhutDangOTrongFarm(r.phieu.tg_vao_thuc_te, bayGio) }))
      .sort((a, b) => (b.phutTrongFarm ?? 0) - (a.phutTrongFarm ?? 0)),
  };
}
