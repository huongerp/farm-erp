import { z } from 'zod';
import i18n from '../../../../lib/i18n';

/** Schema cho một dòng chi tiết (dùng khi gửi API). */
export const phieuKhoChiTietItemSchema = z.object({
  id_hang_hoa: z.string().min(1, i18n.t('phieuKho.validation.itemRequired')),
  so_luong: z.coerce.number().min(0.0001, i18n.t('phieuKho.validation.quantityMin')),
  ghi_chu: z.string().optional(),
});

/** Form cho phép dòng trống (id_hang_hoa rỗng, so_luong 0); filter khi submit. */
export const phieuKhoChiTietFormItemSchema = z.object({
  id_hang_hoa: z.string(),
  so_luong: z.coerce.number(),
  ghi_chu: z.string().optional(),
});

export const phieuKhoSchema = z.object({
  so_phieu: z
    .string()
    .min(1, i18n.t('phieuKho.validation.codeRequired'))
    .max(50, i18n.t('phieuKho.validation.codeMax')),
  ngay: z.string().min(1, i18n.t('phieuKho.validation.dateRequired')),
  id_kho: z.string().min(1, i18n.t('phieuKho.validation.warehouseRequired')),
  id_kho_den: z.string().optional().nullable(),
  id_nha_cung_cap: z.string().optional().nullable(),
  id_khach_hang: z.string().optional().nullable(),
  mo_ta: z.string().optional(),
  trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1 || val === 2, {
    message: i18n.t('phieuKho.validation.statusInvalid'),
  }),
  chi_tiet: z.array(phieuKhoChiTietFormItemSchema).default([]),
});

export type PhieuKhoChiTietFormItem = z.infer<typeof phieuKhoChiTietFormItemSchema>;
export type PhieuKhoFormValues = z.infer<typeof phieuKhoSchema>;
