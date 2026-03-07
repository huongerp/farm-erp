import { z } from 'zod';
import i18n from '../../../../lib/i18n';

const statusSchema = {
  ma: z.string().min(1, { message: i18n.t('thietLapDeXuatVatTu.validation.maRequired') }),
  ten: z.string().min(1, { message: i18n.t('thietLapDeXuatVatTu.validation.tenRequired') }),
  thu_tu: z.coerce.number().min(0, { message: i18n.t('thietLapDeXuatVatTu.validation.thuTuMin') }),
  mau: z.string().optional().nullable(),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1, {
    message: i18n.t('thietLapDeXuatVatTu.validation.statusInvalid'),
  }),
};

export const trangThaiDoiTacSchema = z.object(statusSchema);
export type TrangThaiDoiTacFormValues = z.infer<typeof trangThaiDoiTacSchema>;

export const trangThaiThanhToanDoiTacSchema = z.object(statusSchema);
export type TrangThaiThanhToanDoiTacFormValues = z.infer<typeof trangThaiThanhToanDoiTacSchema>;
