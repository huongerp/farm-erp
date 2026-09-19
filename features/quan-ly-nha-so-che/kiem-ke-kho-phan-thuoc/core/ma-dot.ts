/** Mã đợt kiểm kê phân thuốc: KKPT-YYYY-NNNN (prefix khác `KK-` của kiểm kê kho mua hàng). */
export function formatMaDotKiemKePT(seq: number, year: number = new Date().getFullYear()): string {
  return `KKPT-${year}-${String(seq).padStart(4, '0')}`;
}
