import { z } from 'zod';
import i18n from '../../../../lib/i18n';

/** Form thêm/sửa thiết bị — dùng react-hook-form trong ThietBiForm. */
export const thietBiFormSchema = z.object({
  id_chi_nhanh: z.string().trim().min(1, { message: i18n.t('baoDuongThietBi.validation.farmRequired') }),
  ten: z.string().trim().min(1, { message: i18n.t('baoDuongThietBi.validation.tenRequired') }).max(300),
  ma_ts: z.string().trim().max(200).optional().or(z.literal('')),
  so_luong: z.string().trim().max(100).optional().or(z.literal('')),
  khu_vuc: z.string().trim().max(200).optional().or(z.literal('')),
  id_tai_san: z.string().trim().optional().or(z.literal('')),
  ghi_chu: z.string().trim().max(1000).optional().or(z.literal('')),
  dang_dung: z.boolean(),
  thu_tu: z.coerce
    .number()
    .int({ message: i18n.t('baoDuongThietBi.validation.thuTuNguyen') })
    .min(0),
});

export type ThietBiFormValues = z.infer<typeof thietBiFormSchema>;

/** Giá trị form inline của một việc bảo dưỡng (không dùng zod — xem ViecEditor). */
export interface ViecFormValues {
  noi_dung: string;
  chu_ky_ngay: string;
  /** Ngày bắt đầu — chỉ nhập khi việc chưa làm lần nào; đã làm thì là hạn auto (chỉ đọc). */
  han_ke_tiep: string;
  ghi_chu: string;
  dang_dung: boolean;
}

/** Giá trị form nhật ký (dialog "Ghi nhận bảo dưỡng"). */
export interface NhatKyFormValues {
  ngay_thuc_hien: string;
  ket_qua: 'hoan_thanh' | 'can_theo_doi' | 'can_sua_chua';
  noi_dung: string;
  id_nguoi_thuc_hien: string | null;
  hinh_anh: string[];
}

/** Chu kỳ hợp lệ: trống = không theo lịch ngày, ngược lại là số nguyên > 0. */
export function docChuKyNgay(raw: string): number | null | 'loi' {
  const s = raw.trim();
  if (s === '') return null;
  const n = Number(s);
  if (!Number.isInteger(n) || n <= 0) return 'loi';
  return n;
}

/** Ngày bắt đầu hợp lệ — trống = null. */
export function docNgay(raw: string): string | null | 'loi' {
  const s = raw.trim();
  if (s === '') return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : 'loi';
}
