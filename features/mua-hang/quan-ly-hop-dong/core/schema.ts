import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOP_DONG } from './constants';

/** Một dòng thanh toán (modal trong chi tiết HĐ) — trừ ghi chú, các trường đều bắt buộc */
export const hopDongChiTietLineSchema = z.object({
  ngay: z.string().trim().min(1, i18n.t('hopDong.validation.ctNgayRequired')),
  ten_dot: z.string().trim().min(1, i18n.t('hopDong.validation.ctTenDotRequired')),
  so_tien: z.coerce
    .number({ invalid_type_error: i18n.t('hopDong.validation.ctSoTienRequired') })
    .refine((n) => Number.isFinite(n), { message: i18n.t('hopDong.validation.ctSoTienRequired') })
    .refine((n) => n >= 0, { message: i18n.t('hopDong.validation.ctSoTienMin') }),
  so_cay_thuc_nhan: z.coerce
    .number({ invalid_type_error: i18n.t('hopDong.validation.ctSoCayRequired') })
    .refine((n) => Number.isFinite(n), { message: i18n.t('hopDong.validation.ctSoCayRequired') })
    .refine((n) => n >= 0, { message: i18n.t('hopDong.validation.ctSoCayMin') }),
  ghi_chu: z.string().optional().nullable(),
  id_chi_nhanh: z.string().min(1, i18n.t('hopDong.validation.ctChiNhanhRequired')),
});

export const hopDongSchema = z.object({
  ngay: z
    .string()
    .trim()
    .min(1, i18n.t('hopDong.validation.ngayRequired')),
  ma_hop_dong: z
    .string()
    .min(1, i18n.t('hopDong.validation.maRequired'))
    .max(100, i18n.t('hopDong.validation.maMax')),
  ten_hop_dong: z
    .string()
    .trim()
    .min(1, i18n.t('hopDong.validation.tenRequired'))
    .max(500, i18n.t('hopDong.validation.tenMax')),
  id_nha_cung_cap: z.string().min(1, i18n.t('hopDong.validation.nccRequired')),
  noi_dung: z.string().optional().nullable(),
  so_luong_cay: z.coerce.number().optional().nullable(),
  don_gia: z.coerce.number().optional().nullable(),
  thanh_tien: z.coerce.number().optional().nullable(),
  trang_thai: z.enum(TRANG_THAI_HOP_DONG as unknown as [string, ...string[]], {
    message: i18n.t('hopDong.validation.trangThaiInvalid'),
  }),
  ghi_chu: z.string().optional().nullable(),
});

export type HopDongChiTietLineValues = z.infer<typeof hopDongChiTietLineSchema>;
export type HopDongFormValues = z.infer<typeof hopDongSchema>;
