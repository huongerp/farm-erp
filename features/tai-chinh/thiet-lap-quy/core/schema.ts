import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

export const hangMucThuChiSchema = z.object({
  ten: z.string().min(1, { message: i18n.t('thietLapQuy.validation.tenRequired') }),
  loai: z.enum(['thu', 'chi', 'ca_hai']),
  thu_tu: z.coerce.number().min(0, { message: i18n.t('thietLapQuy.validation.thuTuMin') }),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.enum([TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG]),
});

export type HangMucThuChiFormValues = z.infer<typeof hangMucThuChiSchema>;
