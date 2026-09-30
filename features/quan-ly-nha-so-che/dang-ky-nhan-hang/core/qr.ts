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

/**
 * Bộ lọc quét trùng khi quét liên tục. Mọi thùng cùng loại có CÙNG một mã, nên phải
 * phân biệt "vẫn đang chĩa vào thùng cũ" với "đã sang thùng mới":
 *
 * - `thay(ma)` mỗi khung hình đọc được mã → `true` nếu được tính là một thùng mới.
 * - `trong()` mỗi khung hình đọc xong mà KHÔNG có mã (camera đã rời tem).
 *
 * Cùng mã chỉ được tính lại khi đã thấy khung trống liên tục ≥ `roiTemMs`. Không dựa vào
 * khoảng thời gian giữa hai lần đọc: máy quét có thể khựng cả giây (máy yếu, đang ghi
 * dữ liệu) trong khi tem vẫn nằm trong khung — lúc đó không có khung trống nào.
 * Mã khác mã trước → luôn tính.
 */
export function taoBoLocQuetTrung(roiTemMs = 500) {
  let maCuoi: string | null = null;
  let trongTu: number | null = null;
  return {
    thay(ma: string, bayGio: number): boolean {
      const daRoiTem = trongTu != null && bayGio - trongTu >= roiTemMs;
      const tinh = ma !== maCuoi || daRoiTem;
      maCuoi = ma;
      trongTu = null;
      return tinh;
    },
    trong(bayGio: number): void {
      if (maCuoi != null && trongTu == null) trongTu = bayGio;
    },
    /** Sau khi hoàn tác / nhập tay: lần quét kế tiếp luôn được tính. */
    datLai(): void {
      maCuoi = null;
      trongTu = null;
    },
  };
}
