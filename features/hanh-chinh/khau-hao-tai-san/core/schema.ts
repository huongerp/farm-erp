import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const kyKhauHaoSchema = z.object({
  thang: z.coerce.number().min(1).max(12, { message: i18n.t('khauHaoTaiSan.validation.thangInvalid') }),
  nam: z.coerce.number().min(2000).max(2100, { message: i18n.t('khauHaoTaiSan.validation.namInvalid') }),
  ghi_chu: z.string().optional().nullable(),
});

export type KyKhauHaoFormValues = z.infer<typeof kyKhauHaoSchema>;
