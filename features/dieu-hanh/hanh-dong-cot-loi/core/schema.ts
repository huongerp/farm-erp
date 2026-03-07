import { z } from 'zod';

const bscDimensionSchema = z.enum([
  'tai_chinh',
  'khach_hang',
  'quy_trinh',
  'hoc_hoi_phat_trien',
]);

export const hanhDongCotLoiFormSchema = z.object({
  id_chien_luoc: z.string().min(1),
  ma: z.string().optional().nullable(),
  ten: z.string().min(1),
  mo_ta: z.string().optional().nullable(),
  bsc_dimension: bscDimensionSchema,
  nhom_hanh_dong: z.string().min(1),
  ty_trong: z.number().min(0).max(100),
  thu_tu: z.number().int().min(0).optional().nullable(),
});

export type HanhDongCotLoiFormValues = z.infer<typeof hanhDongCotLoiFormSchema>;

export const thietLapNhomHanhDongFormSchema = z.object({
  ma: z.string().min(1),
  ten: z.string().min(1),
  mo_ta: z.string().optional().nullable(),
  thu_tu: z.number().int().min(0),
});

export type ThietLapNhomHanhDongFormValues = z.infer<
  typeof thietLapNhomHanhDongFormSchema
>;
