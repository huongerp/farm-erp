import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const taiKhoanSchema = z
  .object({
    ten_tai_khoan: z
      .string()
      .min(1, i18n.t('taiKhoan.validation.nameRequired'))
      .max(255, i18n.t('taiKhoan.validation.nameMax')),
    loai_tai_khoan: z.enum(['tien_mat', 'ngan_hang'], {
      required_error: i18n.t('taiKhoan.validation.loaiRequired'),
    }),
    so_tai_khoan: z.string().max(50).optional().or(z.literal('')),
    ngan_hang: z.string().max(255).optional().or(z.literal('')),
    ma_ngan_hang: z.string().max(20).optional().or(z.literal('')),
    chu_tai_khoan: z.string().max(255).optional().or(z.literal('')),
    trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1, {
      message: i18n.t('taiKhoan.validation.statusInvalid'),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.loai_tai_khoan === 'ngan_hang') {
      if (!data.ma_ngan_hang?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: i18n.t('taiKhoan.validation.bankRequired'),
          path: ['ma_ngan_hang'],
        });
      }
      if (!data.so_tai_khoan?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: i18n.t('taiKhoan.validation.accountNumberRequired'),
          path: ['so_tai_khoan'],
        });
      }
      if (!data.chu_tai_khoan?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: i18n.t('taiKhoan.validation.accountHolderRequired'),
          path: ['chu_tai_khoan'],
        });
      }
    }
  });

export type TaiKhoanFormValues = z.infer<typeof taiKhoanSchema>;
