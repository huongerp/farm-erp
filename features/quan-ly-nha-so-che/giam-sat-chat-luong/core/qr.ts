/**
 * QR trên tem thùng mẫu giám sát chất lượng.
 *
 * QR chứa URL mở trang tra cứu công khai: `<origin>/qr/<ma_tem>`, vd
 * `https://erp.vd.vn/qr/2026-001-10-04-03`. Quét bằng camera điện thoại là mở
 * thẳng trang "THÔNG TIN SẢN PHẨM" (không cần đăng nhập) thay vì hiện chuỗi thô.
 *
 * `ma_tem` = năm 2026 + phiếu 001-10-04 (phiếu thứ 1 ngày 04/10) + thùng 03; năm
 * nằm trong mã vì số phiếu PPP-MM-DD lặp lại mỗi năm. `ma_tem` do trigger DB sinh
 * (migration 019): `YYYY-<so_phieu>-<stt 2 chữ số>`.
 *
 * Vẫn đọc được tem cũ dạng `GSCL:<ma_tem>` (và mã trần do máy quét cầm tay gõ tay).
 */

export const TIEN_TO_QR_GSCL = 'GSCL:';

const MA_TEM = /^\d{4}-\d{3}-\d{2}-\d{2}-\d{2,3}$/;

/** Nội dung QR cũ (`GSCL:<ma_tem>`) — giữ cho tem đã in và test cũ. */
export function taoNoiDungQr(maTem: string): string {
  return `${TIEN_TO_QR_GSCL}${maTem}`;
}

/** URL trên QR mới: `<origin>/qr/<ma_tem>` (bỏ dấu `/` cuối của origin). */
export function taoUrlQrTem(maTem: string, origin: string): string {
  return `${origin.replace(/\/+$/, '')}/qr/${maTem}`;
}

/**
 * Chuỗi quét được → `ma_tem` chuẩn hoá; không phải tem giám sát chất lượng → null.
 * Chấp nhận:
 * - URL mới chứa `/qr/` (không phân biệt hoa thường; bỏ `?…`, `#…`, `/` cuối);
 * - tem cũ có tiền tố `GSCL:`;
 * - mã trần (máy quét cầm tay gõ tay mã in dưới QR).
 * URL không có `/qr/` → null (vd QR hàng hoá của module khác).
 */
export function docMaTem(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).replace(/\s+/g, '');

  const iQr = s.toLowerCase().indexOf('/qr/');
  if (iQr >= 0) {
    const ma = s
      .slice(iQr + '/qr/'.length)
      .split(/[?#]/)[0]
      .replace(/\/+$/, '')
      .toUpperCase();
    return MA_TEM.test(ma) ? ma : null;
  }

  const ma = s.toUpperCase();
  const khongTienTo = ma.startsWith(TIEN_TO_QR_GSCL) ? ma.slice(TIEN_TO_QR_GSCL.length) : ma;
  return MA_TEM.test(khongTienTo) ? khongTienTo : null;
}
