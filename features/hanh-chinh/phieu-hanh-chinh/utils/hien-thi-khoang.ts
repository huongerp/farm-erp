import type { TFunction } from 'i18next';
import type { AdminFormRequest } from '../core/types';
import { laLoaiTheoKhoang, soNgayCuaPhieu } from '../core/khoang-nghi';
import { getAdminFormShiftLabel } from '../core/constants';

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

const ddmmyyyy = (ngay: string) => (ngay ? `${ddmm(ngay)}/${ngay.slice(0, 4)}` : '');

/**
 * Một dòng thời gian cho thẻ mobile, theo loại phiếu:
 * - nghỉ / công tác nhiều ngày: "21/10 sáng → 22/10 chiều · 2 ngày"
 * - nghỉ / công tác trong 1 ngày: "24/10/2026 · Chiều · 0,5 ngày"
 * - đi muộn, tăng ca, quên chấm công: "24/10/2026 · Cả ngày" — số ngày vô nghĩa với các loại này.
 */
export function moTaThoiGianPhieu(p: AdminFormRequest, t: TFunction): string {
  const soNgay = t('adminForm.card.soNgay', { soNgay: hienThiSoNgay(p) });
  if (!laLoaiTheoKhoang(p.loai_phieu)) return `${ddmmyyyy(p.ngay)} · ${getAdminFormShiftLabel(p.ca, t)}`;
  const nhieuNgay = moTaKhoangNhieuNgay(p, t);
  if (nhieuNgay) return `${nhieuNgay} · ${soNgay}`;
  return `${ddmmyyyy(p.ngay)} · ${getAdminFormShiftLabel(p.ca, t)} · ${soNgay}`;
}
