import { z } from "zod";
import i18n from '../../../../lib/i18n';
import { TRANG_THAI } from '../../../../lib/constants';

export const departmentSchema = z.object({
  ten_phong_ban: z.string()
    .min(2, i18n.t('department.validation.nameMin'))
    .max(500),
  chuc_nang: z.string().max(1000).optional().nullable(),
  tt: z.coerce.number().min(0, i18n.t('department.validation.sortOrderMin')),
  trang_thai: z.enum([TRANG_THAI.DANG_DUNG, TRANG_THAI.NGUNG]),
});

export type DepartmentFormValues = z.infer<typeof departmentSchema>;
