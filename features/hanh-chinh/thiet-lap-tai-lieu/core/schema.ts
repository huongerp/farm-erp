import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const loaiTaiLieuSchema = z.object({
  ma: z.string().min(1, { message: i18n.t('thietLapTaiLieu.loai.validation.maRequired') }),
  ten: z.string().min(1, { message: i18n.t('thietLapTaiLieu.loai.validation.tenRequired') }),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1, {
    message: i18n.t('thietLapTaiLieu.loai.validation.statusInvalid'),
  }),
});

export type LoaiTaiLieuFormValues = z.infer<typeof loaiTaiLieuSchema>;

export const trangThaiTaiLieuSchema = z.object({
  ma: z.string().min(1, { message: i18n.t('thietLapTaiLieu.trangThai.validation.maRequired') }),
  ten: z.string().min(1, { message: i18n.t('thietLapTaiLieu.trangThai.validation.tenRequired') }),
  thu_tu: z.coerce.number().min(0, { message: i18n.t('thietLapTaiLieu.trangThai.validation.thuTuMin') }),
  mau: z.string().optional().nullable(),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1, {
    message: i18n.t('thietLapTaiLieu.trangThai.validation.statusInvalid'),
  }),
});

export type TrangThaiTaiLieuFormValues = z.infer<typeof trangThaiTaiLieuSchema>;
