import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const nhaCungCapSchema = z.object({
  ma_ncc: z
    .string()
    .min(1, i18n.t('nhaCungCapMuaHang.validation.codeRequired'))
    .max(50, i18n.t('nhaCungCapMuaHang.validation.codeMax'))
    .regex(/^[A-Za-z0-9_-]+$/, i18n.t('nhaCungCapMuaHang.validation.codeFormat')),
  ten_ncc: z
    .string()
    .min(1, i18n.t('nhaCungCapMuaHang.validation.nameRequired'))
    .max(255, i18n.t('nhaCungCapMuaHang.validation.nameMax')),
  id_nhom: z.string().optional().nullable(),
  dia_chi: z.string().optional(),
  dien_thoai: z.string().optional(),
  email: z.string().optional(),
  mo_ta: z.string().optional(),
  tag_ids: z.array(z.string()).default([]),
  trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1, {
    message: i18n.t('nhaCungCapMuaHang.validation.statusInvalid'),
  }),
  thu_tu: z.coerce.number().min(0, i18n.t('nhaCungCapMuaHang.validation.thuTuMin')),
});

export type NhaCungCapFormValues = z.infer<typeof nhaCungCapSchema>;
