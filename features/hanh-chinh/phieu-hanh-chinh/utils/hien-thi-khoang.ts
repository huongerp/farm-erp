import type { TFunction } from 'i18next';
import type { AdminFormRequest } from '../core/types';
import { soNgayCuaPhieu } from '../core/khoang-nghi';

const ddmm = (ngay: string) => (ngay ? `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}` : '');

/** "01/09 chiều → 03/09 sáng"; null khi phiếu nằm gọn trong 1 ngày (hiện badge ca). */
export function moTaKhoangNhieuNgay(p: AdminFormRequest, t: TFunction): string | null {
  if (!p.den_ngay || p.den_ngay === p.ngay) return null;
  const buoi = (b: AdminFormRequest['tu_buoi']) => t(`adminForm.session.${b}`).toLocaleLowerCase('vi');
  return `${ddmm(p.ngay)} ${buoi(p.tu_buoi)} → ${ddmm(p.den_ngay)} ${buoi(p.den_buoi)}`;
}

/** Số ngày để hiển thị: "1,5". */
export const hienThiSoNgay = (p: AdminFormRequest): string =>
  soNgayCuaPhieu(p).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
