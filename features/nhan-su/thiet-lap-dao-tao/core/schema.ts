import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const loaiKhoaHocSchema = z.object({
  ma: z.string().min(1, { message: i18n.t('thietLapDaoTao.loaiKhoaHoc.validation.maRequired') }),
  ten: z.string().min(1, { message: i18n.t('thietLapDaoTao.loaiKhoaHoc.validation.tenRequired') }),
  thu_tu: z.coerce.number().min(0, { message: i18n.t('thietLapDaoTao.loaiKhoaHoc.validation.thuTuMin') }),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1, {
    message: i18n.t('thietLapDaoTao.loaiKhoaHoc.validation.statusInvalid'),
  }),
});

export type LoaiKhoaHocFormValues = z.infer<typeof loaiKhoaHocSchema>;
