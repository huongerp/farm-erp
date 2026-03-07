import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { ADMIN_FORM_SHIFTS } from './constants';
import { ADMIN_FORM_TYPES } from '../../thiet-lap-cong-luong/core/constants';

export const adminFormSchema = z.object({
  loai_phieu: z.enum(ADMIN_FORM_TYPES, {
    errorMap: () => ({ message: i18n.t('adminForm.validation.typeRequired') }),
  }),
  ca: z.enum(ADMIN_FORM_SHIFTS, {
    errorMap: () => ({ message: i18n.t('adminForm.validation.shiftRequired') }),
  }),
  ngay: z.string().min(1, { message: i18n.t('adminForm.validation.dateRequired') }),
  ly_do: z
    .string()
    .min(5, { message: i18n.t('adminForm.validation.reasonMin') })
    .max(500, { message: i18n.t('adminForm.validation.reasonMax') }),
});

export type AdminFormValues = z.infer<typeof adminFormSchema>;
