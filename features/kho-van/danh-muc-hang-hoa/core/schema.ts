import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const danhMucHangHoaSchema = z.object({
  ma_danh_muc: z
    .string()
    .min(1, i18n.t('danhMucHangHoa.validation.codeRequired'))
    .max(50, i18n.t('danhMucHangHoa.validation.codeMax'))
    .regex(/^[A-Z0-9_-]+$/, i18n.t('danhMucHangHoa.validation.codeFormat')),
  ten_danh_muc: z
    .string()
    .min(1, i18n.t('danhMucHangHoa.validation.nameRequired'))
    .max(255, i18n.t('danhMucHangHoa.validation.nameMax')),
  id_cha: z.string().optional().nullable(),
  thu_tu: z.coerce.number().min(1, i18n.t('danhMucHangHoa.validation.thuTuMin')),
  mo_ta: z.string().optional(),
  trang_thai: z.enum(['Đang hoạt động', 'Ngừng hoạt động'], {
    message: i18n.t('danhMucHangHoa.validation.statusInvalid'),
  }),
});

export type DanhMucHangHoaFormValues = z.infer<typeof danhMucHangHoaSchema>;
