import { z } from 'zod';

export const coreValueSchema = z.object({
  id: z.string().optional(),
  ten: z.string().min(1, 'common.required'),
  mo_ta: z.string(),
  thu_tu: z.number().min(0),
  mo_dich: z.string().optional(),
  hanh_vi_nen_lam: z.array(z.string()).optional(),
  hanh_vi_khong_nen_lam: z.array(z.string()).optional(),
});

export const missionVisionSchema = z.object({
  su_menh: z.string(),
  tam_nhin: z.string(),
});

export const dinhViFormSchema = z.object({
  phan_khuc_hien_tai: z.string().optional(),
  phan_khuc_tuong_lai: z.string().optional(),
  khach_hang_hien_tai: z.string().optional(),
  khach_hang_tuong_lai: z.string().optional(),
  san_pham_hien_tai: z.string().optional(),
  san_pham_tuong_lai: z.string().optional(),
});
export type DinhViFormValues = z.infer<typeof dinhViFormSchema>;

export const valuesFormSchema = z.object({
  gia_tri: z.array(coreValueSchema),
});

/** Form sửa tổng: Sứ mệnh + Tầm nhìn + Giá trị cốt lõi */
export const editAllFormSchema = missionVisionSchema.merge(valuesFormSchema);
export type EditAllFormValues = z.infer<typeof editAllFormSchema>;

export const chiTieuQuyMoSchema = z.object({
  id: z.string().optional(),
  ten: z.string().min(1, 'common.required'),
  don_vi: z.string(),
  thu_tu: z.number().min(0),
  loai_bieu_do: z.enum(['bar_vertical', 'bar_horizontal']).optional(),
});

export const giaTriQuyMoTheoNamSchema = z.object({
  id_chi_tieu: z.string().min(1),
  nam: z.number().min(2000, 'suMenhTamNhin.yearMin'),
  gia_tri: z.number(),
});

export const phanKhucThiPhanSchema = z.object({
  id: z.string().optional(),
  ten: z.string().min(1, 'common.required'),
  thu_tu: z.number().min(0),
  loai_bieu_do: z.enum(['pie', 'donut']).optional(),
});

export const tamNhinThiPhanItemSchema = z.object({
  nam: z.number(),
  id_phan_khuc: z.string().min(1),
  gia_tri: z.number().min(0).max(100),
});

export const tamNhinThiPhanFormSchema = z.object({
  items: z.array(tamNhinThiPhanItemSchema),
});

export type MissionVisionFormValues = z.infer<typeof missionVisionSchema>;
export type CoreValueFormItem = z.infer<typeof coreValueSchema>;
export type ValuesFormValues = z.infer<typeof valuesFormSchema>;
export type ChiTieuQuyMoFormValues = z.infer<typeof chiTieuQuyMoSchema>;
export type GiaTriQuyMoTheoNamFormValues = z.infer<typeof giaTriQuyMoTheoNamSchema>;
export type PhanKhucThiPhanFormValues = z.infer<typeof phanKhucThiPhanSchema>;
export type TamNhinThiPhanFormValues = z.infer<typeof tamNhinThiPhanFormSchema>;
