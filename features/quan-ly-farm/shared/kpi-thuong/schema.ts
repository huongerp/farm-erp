import { z } from 'zod';

export const kpiThuongRowSchema = z.object({
  ten_hang_muc: z.string().max(2000),
  don_vi_tinh: z.string().max(500).optional().nullable(),
  muc_tieu: z.string().max(4000).optional().nullable(),
  thuc_te: z.string().max(4000).optional().nullable(),
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

export const kpiThuongArraySchema = z.array(kpiThuongRowSchema).max(200).default([]);
