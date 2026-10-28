/**
 * Bảng «Chi tiết đánh giá» của phiếu: mọi ô lưới (`fp_farm_dgdv_dong`) + đứt dây (`fp_farm_dgdv_lo_ngay`)
 * trải thành danh sách dòng phẳng, và kế hoạch ghi khi thêm / sửa / xoá một dòng. Thuần — test trực tiếp.
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
  so_luong_loi: number;
  ly_do_loi: string | null;
}

/** Giá trị nhập của dialog dòng. `id_cot` = null nghĩa là «Đứt dây». */
export interface DgdvDongInput {
  id_phieu_lo: string;
  ngay: string;
  id_cot: string | null;
  so_luong: number;
  danh_gia: string | null;
  so_luong_loi: number;
  ly_do_loi: string | null;
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
      gt: { so_luong: number; danh_gia: string | null; so_luong_loi: number; ly_do_loi: string | null };
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
        so_luong_loi: d.so_luong_loi,
        ly_do_loi: d.ly_do_loi,
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
        so_luong_loi: 0,
        ly_do_loi: null,
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
    so_luong_loi: moi.so_luong_loi,
    ly_do_loi: chuHoacNull(moi.ly_do_loi),
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

/** Tổng số lượng (gồm đứt dây) + tổng SL lỗi của các dòng đang hiện. */
export function tongDongPhang(ds: readonly DgdvDongPhang[]): { soLuong: number; soLuongLoi: number } {
  return ds.reduce((s, r) => ({ soLuong: s.soLuong + r.so_luong, soLuongLoi: s.soLuongLoi + r.so_luong_loi }), {
    soLuong: 0,
    soLuongLoi: 0,
  });
}
