/**
 * Bảng «Chi tiết đánh giá» của phiếu: mọi ô lưới (`fp_farm_dgdv_dong`) + đứt dây (`fp_farm_dgdv_lo_ngay`)
 * trải thành danh sách dòng phẳng, và kế hoạch ghi khi thêm / sửa / xoá một dòng; tổng theo lô (bảng «Theo lô»)
 * và kế hoạch lưu cả lô một lần («Nhập theo lô»). Thuần — test trực tiếp.
 *
 * Đứt dây ở DB chỉ có MỘT số / lô × ngày → mỗi (lô, ngày) là một dòng «Đứt dây»; thêm dòng đứt dây
 * trùng lô + ngày đã có thì cộng dồn vào số cũ.
 */
import type { DgdvPhieuDayDu } from './types';

export type LoaiDongDgdv = 'day' | 'dut_day';

export interface DgdvDongPhang {
  /** Khoá duy nhất trong phiếu: `d:<id dòng>` hoặc `n:<id đứt dây>`. */
  key: string;
  loai: LoaiDongDgdv;
  id_phieu_lo: string;
  ten_lo: string | null;
  to_truong: string | null;
  ngay: string;
  /** null khi là đứt dây. */
  id_cot: string | null;
  stt_dong: number;
  so_luong: number;
  danh_gia: string | null;
  so_luong_huy: number;
  ly_do_huy: string | null;
}

/** Giá trị nhập của dialog dòng. `id_cot` = null nghĩa là «Đứt dây». */
export interface DgdvDongInput {
  id_phieu_lo: string;
  ngay: string;
  id_cot: string | null;
  so_luong: number;
  danh_gia: string | null;
  so_luong_huy: number;
  ly_do_huy: string | null;
}

export interface DgdvKhoaDong {
  id_phieu_lo: string;
  id_cot: string;
  ngay: string;
  stt_dong: number;
}

export type DgdvThaoTacGhi =
  | { op: 'xoaDong'; khoa: DgdvKhoaDong }
  | {
      op: 'ghiDong';
      khoa: DgdvKhoaDong;
      gt: { so_luong: number; danh_gia: string | null; so_luong_huy: number; ly_do_huy: string | null };
    }
  /** dutDay = 0 → xoá. */
  | { op: 'ghiDutDay'; id_phieu_lo: string; ngay: string; dutDay: number };

/** Mọi dòng của phiếu, xếp ngày → lô (stt) → cột dây (stt) → dòng; đứt dây đứng cuối các dây của lô. */
export function dongPhangCuaPhieu(phieu: Pick<DgdvPhieuDayDu, 'lo' | 'cot'>): DgdvDongPhang[] {
  const sttCot = new Map(phieu.cot.map((c) => [c.id, c.stt]));
  const sttLo = new Map(phieu.lo.map((l) => [l.id, l.stt]));
  const ds: DgdvDongPhang[] = [];
  for (const lo of phieu.lo) {
    const chung = { id_phieu_lo: lo.id, ten_lo: lo.ten_lo, to_truong: lo.to_truong };
    for (const d of lo.dong) {
      ds.push({
        ...chung,
        key: `d:${d.id}`,
        loai: 'day',
        ngay: d.ngay,
        id_cot: d.id_cot,
        stt_dong: d.stt_dong,
        so_luong: d.so_luong,
        danh_gia: d.danh_gia,
        so_luong_huy: d.so_luong_huy,
        ly_do_huy: d.ly_do_huy,
      });
    }
    for (const n of lo.lo_ngay) {
      if (n.dut_day <= 0) continue;
      ds.push({
        ...chung,
        key: `n:${n.id}`,
        loai: 'dut_day',
        ngay: n.ngay,
        id_cot: null,
        stt_dong: 0,
        so_luong: n.dut_day,
        danh_gia: null,
        so_luong_huy: 0,
        ly_do_huy: null,
      });
    }
  }
  const thuTuCot = (r: DgdvDongPhang) => (r.id_cot == null ? Number.MAX_SAFE_INTEGER : (sttCot.get(r.id_cot) ?? 0));
  return ds.sort(
    (a, b) =>
      a.ngay.localeCompare(b.ngay) ||
      (sttLo.get(a.id_phieu_lo) ?? 0) - (sttLo.get(b.id_phieu_lo) ?? 0) ||
      a.id_phieu_lo.localeCompare(b.id_phieu_lo) ||
      thuTuCot(a) - thuTuCot(b) ||
      a.stt_dong - b.stt_dong
  );
}

/** stt_dong kế tiếp cho (lô, dây, ngày) — lớn nhất đang có + 1. */
export function sttDongKeTiep(phieu: Pick<DgdvPhieuDayDu, 'lo'>, idPhieuLo: string, idCot: string, ngay: string): number {
  const lo = phieu.lo.find((l) => l.id === idPhieuLo);
  const max = Math.max(0, ...(lo?.dong ?? []).filter((d) => d.id_cot === idCot && d.ngay === ngay).map((d) => d.stt_dong));
  return max + 1;
}

