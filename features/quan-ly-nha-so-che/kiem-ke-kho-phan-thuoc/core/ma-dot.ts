/**
 * Mã đợt kiểm kê nhóm kho farm: <tiền tố>-YYYY-NNNN. Tiền tố theo biến thể (`bt.tienTo.dotKiemKe`):
 * KKPT ở Nhà sơ chế, PKK ở Phân thuốc — khác `KK-` của kiểm kê kho mua hàng.
 */
export function formatMaDotKiemKePT(seq: number, year: number = new Date().getFullYear(), tienTo = 'KKPT'): string {
  return `${tienTo}-${year}-${String(seq).padStart(4, '0')}`;
}
