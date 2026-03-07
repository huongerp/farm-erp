import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const hopDongSchema = z
  .object({
    id_ung_vien: z.string().min(1, { message: i18n.t('hopDong.validation.ungVienRequired') }),
    loai_hop_dong: z.enum(['thu-viec', 'chinh-thuc']),
    ngay_bat_dau: z.string().min(1, { message: i18n.t('hopDong.validation.ngayBatDauRequired') }),
    ngay_ket_thuc: z.string().optional().nullable(),
    bac_luong: z.string().optional().nullable(),
    muc_luong: z.string().optional().nullable(),
    ngay_vao_lam: z.string().optional().nullable(),
    co_che_khac: z.string().optional().nullable(),
    ghi_chu: z.string().optional().nullable(),
    ghi_chu_khac: z.string().optional().nullable(),
  })
  .refine(
    (data) =>
      data.loai_hop_dong !== 'thu-viec' ||
      (typeof data.ngay_ket_thuc === 'string' && data.ngay_ket_thuc.trim().length > 0),
    { message: i18n.t('hopDong.validation.ngayKetThucRequired'), path: ['ngay_ket_thuc'] }
  )
  .refine(
    (data) =>
      (typeof data.bac_luong === 'string' && data.bac_luong.trim().length > 0),
    { message: i18n.t('hopDong.validation.bacLuongRequired'), path: ['bac_luong'] }
  )
  .refine(
    (data) =>
      (typeof data.muc_luong === 'string' && data.muc_luong.trim().length > 0),
    { message: i18n.t('hopDong.validation.mucLuongRequired'), path: ['muc_luong'] }
  );

export type HopDongFormValues = z.infer<typeof hopDongSchema>;

export const phieuThanhLySchema = z.object({
  id_hop_dong: z.string().min(1),
  ngay_thanh_ly: z.string().min(1, { message: i18n.t('hopDong.phieuThanhLy.validation.ngayRequired') }),
  ly_do: z.string().min(1, { message: i18n.t('hopDong.phieuThanhLy.validation.lyDoRequired') }),
  ghi_chu: z.string().optional().nullable(),
});

export type PhieuThanhLyFormValues = z.infer<typeof phieuThanhLySchema>;
