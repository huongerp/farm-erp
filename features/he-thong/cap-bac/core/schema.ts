import { z } from "zod";
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

export const jobLevelSchema = z.object({
  ten_cap_bac: z.string()
    .min(1, i18n.t('jobLevel.validation.nameRequired'))
    .max(255, i18n.t('jobLevel.validation.nameMax')),
  cap_bac: z.coerce.number()
    .int(i18n.t('jobLevel.validation.orderInt'))
    .min(0, i18n.t('jobLevel.validation.capBacMin')),
  mo_ta: z.string().max(500, i18n.t('jobLevel.validation.descMax')).optional().nullable(),
  trang_thai: z.enum([TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG]),
});

export type JobLevelFormValues = z.infer<typeof jobLevelSchema>;
