/**
 * QR trên tem thùng mẫu: `GSCL:<ma_tem>`, vd `GSCL:GS-00012-03` (phiếu GS-00012, thùng 3).
 * Tiền tố riêng để không lẫn với QR mã hàng hoá mà module Đăng ký nhận hàng quét.
 * `ma_tem` do trigger DB sinh: `<so_phieu>-<stt 2 chữ số>`.
 */

export const TIEN_TO_QR_GSCL = 'GSCL:';

const MA_TEM = /^GS-\d+-\d+$/;

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
