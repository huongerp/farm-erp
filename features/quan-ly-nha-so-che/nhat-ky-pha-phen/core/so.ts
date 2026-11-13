/** Chuỗi nhập tay → số; trống / không hợp lệ → null (không phải 0 vì Number('') = 0). Chấp nhận dấu phẩy thập phân. */
export function parseSo(s: string | number | null | undefined): number | null {
  if (s == null) return null;
  if (typeof s === 'number') return Number.isFinite(s) ? s : null;
  const t = s.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Số → chuỗi đưa vào ô nhập (tối đa 3 số lẻ, dấu chấm). */
export function soSangChuoi(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '';
  return String(Math.round(n * 1000) / 1000);
}

/** Numeric PostgREST có thể về string → ép Number, null giữ null. */
export function epSo(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
