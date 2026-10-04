/**
 * Kết luận ĐẠT / KHÔNG ĐẠT cho một cây hàng từ các thùng mẫu đã kiểm.
 *
 * Ngưỡng tính trên TỔNG các thùng mẫu (người dùng chốt: 1 cây ~60 thùng, kiểm 10 thùng,
 * ngưỡng đặt cho 10 thùng). Khi số thùng mẫu khác 10, ngưỡng `dem_loi` quy đổi theo tỉ lệ
 * N/10 — vd ngưỡng 5 trái trầy cho 10 thùng → 2,5 cho 5 thùng.
 *
 * - `dem_loi`  : tổng số trái lỗi ≤ ngưỡng_max (quy đổi). Ô trống tính 0.
 * - `do_luong` : trung bình các thùng có nhập nằm trong [min, max] (không quy đổi).
 * - `dat_khong`: số thùng chọn "Không" ≤ ngưỡng_max (trống = 0). Ô trống không tính "Không".
 *
 * Tiêu chí không có ngưỡng (dem_loi / do_luong để trống cả hai) → `dat = null`, không ảnh
 * hưởng kết luận. Cây hàng KHÔNG ĐẠT khi có ít nhất một tiêu chí `dat === false`.
 */
import type { KetLuanGscl, KetQuaThung, TieuChi } from './types';

/** Ngưỡng `dem_loi` được nhập cho số thùng mẫu chuẩn này. */
export const SO_THUNG_CHUAN = 10;

export interface KetQuaTieuChi {
  ma: string;
  /** Tổng (dem_loi, do_luong) — null khi chưa thùng nào nhập. */
  tong: number | null;
  /** Trung bình trên các thùng có nhập — null khi chưa thùng nào nhập. */
  trungBinh: number | null;
  /** Số thùng có nhập giá trị cho tiêu chí này. */
  soThungCoGiaTri: number;
  /** dat_khong: số thùng chọn "Không". */
  soKhong: number;
  /** Ngưỡng đã quy đổi theo số thùng mẫu (để hiển thị cạnh tổng). */
  nguongMin: number | null;
  nguongMax: number | null;
  /** true / false theo ngưỡng; null = không xét (không có ngưỡng hoặc chưa có số). */
  dat: boolean | null;
}

const laSo = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Làm tròn 4 chữ số — tránh 0.1 + 0.2 làm lệch phép so ngưỡng. */
const tron = (n: number) => Math.round(n * 10000) / 10000;

export function quyDoiNguong(nguong: number | null, soThungMau: number): number | null {
  if (nguong == null) return null;
  const n = soThungMau > 0 ? soThungMau : SO_THUNG_CHUAN;
  return tron((nguong * n) / SO_THUNG_CHUAN);
}

export function tinhTieuChi(tc: TieuChi, thungs: KetQuaThung[], soThungMau: number): KetQuaTieuChi {
  const giaTri = thungs.map((k) => k[tc.ma]);

  if (tc.loai === 'dat_khong') {
    const coGiaTri = giaTri.filter((v) => typeof v === 'boolean');
    const soKhong = coGiaTri.filter((v) => v === false).length;
    const max = tc.nguong_max ?? 0;
    return {
      ma: tc.ma,
      tong: null,
      trungBinh: null,
      soThungCoGiaTri: coGiaTri.length,
      soKhong,
      nguongMin: null,
      nguongMax: max,
      dat: coGiaTri.length === 0 ? null : soKhong <= max,
    };
  }

  const so = giaTri.filter(laSo);
  const tong = so.length ? tron(so.reduce((a, b) => a + b, 0)) : null;
  const trungBinh = tong != null ? tron(tong / so.length) : null;

  if (tc.loai === 'dem_loi') {
    const max = quyDoiNguong(tc.nguong_max, soThungMau);
    // Ô trống = 0 trái lỗi: thùng đã kiểm mà không nhập lỗi vẫn là thùng sạch.
    const tongTinh = tong ?? (thungs.length > 0 ? 0 : null);
    return {
      ma: tc.ma,
      tong: tongTinh,
      trungBinh: tongTinh != null && thungs.length > 0 ? tron(tongTinh / thungs.length) : null,
      soThungCoGiaTri: so.length,
      soKhong: 0,
      nguongMin: null,
      nguongMax: max,
      dat: max == null || tongTinh == null ? null : tongTinh <= max,
    };
  }

  // do_luong
  const { nguong_min: min, nguong_max: max } = tc;
  const coNguong = min != null || max != null;
  return {
    ma: tc.ma,
    tong,
    trungBinh,
    soThungCoGiaTri: so.length,
    soKhong: 0,
    nguongMin: min,
    nguongMax: max,
    dat: !coNguong || trungBinh == null ? null : (min == null || trungBinh >= min) && (max == null || trungBinh <= max),
  };
}

export interface KetLuanPhieu {
  chiTiet: KetQuaTieuChi[];
  /** null khi chưa thùng nào kiểm. */
  ketLuan: KetLuanGscl | null;
}

/** `thungs` = ket_qua của các thùng ĐÃ kiểm. */
export function ketLuanPhieu(tieuChi: TieuChi[], thungs: KetQuaThung[], soThungMau: number): KetLuanPhieu {
  const chiTiet = tieuChi.map((tc) => tinhTieuChi(tc, thungs, soThungMau));
  if (thungs.length === 0) return { chiTiet, ketLuan: null };
  return { chiTiet, ketLuan: chiTiet.some((c) => c.dat === false) ? 'khong_dat' : 'dat' };
}
