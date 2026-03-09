import { z } from "zod";
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

export const positionSchema = z.object({
  ten_chuc_vu: z.string()
    .min(1, i18n.t('position.validation.nameMin'))
    .max(255, i18n.t('position.validation.nameMax')),
  cap_bac_id: z.string().optional().nullable(),
  phong_ban_id: z.string().optional().nullable(),
  mo_ta: z.string().max(500, i18n.t('position.validation.descMax')).optional().nullable(),
  tt: z.coerce.number().int().min(0),
  trang_thai: z.enum([TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG]),
});

export type PositionFormValues = z.infer<typeof positionSchema>;
