import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const assetStorageLocationSchema = z.object({
  id_chi_nhanh: z.string().min(1, { message: i18n.t('thietLapTaiSan.noiLuu.validation.branchRequired') }),
  ma_noi_luu: z.string().min(1, { message: i18n.t('thietLapTaiSan.noiLuu.validation.maRequired') }),
  ten_noi_luu: z.string().min(1, { message: i18n.t('thietLapTaiSan.noiLuu.validation.tenRequired') }),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1, {
    message: i18n.t('thietLapTaiSan.noiLuu.validation.statusInvalid'),
  }),
});

export type AssetStorageLocationFormValues = z.infer<typeof assetStorageLocationSchema>;

export const assetStatusSchema = z.object({
  ma: z.string().min(1, { message: i18n.t('thietLapTaiSan.trangThai.validation.maRequired') }),
  ten: z.string().min(1, { message: i18n.t('thietLapTaiSan.trangThai.validation.tenRequired') }),
  thu_tu: z.coerce.number().min(0, { message: i18n.t('thietLapTaiSan.trangThai.validation.thuTuMin') }),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1, {
    message: i18n.t('thietLapTaiSan.trangThai.validation.statusInvalid'),
  }),
});

export type AssetStatusFormValues = z.infer<typeof assetStatusSchema>;

export const assetGroupSchema = z.object({
  ma: z.string().min(1, { message: i18n.t('thietLapTaiSan.nhomTaiSan.validation.maRequired') }),
  ten: z.string().min(1, { message: i18n.t('thietLapTaiSan.nhomTaiSan.validation.tenRequired') }),
  thu_tu: z.coerce.number().min(0, { message: i18n.t('thietLapTaiSan.nhomTaiSan.validation.thuTuMin') }),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1, {
    message: i18n.t('thietLapTaiSan.nhomTaiSan.validation.statusInvalid'),
  }),
  phuong_phap_khau_hao: z.enum(['duong_thang', 'so_du_giam_dan'], {
    message: i18n.t('thietLapTaiSan.nhomTaiSan.validation.phuongPhapRequired'),
  }),
  ty_le_khau_hao: z.coerce.number().min(0).max(100).optional().nullable(),
  so_nam_su_dung: z.coerce.number().min(1).optional().nullable(),
});

export type AssetGroupFormValues = z.infer<typeof assetGroupSchema>;
