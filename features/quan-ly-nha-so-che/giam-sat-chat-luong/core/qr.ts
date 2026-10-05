/**
 * QR trên tem thùng mẫu: `GSCL:<ma_tem>`, vd `GSCL:2026-001-10-04-03` = năm 2026, phiếu
 * 001-10-04 (phiếu thứ 1 ngày 04/10), thùng 3. Năm nằm trong mã vì số phiếu PPP-MM-DD lặp lại
 * mỗi năm. Tiền tố riêng để không lẫn với QR mã hàng hoá mà Đăng ký nhận hàng quét.
 * `ma_tem` do trigger DB sinh (migration 019): `YYYY-<so_phieu>-<stt 2 chữ số>`.
 */

export const TIEN_TO_QR_GSCL = 'GSCL:';

const MA_TEM = /^\d{4}-\d{3}-\d{2}-\d{2}-\d{2,3}$/;

export function taoNoiDungQr(maTem: string): string {
  return `${TIEN_TO_QR_GSCL}${maTem}`;
}

/**
 * Chuỗi quét được → `ma_tem` chuẩn hoá; không phải tem giám sát chất lượng → null.
 * Chấp nhận thiếu tiền tố (máy quét cầm tay gõ tay mã in dưới QR).
 */
export function docMaTem(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).replace(/\s+/g, '').toUpperCase();
  const ma = s.startsWith(TIEN_TO_QR_GSCL) ? s.slice(TIEN_TO_QR_GSCL.length) : s;
  return MA_TEM.test(ma) ? ma : null;
}
