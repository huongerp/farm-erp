import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const hangMucTaiChinhSchema = z.object({
  ma_danh_muc: z
    .string()
    .min(1, i18n.t('danhMucTaiChinh.validation.codeRequired'))
    .max(50, i18n.t('danhMucTaiChinh.validation.codeMax')),
  ten_danh_muc: z
    .string()
    .min(1, i18n.t('danhMucTaiChinh.validation.nameRequired'))
    .max(255, i18n.t('danhMucTaiChinh.validation.nameMax')),
  loai: z.enum(['thu', 'chi'], {
    required_error: i18n.t('danhMucTaiChinh.validation.loaiRequired'),
  }),
  id_cha: z.string().optional().nullable(),
  thu_tu: z.coerce.number().min(0, i18n.t('danhMucTaiChinh.validation.thuTuMin')),
  mo_ta: z.string().optional(),
  trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1, {
    message: i18n.t('danhMucTaiChinh.validation.statusInvalid'),
  }),
});

export type HangMucTaiChinhFormValues = z.infer<typeof hangMucTaiChinhSchema>;
