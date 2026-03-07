import { z } from 'zod';
import i18n from '../../../../lib/i18n';

const HUONG_VALUES = ['noi_bo', 'den', 'di'] as const;

/** Format rules: mã số tối đa 50 ký tự, trích yếu tối đa 500 ký tự, trim khoảng trắng đầu cuối */
export const taiLieuSchema = z.object({
  ma_so: z.string().trim().max(50).optional().nullable(),
  huong: z.enum(HUONG_VALUES, { errorMap: () => ({ message: i18n.t('taiLieu.validation.huongRequired') }) }),
  id_loai: z.string().min(1, { message: i18n.t('taiLieu.validation.loaiRequired') }),
  id_nhom_tai_lieu: z.string().optional(),
  id_trang_thai: z.string().min(1, { message: i18n.t('taiLieu.validation.trangThaiRequired') }),
  trich_yeu: z.string().trim().min(1, { message: i18n.t('taiLieu.validation.trichYeuRequired') }).max(500, { message: i18n.t('taiLieu.validation.trichYeuMaxLength') }),
  so_den: z.string().trim().optional(),
  ngay_den: z.string().optional(),
  noi_gui: z.string().optional(),
  so_di: z.string().optional(),
  ngay_ky: z.string().optional(),
  noi_nhan: z.string().optional(),
  id_phong_ban: z.string().optional(),
  ghi_chu: z.string().optional(),
});

export type TaiLieuFormValues = z.infer<typeof taiLieuSchema>;
