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

const kpiRowSchema = z.object({
  ten_hang_muc: z.string().max(2000),
  don_vi_tinh: z.string().max(500).optional().nullable(),
  muc_tieu: z.string().max(4000).optional().nullable(),
  thuc_te: z.string().max(4000).optional().nullable(),
  /** Thang 0–100 (85 = 85%); để trống → null */
  phan_tram: z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return null;
      const n = typeof v === 'number' ? v : Number(v);
      return Number.isFinite(n) ? n : null;
    },
    z.union([z.number().finite(), z.null()]).optional()
  ),
  danh_gia: z.string().max(500).optional().nullable(),
  tien_thuong: z.coerce.number().finite().default(0),
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
  kpi: z.array(kpiRowSchema).max(200).default([]),
});

export type BaoCaoNhanCongFormValues = z.infer<typeof baoCaoNhanCongFormSchema>;
