import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const khoSchema = z.object({
  ma_kho: z
    .string()
    .min(2, i18n.t('kho.validation.codeMin'))
    .max(50, i18n.t('kho.validation.codeMax'))
    .regex(/^[A-Z0-9_-]+$/, i18n.t('kho.validation.codeFormat')),
  ten_kho: z
    .string()
    .min(2, i18n.t('kho.validation.nameMin'))
    .max(255, i18n.t('kho.validation.nameMax')),
  dia_chi: z.string().optional(),
  mo_ta: z.string().optional(),
  id_chi_nhanh: z.string().optional().nullable(),
  trang_thai: z.enum(['Đang hoạt động', 'Ngừng hoạt động'], {
    message: i18n.t('kho.validation.statusInvalid'),
  }),
  thu_tu: z.coerce.number().min(0, i18n.t('kho.validation.sortOrderMin')),
});

export type KhoFormValues = z.infer<typeof khoSchema>;