function dutDayHienCo(phieu: Pick<DgdvPhieuDayDu, 'lo'>, idPhieuLo: string, ngay: string): number {
  const lo = phieu.lo.find((l) => l.id === idPhieuLo);
  return lo?.lo_ngay.find((n) => n.ngay === ngay)?.dut_day ?? 0;
}

const chuHoacNull = (s: string | null | undefined) => (s ?? '').trim() || null;

/**
 * Các bước ghi để chuyển dòng `cu` (null = thêm mới) thành `moi`.
 * - Dây giữ nguyên (lô, dây, ngày) → ghi đè đúng dòng đó; đổi khoá → xoá dòng cũ, ghi dòng mới ở stt kế tiếp.
 * - Đứt dây: sửa cùng lô + ngày → đặt số mới; thêm mới / chuyển sang lô-ngày khác → cộng dồn vào số đang có.
 */
export function keHoachLuuDong(
  phieu: Pick<DgdvPhieuDayDu, 'lo'>,
  cu: DgdvDongPhang | null,
  moi: DgdvDongInput
): DgdvThaoTacGhi[] {
  const ops: DgdvThaoTacGhi[] = [];

  if (moi.id_cot == null) {
    const cungCho = cu?.loai === 'dut_day' && cu.id_phieu_lo === moi.id_phieu_lo && cu.ngay === moi.ngay;
    if (cu && !cungCho) ops.push(...keHoachXoaDong(cu));
    const nen = cungCho ? 0 : dutDayHienCo(phieu, moi.id_phieu_lo, moi.ngay);
    ops.push({ op: 'ghiDutDay', id_phieu_lo: moi.id_phieu_lo, ngay: moi.ngay, dutDay: nen + moi.so_luong });
    return ops;
  }

  const gt = {
    so_luong: moi.so_luong,
    danh_gia: chuHoacNull(moi.danh_gia),
    so_luong_huy: moi.so_luong_huy,
    ly_do_huy: chuHoacNull(moi.ly_do_huy),
  };
  if (cu?.loai === 'day' && cu.id_cot === moi.id_cot && cu.id_phieu_lo === moi.id_phieu_lo && cu.ngay === moi.ngay) {
    ops.push({ op: 'ghiDong', khoa: { id_phieu_lo: cu.id_phieu_lo, id_cot: cu.id_cot, ngay: cu.ngay, stt_dong: cu.stt_dong }, gt });
    return ops;
  }
  if (cu) ops.push(...keHoachXoaDong(cu));
  ops.push({
    op: 'ghiDong',
    khoa: {
      id_phieu_lo: moi.id_phieu_lo,
      id_cot: moi.id_cot,
      ngay: moi.ngay,
      stt_dong: sttDongKeTiep(phieu, moi.id_phieu_lo, moi.id_cot, moi.ngay),
    },
    gt,
  });
  return ops;
}

export function keHoachXoaDong(cu: DgdvDongPhang): DgdvThaoTacGhi[] {
  if (cu.loai === 'dut_day' || cu.id_cot == null) {
    return [{ op: 'ghiDutDay', id_phieu_lo: cu.id_phieu_lo, ngay: cu.ngay, dutDay: 0 }];
  }
  return [{ op: 'xoaDong', khoa: { id_phieu_lo: cu.id_phieu_lo, id_cot: cu.id_cot, ngay: cu.ngay, stt_dong: cu.stt_dong } }];
}

// ---- Theo lô (bảng con «Theo lô» trong Detail phiếu) ---------------------------------------

export interface DgdvTongLoPhieu {
  id_phieu_lo: string;
  ten_lo: string | null;
  to_truong: string | null;
  /** Σ so_luong các dây */
  soLuong: number;
  dutDay: number;
  /** soLuong + dutDay = tổng thu của lô */
  slBuong: number;
  /** Σ so_luong_huy */
  ksc: number;
  /** số dòng dây đã nhập */
  soDong: number;
  /** có dòng SL lỗi > SL */
  coCanhBao: boolean;
}

/** Mỗi lô của phiếu một dòng tổng (xếp theo stt, cùng stt theo id) — cộng như `tongLo` của core/bang-tinh. */
export function tongTheoLo(phieu: Pick<DgdvPhieuDayDu, 'lo'>): DgdvTongLoPhieu[] {
  return [...phieu.lo]
    .sort((a, b) => a.stt - b.stt || a.id.localeCompare(b.id))
    .map((lo) => {
      const soLuong = lo.dong.reduce((s, d) => s + d.so_luong, 0);
      const dutDay = lo.lo_ngay.reduce((s, n) => s + n.dut_day, 0);
      return {
        id_phieu_lo: lo.id,
        ten_lo: lo.ten_lo,
        to_truong: lo.to_truong,
        soLuong,
        dutDay,
        slBuong: soLuong + dutDay,
        ksc: lo.dong.reduce((s, d) => s + d.so_luong_huy, 0),
        soDong: lo.dong.length,
        coCanhBao: lo.dong.some((d) => d.so_luong_huy > d.so_luong),
      };
    });
}

