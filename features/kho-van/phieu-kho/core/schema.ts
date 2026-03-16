import { z } from 'zod';
import i18n from '../../../../lib/i18n';

const TRANG_THAI_VALUES = ['Chờ duyệt', 'Đã duyệt', 'Không duyệt'] as const;

/** Schema cho một dòng chi tiết (dùng khi gửi API). */
export const phieuKhoChiTietItemSchema = z.object({
  id_hang_hoa: z.string().min(1, i18n.t('phieuKho.validation.itemRequired')),
  so_luong: z.coerce.number().min(0.0001, i18n.t('phieuKho.validation.quantityMin')),
  don_gia: z.coerce.number().optional(),
  so_lot: z.string().optional(),
  ghi_chu: z.string().optional(),
});

/** Form cho phép dòng trống (id_hang_hoa rỗng, so_luong 0); filter khi submit. */
export const phieuKhoChiTietFormItemSchema = z.object({
  id_hang_hoa: z.string(),
  so_luong: z.coerce.number(),
  don_gia: z.coerce.number().optional(),
  so_lot: z.string().optional(),
  ghi_chu: z.string().optional(),
});

export const phieuKhoSchema = z.object({
  so_phieu: z
    .string()
    .min(1, i18n.t('phieuKho.validation.codeRequired'))
    .max(50, i18n.t('phieuKho.validation.codeMax')),
  ngay: z.string().min(1, i18n.t('phieuKho.validation.dateRequired')),
  kho_id: z.string().min(1, i18n.t('phieuKho.validation.warehouseRequired')),
  kho_den_id: z.string().optional().nullable(),
  id_nha_cung_cap: z.string().optional().nullable(),
  id_khach_hang: z.string().optional().nullable(),
  mo_ta: z.string().optional(),
  trang_thai: z.enum(TRANG_THAI_VALUES, {
    errorMap: () => ({ message: i18n.t('phieuKho.validation.statusInvalid') }),
  }),
  nguoi_tao_id: z.coerce.number().optional().nullable(),
  chi_tiet: z.array(phieuKhoChiTietFormItemSchema).default([]),
});

export type PhieuKhoChiTietFormItem = z.infer<typeof phieuKhoChiTietFormItemSchema>;
export type PhieuKhoFormValues = z.infer<typeof phieuKhoSchema>;
