import { getBankByBin } from '../../../../lib/vn-banks';
import type { ThanhToanDoiTac } from '../core/types';

/** Tài khoản nhận tiền của đối tác: «Chủ TK · STK · Ngân hàng» — bỏ phần trống; rỗng khi không có dữ liệu. */
export function thongTinNganHangDoiTac(
  d: Pick<ThanhToanDoiTac, 'ngan_hang_bin' | 'so_tai_khoan' | 'chu_tai_khoan'>
): string {
  const bank = getBankByBin(d.ngan_hang_bin);
  const tenNganHang = bank ? `${bank.shortName} (${bank.code})` : d.ngan_hang_bin;
  return [d.chu_tai_khoan, d.so_tai_khoan, tenNganHang]
    .map((x) => x?.trim())
    .filter(Boolean)
    .join(' · ');
}
