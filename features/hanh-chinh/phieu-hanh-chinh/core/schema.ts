import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { ADMIN_FORM_SHIFTS } from './constants';
import { ADMIN_FORM_TYPES } from '../../thiet-lap-cong-luong/core/constants';
import { ADMIN_FORM_SESSIONS, kiemTraKhoang, laLoaiTheoKhoang, type LoiKhoang } from './khoang-nghi';

const THONG_BAO_LOI_KHOANG: Record<LoiKhoang, string> = {
  ngay_khong_hop_le: 'adminForm.validation.rangeInvalidDate',
  den_truoc_tu: 'adminForm.validation.rangeReversed',
};

/**
 * Loại nghỉ / công tác nhập theo khoảng (ngay → den_ngay + buổi hai đầu);
 * các loại còn lại nhập 1 ngày + ca, khoảng được suy ra từ ca lúc lưu.
 */
export const adminFormSchema = z
  .object({
    loai_phieu: z
      .union([z.enum(ADMIN_FORM_TYPES), z.literal('')])
      .refine((v) => v !== '', { message: i18n.t('adminForm.validation.typeRequired') }),
    ca: z.enum(ADMIN_FORM_SHIFTS, {
      message: i18n.t('adminForm.validation.shiftRequired'),
    }),
    ngay: z.string().min(1, { message: i18n.t('adminForm.validation.dateRequired') }),
    den_ngay: z.string(),
    tu_buoi: z.enum(ADMIN_FORM_SESSIONS),
    den_buoi: z.enum(ADMIN_FORM_SESSIONS),
    ly_do: z
      .string()
      .min(5, { message: i18n.t('adminForm.validation.reasonMin') })
      .max(500, { message: i18n.t('adminForm.validation.reasonMax') }),
  })
  .superRefine((v, ctx) => {
    if (!laLoaiTheoKhoang(v.loai_phieu)) return;
    if (!v.den_ngay) {
      ctx.addIssue({ code: 'custom', path: ['den_ngay'], message: i18n.t('adminForm.validation.dateRequired') });
      return;
    }
    const loi = kiemTraKhoang({ tu_ngay: v.ngay, tu_buoi: v.tu_buoi, den_ngay: v.den_ngay, den_buoi: v.den_buoi });
    if (loi) ctx.addIssue({ code: 'custom', path: ['den_ngay'], message: i18n.t(THONG_BAO_LOI_KHOANG[loi]) });
  });

export type AdminFormValues = z.infer<typeof adminFormSchema>;
