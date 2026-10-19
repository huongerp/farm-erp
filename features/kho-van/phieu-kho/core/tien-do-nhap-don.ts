import { TRANG_THAI_KHONG_DUYET } from './constants';

/**
 * Tổng số lượng đã nhập kho theo một đơn đặt hàng so với tổng đặt.
 * Phiếu "Không duyệt" không tính vào đã nhập (hàng không vào kho).
 * Cộng thô số lượng mọi dòng — chỉ để nhìn nhanh tiến độ, không quy đổi đơn vị tính.
 */
export function tinhTienDoNhapDon(
  phieuNhap: ReadonlyArray<{ trang_thai: string; tong_so_luong?: number | null }>,
  chiTietDon: ReadonlyArray<{ so_luong: number | null | undefined }> | undefined,
): { daNhap: number; dat: number } {
  let daNhap = 0;
  for (const p of phieuNhap) {
    if (p.trang_thai === TRANG_THAI_KHONG_DUYET) continue;
    daNhap += Number(p.tong_so_luong) || 0;
  }
  let dat = 0;
  for (const ct of chiTietDon ?? []) dat += Number(ct.so_luong) || 0;
  return { daNhap, dat };
}
