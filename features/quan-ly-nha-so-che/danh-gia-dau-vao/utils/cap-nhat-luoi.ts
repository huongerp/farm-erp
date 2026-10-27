/**
 * Cập nhật phiếu trong cache sau khi tự lưu một ô lưới — thuần, không đổi object gốc.
 * Lưới (tổng lô / tổ trưởng / ngày) dựng lại từ phiếu nên số tự cộng ngay, không chờ tải lại.
 */
import type { DgdvPhieuDayDu, FarmDgdvDong, FarmDgdvLoNgay } from '../core/types';

/** Giá trị nhập của một ô (dây × lô × ngày × dòng). */
export interface DgdvGiaTriO {
  so_luong: number;
  danh_gia: string | null;
  so_luong_loi: number;
  ly_do_loi: string | null;
}

export interface DgdvKhoaO {
  id_phieu_lo: string;
  id_cot: string;
  ngay: string;
  stt_dong: number;
}

/** Khoá ô cảnh báo «SL lỗi > số lượng» — ghép từ kết quả `kiemTraSoLuongLoi`. */
export const khoaCanhBao = (idPhieuLo: string, idCot: string, ngay: string, sttDong: number) =>
  `${idPhieuLo}|${idCot}|${ngay}|${sttDong}`;

/** Ô trống hết (số = 0, chữ rỗng) → xoá dòng DB thay vì lưu toàn số 0. */
export function laORong(o: DgdvGiaTriO): boolean {
  return o.so_luong === 0 && o.so_luong_loi === 0 && !o.danh_gia?.trim() && !o.ly_do_loi?.trim();
}

/** Ô số nhập tay → số nguyên ≥ 0 ('' / chữ / âm → 0). */
export function soNguyenKhongAm(s: string): number {
  const n = Math.floor(Number(String(s).replace(/[^\d]/g, '')));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const cungO = (d: FarmDgdvDong, k: DgdvKhoaO) =>
  d.id_cot === k.id_cot && d.ngay === k.ngay && d.stt_dong === k.stt_dong;

function suaLo(
  phieu: DgdvPhieuDayDu,
  idPhieuLo: string,
  fn: (lo: DgdvPhieuDayDu['lo'][number]) => DgdvPhieuDayDu['lo'][number]
): DgdvPhieuDayDu {
  if (!phieu.lo.some((l) => l.id === idPhieuLo)) return phieu;
  return { ...phieu, lo: phieu.lo.map((l) => (l.id === idPhieuLo ? fn(l) : l)) };
}

/** Ghi đè / thêm một ô đã lưu (`dong` = null → xoá ô theo khoá). Phiếu không chứa lô → trả nguyên. */
export function apOVaoPhieu(phieu: DgdvPhieuDayDu, khoa: DgdvKhoaO, dong: FarmDgdvDong | null): DgdvPhieuDayDu {
  return suaLo(phieu, khoa.id_phieu_lo, (lo) => {
    const conLai = lo.dong.filter((d) => !cungO(d, khoa));
    return { ...lo, dong: dong ? [...conLai, dong] : conLai };
  });
}

/** Ghi đè đứt dây của lô × ngày (`row` = null → xoá). */
export function apDutDayVaoPhieu(
  phieu: DgdvPhieuDayDu,
  idPhieuLo: string,
  ngay: string,
  row: FarmDgdvLoNgay | null
): DgdvPhieuDayDu {
  return suaLo(phieu, idPhieuLo, (lo) => {
    const conLai = lo.lo_ngay.filter((n) => n.ngay !== ngay);
    return { ...lo, lo_ngay: row ? [...conLai, row] : conLai };
  });
}

export function apGhiChuLoVaoPhieu(phieu: DgdvPhieuDayDu, idPhieuLo: string, ghiChu: string | null): DgdvPhieuDayDu {
  return suaLo(phieu, idPhieuLo, (lo) => ({ ...lo, ghi_chu: ghiChu?.trim() || null }));
}

/** Áp `fn` lên dữ liệu cache: một phiếu, mảng phiếu, hoặc giá trị khác (bỏ qua). */
export function apVaoDuLieuCache(data: unknown, fn: (p: DgdvPhieuDayDu) => DgdvPhieuDayDu): unknown {
  const laPhieu = (x: unknown): x is DgdvPhieuDayDu =>
    !!x && typeof x === 'object' && Array.isArray((x as DgdvPhieuDayDu).lo) && Array.isArray((x as DgdvPhieuDayDu).cot);
  if (Array.isArray(data)) return data.every(laPhieu) ? data.map(fn) : data;
  return laPhieu(data) ? fn(data) : data;
}