/** Dòng tổng cuối bảng «Theo lô». */
export function congTongLo(ds: readonly DgdvTongLoPhieu[]): Pick<DgdvTongLoPhieu, 'soLuong' | 'dutDay' | 'slBuong' | 'ksc' | 'soDong'> {
  return ds.reduce(
    (s, r) => ({
      soLuong: s.soLuong + r.soLuong,
      dutDay: s.dutDay + r.dutDay,
      slBuong: s.slBuong + r.slBuong,
      ksc: s.ksc + r.ksc,
      soDong: s.soDong + r.soDong,
    }),
    { soLuong: 0, dutDay: 0, slBuong: 0, ksc: 0, soDong: 0 }
  );
}

// ---- Nhập nhanh theo lô ---------------------------------------------------------------

/** Một hàng của bảng «Nhập theo lô»: một dòng dây (đã lưu hoặc mới) hoặc hàng «Đứt dây». */
export interface DgdvHangNhapLo {
  /** khoá hàng trong bảng: `c:<id_cot>:<stt>` (đã lưu), `c:<id_cot>:m<n>` (mới), `dut` (đứt dây) */
  key: string;
  /** null = hàng đứt dây */
  id_cot: string | null;
  /** stt_dong đã lưu; null = hàng mới */
  stt_dong: number | null;
  so_luong: number;
  danh_gia: string | null;
  so_luong_huy: number;
  ly_do_huy: string | null;
}

export const KHOA_HANG_DUT_DAY = 'dut';

const hangTrong = (idCot: string | null, key: string): DgdvHangNhapLo => ({
  key,
  id_cot: idCot,
  stt_dong: null,
  so_luong: 0,
  danh_gia: null,
  so_luong_huy: 0,
  ly_do_huy: null,
});

/**
 * Hàng nhập của một lô trong ngày phiếu: mỗi dây (theo stt cột) → các dòng đã lưu (theo stt_dong), dây chưa
 * có số → một hàng trống; cuối cùng hàng «Đứt dây» (số đang có, 0 nếu chưa có).
 */
export function hangNhapCuaLo(phieu: Pick<DgdvPhieuDayDu, 'lo' | 'cot'>, idPhieuLo: string, ngay: string): DgdvHangNhapLo[] {
  const lo = phieu.lo.find((l) => l.id === idPhieuLo);
  const ds: DgdvHangNhapLo[] = [];
  const cots = [...phieu.cot].sort((a, b) => a.stt - b.stt || a.id.localeCompare(b.id));
  for (const c of cots) {
    const cua = (lo?.dong ?? []).filter((d) => d.id_cot === c.id && d.ngay === ngay).sort((a, b) => a.stt_dong - b.stt_dong);
    if (cua.length === 0) {
      ds.push(hangTrong(c.id, `c:${c.id}:m1`));
      continue;
    }
    for (const d of cua) {
      ds.push({
        key: `c:${c.id}:${d.stt_dong}`,
        id_cot: c.id,
        stt_dong: d.stt_dong,
        so_luong: d.so_luong,
        danh_gia: d.danh_gia,
        so_luong_huy: d.so_luong_huy,
        ly_do_huy: d.ly_do_huy,
      });
    }
  }
  ds.push({ ...hangTrong(null, KHOA_HANG_DUT_DAY), so_luong: lo ? dutDayHienCo(phieu, idPhieuLo, ngay) : 0 });
  return ds;
}

/** Thêm một hàng trống cho dây `idCot`, đặt ngay sau hàng cuối của dây đó (khoá không trùng). */
export function themHangChoDay(hang: readonly DgdvHangNhapLo[], idCot: string): DgdvHangNhapLo[] {
  let n = 1;
  while (hang.some((h) => h.key === `c:${idCot}:m${n}`)) n++;
  const moi = hangTrong(idCot, `c:${idCot}:m${n}`);
  const cuoi = hang.reduce((viTri, h, i) => (h.id_cot === idCot ? i : viTri), -1);
  const chen = cuoi < 0 ? hang.length : cuoi + 1;
  return [...hang.slice(0, chen), moi, ...hang.slice(chen)];
}

export type LoiHangNhap = 'thieuSoLuong' | 'slLoiLonHon';

