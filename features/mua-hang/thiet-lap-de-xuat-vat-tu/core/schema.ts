import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

const statusSchema = {
  ma: z.string().min(1, { message: i18n.t('thietLapDeXuatVatTu.validation.maRequired') }),
  ten: z.string().min(1, { message: i18n.t('thietLapDeXuatVatTu.validation.tenRequired') }),
  thu_tu: z.coerce.number().min(0, { message: i18n.t('thietLapDeXuatVatTu.validation.thuTuMin') }),
  mau: z.string().optional().nullable(),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.enum([TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG]),
};

export const trangThaiDoiTacSchema = z.object(statusSchema);
export type TrangThaiDoiTacFormValues = z.infer<typeof trangThaiDoiTacSchema>;

export const trangThaiThanhToanDoiTacSchema = z.object(statusSchema);
export type TrangThaiThanhToanDoiTacFormValues = z.infer<typeof trangThaiThanhToanDoiTacSchema>;
