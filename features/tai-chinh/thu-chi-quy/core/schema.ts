import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { coerceSoTien } from './money';

const optionalNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((v) => coerceSoTien(v))
  .nullable();

export const thuChiQuySchema = z
  .object({
    ngay: z.string().min(1, { message: i18n.t('thuChiQuy.validation.ngayRequired') }),
    id_chi_nhanh: z.string().min(1, { message: i18n.t('thuChiQuy.validation.chiNhanhRequired') }),
    loai: z.enum(['thu', 'chi']),
    so_tien: z
      .union([z.number(), z.string()])
      .transform((v) => coerceSoTien(v) ?? 0)
      .refine((v) => v > 0, { message: i18n.t('thuChiQuy.validation.soTienMin') }),
    so_luong: optionalNumber.optional(),
    don_gia: optionalNumber.optional(),
    id_hang_muc: z.string().min(1, { message: i18n.t('thuChiQuy.validation.hangMucRequired') }),
    dien_giai: z.string().min(1, { message: i18n.t('thuChiQuy.validation.dienGiaiRequired') }),
    ghi_chu: z.string().optional().nullable(),
    loai_chung_tu: z.enum(['don_dat_hang', 'de_xuat_mua_hang', 'chi_phi_tai_san']).nullable().optional(),
    id_chung_tu: z.string().nullable().optional(),
    so_chung_tu: z.string().nullable().optional(),
  })
  // DB có CHECK cùng ràng buộc — chặn sớm ở form cho báo lỗi dễ hiểu.
  .refine(
    (v) => (v.loai_chung_tu == null) === (v.id_chung_tu == null || v.id_chung_tu === ''),
    { message: i18n.t('thuChiQuy.validation.chungTuPair'), path: ['id_chung_tu'] }
  );

export type ThuChiQuyFormValues = z.infer<typeof thuChiQuySchema>;
