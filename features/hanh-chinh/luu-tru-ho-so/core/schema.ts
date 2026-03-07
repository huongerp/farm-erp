import { z } from 'zod';
import i18n from '../../../../lib/i18n';

/** Format rules: mã hồ sơ trim + uppercase, tên trim, mô tả max 1000 ký tự */
export const hoSoSchema = z.object({
  id_tai_lieu: z.string().min(1, { message: i18n.t('hoSo.validation.taiLieuRequired') }),
  ma_ho_so: z.string().trim().min(1, { message: i18n.t('hoSo.validation.maRequired') }).transform((v) => v.toUpperCase()),
  ten_ho_so: z.string().trim().min(1, { message: i18n.t('hoSo.validation.tenRequired') }).max(300, { message: i18n.t('hoSo.validation.tenMaxLength') }),
  id_phong_ban: z.string().optional(),
  thoi_han_luu_tru: z.string().trim().optional(),
  mo_ta: z.string().trim().max(1000).optional(),
  trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1, {
    message: i18n.t('hoSo.validation.statusInvalid'),
  }),
});

export type HoSoFormValues = z.infer<typeof hoSoSchema>;