/** Hàng có chữ / SL lỗi mà thiếu số lượng, hoặc SL lỗi > SL (dây) — chặn lưu cả lô. Hàng trống hết = hợp lệ. */
export function loiHangNhap(h: DgdvHangNhapLo): LoiHangNhap | null {
  if (h.id_cot == null) return null;
  if (h.so_luong_huy > h.so_luong) return h.so_luong > 0 ? 'slLoiLonHon' : 'thieuSoLuong';
  if (h.so_luong <= 0 && (chuHoacNull(h.danh_gia) || chuHoacNull(h.ly_do_huy))) return 'thieuSoLuong';
  return null;
}

/**
 * Các bước ghi để số của lô `idPhieuLo` (ngày `ngay`) khớp bảng nhập `hang`:
 * - Dòng đã lưu: SL ≤ 0 hoặc không còn trong bảng → xoá; đổi số / chữ → ghi đè đúng khoá; không đổi → bỏ qua.
 * - Hàng mới có SL > 0 → ghi ở stt_dong kế tiếp của (lô, dây, ngày), các hàng mới cùng dây nối tiếp nhau.
 * - Đứt dây: khác số đang có → đặt số mới (0 = xoá).
 * Thứ tự: xoá → ghi đè → thêm → đứt dây (xoá trước để không vướng khoá). Không kiểm lỗi — gọi `loiHangNhap` trước.
 */
export function keHoachLuuCaLo(
  phieu: Pick<DgdvPhieuDayDu, 'lo'>,
  idPhieuLo: string,
  ngay: string,
  hang: readonly DgdvHangNhapLo[]
): DgdvThaoTacGhi[] {
  const lo = phieu.lo.find((l) => l.id === idPhieuLo);
  const cu = (lo?.dong ?? []).filter((d) => d.ngay === ngay);
  const khoaO = (idCot: string, stt: number) => `${idCot}|${stt}`;
  const hangTheoKhoa = new Map(
    hang.filter((h) => h.id_cot != null && h.stt_dong != null).map((h) => [khoaO(h.id_cot!, h.stt_dong!), h])
  );
  const khoa = (idCot: string, stt: number): DgdvKhoaDong => ({ id_phieu_lo: idPhieuLo, id_cot: idCot, ngay, stt_dong: stt });
  const gtCua = (h: DgdvHangNhapLo) => ({
    so_luong: h.so_luong,
    danh_gia: chuHoacNull(h.danh_gia),
    so_luong_huy: h.so_luong_huy,
    ly_do_huy: chuHoacNull(h.ly_do_huy),
  });

  const xoa: DgdvThaoTacGhi[] = [];
  const sua: DgdvThaoTacGhi[] = [];
  for (const d of cu) {
    const h = hangTheoKhoa.get(khoaO(d.id_cot, d.stt_dong));
    if (!h || h.so_luong <= 0) {
      xoa.push({ op: 'xoaDong', khoa: khoa(d.id_cot, d.stt_dong) });
      continue;
    }
    const gt = gtCua(h);
    const doi =
      gt.so_luong !== d.so_luong ||
      gt.so_luong_huy !== d.so_luong_huy ||
      gt.danh_gia !== chuHoacNull(d.danh_gia) ||
      gt.ly_do_huy !== chuHoacNull(d.ly_do_huy);
    if (doi) sua.push({ op: 'ghiDong', khoa: khoa(d.id_cot, d.stt_dong), gt });
  }

  const them: DgdvThaoTacGhi[] = [];
  const sttKe = new Map<string, number>();
  for (const h of hang) {
    if (h.id_cot == null || h.stt_dong != null || h.so_luong <= 0) continue;
    const stt = sttKe.get(h.id_cot) ?? sttDongKeTiep(phieu, idPhieuLo, h.id_cot, ngay);
    sttKe.set(h.id_cot, stt + 1);
    them.push({ op: 'ghiDong', khoa: khoa(h.id_cot, stt), gt: gtCua(h) });
  }

  const dut: DgdvThaoTacGhi[] = [];
  const hangDut = hang.find((h) => h.id_cot == null);
  if (hangDut) {
    const moi = Math.max(0, hangDut.so_luong);
    if (moi !== dutDayHienCo(phieu, idPhieuLo, ngay)) dut.push({ op: 'ghiDutDay', id_phieu_lo: idPhieuLo, ngay, dutDay: moi });
  }
  return [...xoa, ...sua, ...them, ...dut];
}

/** Tổng số lượng (gồm đứt dây) + tổng SL lỗi của các dòng đang hiện. */
export function tongDongPhang(ds: readonly DgdvDongPhang[]): { soLuong: number; soLuongLoi: number } {
  return ds.reduce((s, r) => ({ soLuong: s.soLuong + r.so_luong, soLuongLoi: s.soLuongLoi + r.so_luong_huy }), {
    soLuong: 0,
    soLuongLoi: 0,
  });
}
