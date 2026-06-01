import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_KIEM_KE } from './constants';

export const phieuKiemKeChiTietFormItemSchema = z.object({
  id_hang_hoa: z.string(),
  so_luong_so: z.coerce.number().min(0),
  so_luong_thuc_te: z.preprocess((v) => (v === '' || v === undefined ? null : Number(v)), z.number().nullable().optional()),
  don_vi_tinh: z.string().optional(),
  ghi_chu: z.string().optional(),
});

export const phieuKiemKeSchema = z.object({
  so_phieu: z.string().min(1, i18n.t('phieuKiemKe.validation.codeRequired')).max(50, i18n.t('phieuKiemKe.validation.codeMax')),
  ngay: z.string().min(1, i18n.t('phieuKiemKe.validation.dateRequired')),
  id_kho: z.string().min(1, i18n.t('phieuKiemKe.validation.warehouseRequired')),
  id_nguoi_thuc_hien: z.string().min(1, i18n.t('phieuKiemKe.validation.performerRequired')),
  id_nguoi_duyet: z.string().optional().nullable(),
  ghi_chu: z.string().optional(),
  trang_thai: z.enum(TRANG_THAI_KIEM_KE, { message: i18n.t('phieuKiemKe.validation.statusInvalid') }),
  chi_tiet: z.array(phieuKiemKeChiTietFormItemSchema).default([]),
}).refine(
  (data) => {
    const hasItem = (data.chi_tiet ?? []).some((row) => row.id_hang_hoa?.trim());
    return hasItem;
  },
  { message: i18n.t('phieuKiemKe.validation.atLeastOneItem'), path: ['chi_tiet'] }
);

export type PhieuKiemKeChiTietFormItem = z.infer<typeof phieuKiemKeChiTietFormItemSchema>;
export type PhieuKiemKeFormValues = z.infer<typeof phieuKiemKeSchema>;
