import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const thuGuiUngVienSchema = z
  .object({
    id_ung_vien: z.string().min(1, { message: i18n.t('thuGuiUngVien.validation.ungVienRequired') }),
    loai_thu: z.union([z.enum(['tu-choi', 'moi-nhan-viec']), z.literal('')]).optional(),
    ghi_chu: z.string().optional().nullable(),
    ngay_vao_lam: z.string().optional().nullable(),
    bac_luong: z.string().optional().nullable(),
    muc_luong: z.string().optional().nullable(),
    co_che_khac: z.string().optional().nullable(),
    ghi_chu_khac: z.string().optional().nullable(),
  })
  .refine(
    (data) => data.loai_thu === 'tu-choi' || data.loai_thu === 'moi-nhan-viec',
    { message: i18n.t('thuGuiUngVien.validation.loaiThuRequired'), path: ['loai_thu'] }
  )
  .refine(
    (data) =>
      data.loai_thu !== 'moi-nhan-viec' ||
      (typeof data.bac_luong === 'string' && data.bac_luong.trim().length > 0),
    { message: i18n.t('thuGuiUngVien.validation.bacLuongRequired'), path: ['bac_luong'] }
  )
  .refine(
    (data) =>
      data.loai_thu !== 'moi-nhan-viec' ||
      (typeof data.muc_luong === 'string' && data.muc_luong.trim().length > 0),
    { message: i18n.t('thuGuiUngVien.validation.mucLuongRequired'), path: ['muc_luong'] }
  );

export type ThuGuiUngVienFormValues = z.infer<typeof thuGuiUngVienSchema>;
