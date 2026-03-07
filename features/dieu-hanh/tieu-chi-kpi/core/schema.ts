import { z } from 'zod';

const loaiDoLuongSchema = z.enum(['xuoi', 'nguoc']);
const tanSuatSchema = z.enum(['thang', 'quy', 'nam']);

export const tieuChiKpiFormSchema = z.object({
  id_hanh_dong: z.string().min(1),
  ma: z.string().optional().nullable(),
  ten: z.string().min(1),
  mo_ta: z.string().optional().nullable(),
  don_vi_tinh: z.string().min(1),
  loai: loaiDoLuongSchema,
  gia_tri_muc_tieu: z.number(),
  gia_tri_toi_thieu: z.number().optional().nullable(),
  cach_tinh_diem: z.string().min(1),
  tan_suat: tanSuatSchema,
  ty_trong: z.number().min(0).max(100),
  thu_tu: z.number().int().min(0).optional().nullable(),
  nguon_du_lieu: z.string().optional().nullable(),
  ghi_chu: z.string().optional().nullable(),
});

export type TieuChiKpiFormValues = z.infer<typeof tieuChiKpiFormSchema>;

export const thietLapDonViTinhFormSchema = z.object({
  ma: z.string().min(1),
  ten: z.string().min(1),
  ky_hieu: z.string().optional().nullable(),
  thu_tu: z.number().int().min(0),
});

export type ThietLapDonViTinhFormValues = z.infer<
  typeof thietLapDonViTinhFormSchema
>;

export const thietLapCachTinhDiemFormSchema = z.object({
  ma: z.string().min(1),
  ten: z.string().min(1),
  mo_ta: z.string().optional().nullable(),
  thu_tu: z.number().int().min(0),
});

export type ThietLapCachTinhDiemFormValues = z.infer<
  typeof thietLapCachTinhDiemFormSchema
>;
