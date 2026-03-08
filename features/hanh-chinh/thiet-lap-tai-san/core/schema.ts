import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

export const assetStorageLocationSchema = z.object({
  id_chi_nhanh: z.string().min(1, { message: i18n.t('thietLapTaiSan.noiLuu.validation.branchRequired') }),
  ma_noi_luu: z.string().min(1, { message: i18n.t('thietLapTaiSan.noiLuu.validation.maRequired') }),
  ten_noi_luu: z.string().min(1, { message: i18n.t('thietLapTaiSan.noiLuu.validation.tenRequired') }),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.enum([TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG]),
});

export type AssetStorageLocationFormValues = z.infer<typeof assetStorageLocationSchema>;

export const assetStatusSchema = z.object({
  ma: z.string().min(1, { message: i18n.t('thietLapTaiSan.trangThai.validation.maRequired') }),
  ten: z.string().min(1, { message: i18n.t('thietLapTaiSan.trangThai.validation.tenRequired') }),
  thu_tu: z.coerce.number().min(0, { message: i18n.t('thietLapTaiSan.trangThai.validation.thuTuMin') }),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.enum([TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG]),
});

export type AssetStatusFormValues = z.infer<typeof assetStatusSchema>;

export const assetGroupSchema = z.object({
  ma: z.string().min(1, { message: i18n.t('thietLapTaiSan.nhomTaiSan.validation.maRequired') }),
  ten: z.string().min(1, { message: i18n.t('thietLapTaiSan.nhomTaiSan.validation.tenRequired') }),
  thu_tu: z.coerce.number().min(0, { message: i18n.t('thietLapTaiSan.nhomTaiSan.validation.thuTuMin') }),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.enum([TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG]),
  phuong_phap_khau_hao: z.enum(['duong_thang', 'so_du_giam_dan'], {
    message: i18n.t('thietLapTaiSan.nhomTaiSan.validation.phuongPhapRequired'),
  }),
  ty_le_khau_hao: z.coerce.number().min(0).max(100).optional().nullable(),
  so_nam_su_dung: z.coerce.number().min(1).optional().nullable(),
});

export type AssetGroupFormValues = z.infer<typeof assetGroupSchema>;
