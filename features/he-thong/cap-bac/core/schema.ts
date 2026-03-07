import { z } from "zod";
import i18n from '../../../../lib/i18n';
import { TRANG_THAI } from '../../../../lib/constants';

export const jobLevelSchema = z.object({
  ten_cap_bac: z.string()
    .min(1, i18n.t('jobLevel.validation.nameRequired'))
    .max(255, i18n.t('jobLevel.validation.nameMax')),
  cap_bac: z.coerce.number()
    .int(i18n.t('jobLevel.validation.orderInt'))
    .min(0, i18n.t('jobLevel.validation.capBacMin')),
  mo_ta: z.string().max(500, i18n.t('jobLevel.validation.descMax')).optional().nullable(),
  trang_thai: z.enum([TRANG_THAI.DANG_DUNG, TRANG_THAI.NGUNG]),
});

export type JobLevelFormValues = z.infer<typeof jobLevelSchema>;
