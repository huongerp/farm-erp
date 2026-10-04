/**
 * QR của hàng hoá chứa đúng `ma_hang_hoa` (vd `TP-TQ401`) — tạo ở module Danh sách hàng hoá.
 * Chấp nhận thêm vài dạng hay gặp khi quét tem cũ / tem in tay.
 */

/** Tiền tố tuỳ chọn trên tem: `HH:TP-TQ401`. */
const TIEN_TO = /^HH\s*[:|]\s*/i;

/** Chuỗi quét được → mã hàng chuẩn hoá (in hoa, bỏ khoảng trắng); rỗng → null. */
export function chuanHoaMaQr(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  // Tem dạng URL: lấy tham số ?ma= hoặc đoạn cuối đường dẫn.
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      s = u.searchParams.get('ma') ?? u.pathname.split('/').filter(Boolean).pop() ?? '';
      s = decodeURIComponent(s);
    } catch {
      return null;
    }
  }
  s = s.replace(TIEN_TO, '').replace(/\s+/g, '').toUpperCase();
  return s || null;
}

export interface HangHoaTheoMa {
  id: string;
  ma_hang: string;
}

/** Map mã (đã chuẩn hoá) → hàng hoá, để tra nhanh mỗi lần quét. */
export function taoMapMaHangHoa<T extends HangHoaTheoMa>(list: T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const h of list) {
    const k = chuanHoaMaQr(h.ma_hang);
    if (k && !m.has(k)) m.set(k, h);
  }
  return m;
}

/** Bộ lọc quét trùng dùng chung cho mọi màn quét QR (xem lib/qr-quet.ts). */
export { taoBoLocQuetTrung } from '../../../../lib/qr-quet';
