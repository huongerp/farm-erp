import { z } from 'zod';

const trangThaiSchema = z.enum(['nhap', 'da_gui', 'da_danh_gia']);

export const baoCaoKetQuaFormSchema = z.object({
  id_tieu_chi: z.string().min(1),
  id_phong_ban: z.string().min(1),
  ky_nam: z.number().int().min(2000).max(2100),
  ky_quy: z.number().int().min(1).max(4).optional().nullable(),
  ky_thang: z.number().int().min(1).max(12).optional().nullable(),
  gia_tri_thuc_te: z.number(),
  trang_thai: trangThaiSchema.optional(),
  ghi_chu: z.string().optional().nullable(),
});

export type BaoCaoKetQuaFormValues = z.infer<typeof baoCaoKetQuaFormSchema>;
