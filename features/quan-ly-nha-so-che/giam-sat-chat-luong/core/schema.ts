import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { LOAI_TIEU_CHI } from './types';

/** Ô số để trống → null; còn lại ép số (Input type=number trả chuỗi). */
const soTuyChon = z.preprocess(
  (v) => (v === '' || v == null ? null : Number(v)),
  z.number({ message: i18n.t('giamSatChatLuong.validation.soKhongHopLe') }).nullable()
);

export const giamSatChatLuongFormSchema = z
  .object({
    id_chi_nhanh: z.string().min(1, { message: i18n.t('giamSatChatLuong.validation.farmRequired') }),
    ngay: z.string().min(1, { message: i18n.t('giamSatChatLuong.validation.ngayRequired') }),
    id_hang_hoa: z.string().min(1, { message: i18n.t('giamSatChatLuong.validation.thanhPhamRequired') }),
    ma_cay_hang: z.string().trim().max(100).optional().or(z.literal('')),
    so_thung_cay: z.coerce
      .number()
      .int({ message: i18n.t('giamSatChatLuong.validation.soNguyen') })
      .min(1, { message: i18n.t('giamSatChatLuong.validation.soThungCayMin') })
      .max(1000),
    so_thung_mau: z.coerce
      .number()
      .int({ message: i18n.t('giamSatChatLuong.validation.soNguyen') })
      .min(1, { message: i18n.t('giamSatChatLuong.validation.soThungMauMin') })
      .max(100, { message: i18n.t('giamSatChatLuong.validation.soThungMauMax') }),
    ghi_chu: z.string().max(2000).optional().or(z.literal('')),
  })
  .refine((v) => v.so_thung_mau <= v.so_thung_cay, {
    message: i18n.t('giamSatChatLuong.validation.mauVuotCay'),
    path: ['so_thung_mau'],
  });

export type GiamSatChatLuongFormValues = z.infer<typeof giamSatChatLuongFormSchema>;

export const tieuChiFormSchema = z
  .object({
    ten: z.string().trim().min(1, { message: i18n.t('giamSatChatLuong.validation.tenTieuChiRequired') }).max(100),
    loai: z.enum(LOAI_TIEU_CHI),
    don_vi: z.string().trim().max(20).optional().or(z.literal('')),
    nguong_min: soTuyChon,
    nguong_max: soTuyChon,
  })
  .refine((v) => v.nguong_min == null || v.nguong_max == null || v.nguong_min <= v.nguong_max, {
    message: i18n.t('giamSatChatLuong.validation.minLonHonMax'),
    path: ['nguong_max'],
  });

export type TieuChiFormValues = z.infer<typeof tieuChiFormSchema>;
