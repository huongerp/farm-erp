import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

export const hangHoaSchema = z.object({
  ma_hang: z
    .string()
    .min(1, i18n.t('hangHoa.validation.codeRequired'))
    .max(50, i18n.t('hangHoa.validation.codeMax'))
    .regex(/^[A-Z0-9_-]+$/, i18n.t('hangHoa.validation.codeFormat')),
  ten_hang: z
    .string()
    .min(1, i18n.t('hangHoa.validation.nameRequired'))
    .max(255, i18n.t('hangHoa.validation.nameMax')),
  id_danh_muc: z.string().optional().nullable(),
  don_vi_tinh: z.string().optional(),
  ton_toi_thieu: z.coerce.number().min(0).optional().nullable(),
  mo_ta: z.string().optional(),
  hinh_anh: z.string().optional().nullable(),
  trang_thai: z.enum([TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG]),
  thu_tu: z.coerce.number().min(0, i18n.t('hangHoa.validation.thuTuMin')),
});

export type HangHoaFormValues = z.infer<typeof hangHoaSchema>;
