/**
 * Tiền theo đợt của hợp đồng mua hàng: giá trị hàng theo số cây, gợi ý thực trả sau khi trừ cọc,
 * tổng hợp cọc. `so_tien` của đợt luôn là TIỀN THỰC CHI (cọc hoặc thực trả).
 */
import { LOAI_DOT, type LoaiDot } from './constants';

/** Làm tròn 2 chữ số (numeric(18,2) ở DB) — tránh lệch 0,0000001 do số thực. */
function lam2(n: number): number {
  return Math.round(n * 100) / 100;
}

function soHuuHan(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Giá trị hàng = số cây × đơn giá HĐ; thiếu một trong hai → null. */
export function giaTriHang(
  soCay: number | null | undefined,
  donGia: number | null | undefined
): number | null {
  const c = soHuuHan(soCay);
  const g = soHuuHan(donGia);
  if (c == null || g == null) return null;
  return lam2(c * g);
}

/** Gợi ý số tiền thực trả = max(0, giá trị hàng − trừ cọc); không tính được giá trị → null. */
export function goiYThucTra(
  soCay: number | null | undefined,
  donGia: number | null | undefined,
  tienTruCoc: number | null | undefined
): number | null {
  const gt = giaTriHang(soCay, donGia);
  if (gt == null) return null;
  return Math.max(0, lam2(gt - (soHuuHan(tienTruCoc) ?? 0)));
}

export interface DongCocInput {
  id?: string | number | null;
  loai_dot?: LoaiDot | string | null;
  so_tien?: number | string | null;
  tien_tru_coc?: number | string | null;
}

export interface TongHopCoc {
  /** Σ so_tien các dòng cọc */
  tienCoc: number;
  /** Σ tien_tru_coc các dòng thanh toán */
  cocDaTru: number;
  /** tienCoc − cocDaTru (âm = đã trừ lố) */
  cocConLai: number;
}

/** Tổng hợp cọc của một HĐ; `boQuaId` = dòng đang sửa (không tính chính nó vào cọc đã trừ). */
export function tongHopCoc(chiTiet: readonly DongCocInput[], boQuaId?: string | null): TongHopCoc {
  let tienCoc = 0;
  let cocDaTru = 0;
  for (const d of chiTiet) {
    if (boQuaId != null && d.id != null && String(d.id) === String(boQuaId)) continue;
    if (d.loai_dot === LOAI_DOT.COC) tienCoc += soHuuHan(d.so_tien) ?? 0;
    else cocDaTru += soHuuHan(d.tien_tru_coc) ?? 0;
  }
  tienCoc = lam2(tienCoc);
  cocDaTru = lam2(cocDaTru);
  return { tienCoc, cocDaTru, cocConLai: lam2(tienCoc - cocDaTru) };
}

/** Đợt thanh toán trừ cọc nhiều hơn cọc còn lại (cọc còn lại âm coi như 0) → form báo lỗi. */
export function truCocVuotConLai(
  loaiDot: LoaiDot | string | null | undefined,
  tienTruCoc: number | null | undefined,
  cocConLai: number
): boolean {
  if (loaiDot === LOAI_DOT.COC) return false;
  return (soHuuHan(tienTruCoc) ?? 0) > Math.max(0, cocConLai);
}

/** Dòng cọc không nhận cây và không trừ cọc — chuẩn hoá trước khi lưu. */
export function chuanHoaDongTheoLoai<
  T extends { loai_dot: LoaiDot; so_cay_thuc_nhan: number; tien_tru_coc: number },
>(dong: T): T {
  if (dong.loai_dot !== LOAI_DOT.COC) return dong;
  return { ...dong, so_cay_thuc_nhan: 0, tien_tru_coc: 0 };
}
