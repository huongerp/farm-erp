import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const loaiDoiTacSchema = z.enum(['nha_cung_cap', 'khach_hang']);

export const doiTacSchema = z.object({
  ma_ncc: z
    .string()
    .min(1, i18n.t('doiTac.validation.codeRequired'))
    .max(50, i18n.t('doiTac.validation.codeMax'))
    .regex(/^[A-Z0-9_-]+$/, i18n.t('doiTac.validation.codeFormat')),
  ten_ncc: z
    .string()
    .min(1, i18n.t('doiTac.validation.nameRequired'))
    .max(255, i18n.t('doiTac.validation.nameMax')),
  loai_doi_tac: loaiDoiTacSchema,
  id_nhom: z.string().min(1, i18n.t('doiTac.validation.idNhomRequired')),
  dia_chi: z.string().optional(),
  dien_thoai: z.string().optional(),
  email: z.string().optional(),
  mo_ta: z.string().optional(),
  ngan_hang_bin: z.string().optional(),
  so_tai_khoan: z.string().optional(),
  chu_tai_khoan: z.string().optional(),
  tag_ids: z.array(z.string()).default([]),
  trang_thai: z.enum(['Đang hoạt động', 'Ngừng hoạt động'], {
    message: i18n.t('doiTac.validation.statusInvalid'),
  }),
  thu_tu: z.coerce.number().min(1, i18n.t('doiTac.validation.thuTuMin')),
});

export type DoiTacFormValues = z.infer<typeof doiTacSchema>;
