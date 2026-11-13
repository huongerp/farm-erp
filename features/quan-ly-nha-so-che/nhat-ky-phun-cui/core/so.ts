/**
 * Ô số nhập tay → number | null. Ô trống là null (KHÔNG phải 0: `Number('')` = 0 sẽ ghi 0 vào DB);
 * chấp nhận dấu phẩy thập phân; chuỗi không phải số hữu hạn cũng là null.
 */
export function parseSo(raw: string | number | null | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const s = raw.trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Ô có nội dung nhưng không phải số hợp lệ (để báo lỗi khác với ô để trống). */
export function laSoKhongHopLe(raw: string | null | undefined): boolean {
  return (raw ?? '').trim() !== '' && parseSo(raw) == null;
}

/** Số hiển thị: tối đa 3 số lẻ, phân tách kiểu Việt. */
export function formatSo(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '';
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}
