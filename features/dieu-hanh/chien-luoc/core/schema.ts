import { z } from 'zod';

const loaiTowsSchema = z.enum(['SO', 'ST', 'WO', 'WT']);
const trangThaiDuyetSchema = z.enum(['cho_duyet', 'da_duyet', 'khong_duyet']);
const trangThaiTrienKhaiSchema = z.enum([
  'chua_bat_dau',
  'dang_trien_khai',
  'tam_ngung',
  'hoan_thanh',
  'huy',
]);

export const chienLuocFormSchema = z.object({
  nam: z.number().min(2000).max(2100),
  ma: z.string().optional().nullable(),
  ten: z.string().min(1),
  mo_ta: z.string().optional().nullable(),
  loai_tows: loaiTowsSchema,
  nhom_chien_luoc: z.string().min(1),
  id_swot_analysis: z.string().optional().nullable(),
  id_strengths: z.array(z.string()).default([]),
  id_weaknesses: z.array(z.string()).default([]),
  id_opportunities: z.array(z.string()).default([]),
  id_threats: z.array(z.string()).default([]),
  trang_thai_duyet: trangThaiDuyetSchema.default('cho_duyet'),
  trang_thai_trien_khai: trangThaiTrienKhaiSchema.default('chua_bat_dau'),
  id_nguoi_phu_trach: z.string().optional().nullable(),
  ngay_bat_dau: z.string().optional().nullable(),
  ngay_ket_thuc: z.string().optional().nullable(),
  uu_tien: z.number().int().min(1).max(5).optional().nullable(),
  ghi_chu: z.string().optional().nullable(),
});

export type ChienLuocFormValues = z.infer<typeof chienLuocFormSchema>;

const nhomLoaiChienLuocSchema = z.enum(['tows', 'ansoff', 'corporate', 'integration']);

export const thietLapLoaiChienLuocFormSchema = z.object({
  nhom: nhomLoaiChienLuocSchema,
  ma: z.string().min(1),
  ten: z.string().min(1),
  mo_ta: z.string().optional().nullable(),
  cau_chien_luoc_mau: z.string().optional().nullable(),
  thu_tu: z.number().int().min(0),
});

export type ThietLapLoaiChienLuocFormValues = z.infer<typeof thietLapLoaiChienLuocFormSchema>;
