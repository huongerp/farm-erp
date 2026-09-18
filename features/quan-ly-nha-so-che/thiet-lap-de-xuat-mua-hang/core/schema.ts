import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

export const farmTienDoMuaHangSchema = z.object({
  ma: z.string().min(1, { message: i18n.t('thietLapDeXuatMuaHang.validation.maRequired') }),
  ten: z.string().min(1, { message: i18n.t('thietLapDeXuatMuaHang.validation.tenRequired') }),
  thu_tu: z.coerce.number().min(0, { message: i18n.t('thietLapDeXuatMuaHang.validation.thuTuMin') }),
  mau: z.string().optional().nullable(),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.enum([TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG]),
});

export type FarmTienDoMuaHangFormValues = z.infer<typeof farmTienDoMuaHangSchema>;
