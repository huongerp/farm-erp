import { z } from 'zod';
import { LOAI_CHUYEN_CODES, type LoaiChuyen } from './types';
import i18n from '../../../../lib/i18n';

const reqMsg = (key: string) => i18n.t(key);

const chiTietRowSchema = z.object({
  loai_chuyen: z.enum(LOAI_CHUYEN_CODES as unknown as [LoaiChuyen, ...LoaiChuyen[]]),
  sl_cong_ngay: z.coerce.number().min(0).default(0),
  sl_cong_nua: z.coerce.number().min(0).default(0),
  sl_tang_ca: z.coerce.number().min(0).default(0),
  so_gio_tc: z.coerce.number().min(0).default(0),
  ghi_chu: z.string().max(8000).optional().nullable(),
});

export const baoCaoNhanCongFormSchema = z.object({
  ngay: z.string().min(1, 'required'),
  id_chi_nhanh: z.preprocess(
    (v) => (v == null || v === '' ? '' : String(v).trim()),
    z.string().min(1, reqMsg('baoCaoNhanCong.validation.branchRequired'))
  ),
  ten_chi_nhanh: z.string().optional().nullable(),
  ghi_chu: z.string().max(8000).optional().nullable(),
  /** URL ảnh (https), từ Cloudinary */
  hinh_anh_urls: z.array(z.string().url()).max(20).default([]),
  chi_tiet: z.array(chiTietRowSchema).length(LOAI_CHUYEN_CODES.length),
});

export type BaoCaoNhanCongFormValues = z.infer<typeof baoCaoNhanCongFormSchema>;
