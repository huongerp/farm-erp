import { z } from 'zod';
import i18n from '../../../../lib/i18n';

const trangThaiEnum = z.enum(['cho_duyet', 'da_duyet', 'khong_duyet']);

export const phieuBaoTriSuaChuaSchema = z.object({
  ngay: z.string().min(1, { message: i18n.t('baoTriSuaChua.validation.ngayRequired') }),
  id_tai_san: z.string().min(1, { message: i18n.t('baoTriSuaChua.validation.assetRequired') }),
  id_hang_muc: z.string().min(1, { message: i18n.t('baoTriSuaChua.validation.hangMucRequired') }),
  mo_ta: z.string().min(1, { message: i18n.t('baoTriSuaChua.validation.moTaRequired') }),
  so_tien: z.coerce.number().min(0, { message: i18n.t('baoTriSuaChua.validation.soTienMin') }),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: trangThaiEnum.optional(),
  nguoi_duyet: z.string().optional().nullable(),
});

export type PhieuBaoTriSuaChuaFormValues = z.infer<typeof phieuBaoTriSuaChuaSchema>;
