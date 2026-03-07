import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const trangThaiUngVienSchema = z.object({
  ma: z.string().min(1, { message: i18n.t('thietLapTuyenDung.trangThaiUngVien.validation.maRequired') }),
  ten: z.string().min(1, { message: i18n.t('thietLapTuyenDung.trangThaiUngVien.validation.tenRequired') }),
  thu_tu: z.coerce.number().min(0, { message: i18n.t('thietLapTuyenDung.trangThaiUngVien.validation.thuTuMin') }),
  ghi_chu: z.string().optional().nullable(),
  /** '' = không áp dụng, 'onboard' = đã tuyển/đang làm, 'nghi' = đã nghỉ */
  loai_ket_qua: z.union([z.enum(['onboard', 'nghi']), z.literal('')]).optional(),
  trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1, {
    message: i18n.t('thietLapTuyenDung.trangThaiUngVien.validation.statusInvalid'),
  }),
});

export type TrangThaiUngVienFormValues = z.infer<typeof trangThaiUngVienSchema>;

export const kenhTuyenDungSchema = z.object({
  ma: z.string().min(1, { message: i18n.t('thietLapTuyenDung.kenhTuyenDung.validation.maRequired') }),
  ten: z.string().min(1, { message: i18n.t('thietLapTuyenDung.kenhTuyenDung.validation.tenRequired') }),
  thu_tu: z.coerce.number().min(0, { message: i18n.t('thietLapTuyenDung.kenhTuyenDung.validation.thuTuMin') }),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1, {
    message: i18n.t('thietLapTuyenDung.kenhTuyenDung.validation.statusInvalid'),
  }),
});

export type KenhTuyenDungFormValues = z.infer<typeof kenhTuyenDungSchema>;

export const mauPhanHoiSchema = z.object({
  ma: z.string().min(1, { message: i18n.t('thietLapTuyenDung.mauPhanHoi.validation.maRequired') }),
  ten_loai: z.string().min(1, { message: i18n.t('thietLapTuyenDung.mauPhanHoi.validation.tenLoaiRequired') }),
  tieu_de: z.string().min(1, { message: i18n.t('thietLapTuyenDung.mauPhanHoi.validation.tieuDeRequired') }),
  noi_dung_mau: z.string(),
  trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1, {
    message: i18n.t('thietLapTuyenDung.mauPhanHoi.validation.statusInvalid'),
  }),
});

export type MauPhanHoiFormValues = z.infer<typeof mauPhanHoiSchema>;
