import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { UU_TIEN_OPTIONS, SO_NGAY_CANH_BAO_MIN, SO_NGAY_CANH_BAO_MAX } from './constants';

export const cauHinhCongViecSchema = z.object({
  so_ngay_canh_bao_sap_han: z.coerce
    .number()
    .min(SO_NGAY_CANH_BAO_MIN, { message: i18n.t('thietLapCongViec.canhBao.validation.soNgayMin') })
    .max(SO_NGAY_CANH_BAO_MAX, { message: i18n.t('thietLapCongViec.canhBao.validation.soNgayMax') }),
  bat_canh_bao_qua_han: z.boolean(),
});

export type CauHinhCongViecFormValues = z.infer<typeof cauHinhCongViecSchema>;

const UU_TIEN_VALUES = [...UU_TIEN_OPTIONS] as [string, ...string[]];

export const mauCongViecSchema = z.object({
  ten_mau: z.string().min(1, { message: i18n.t('thietLapCongViec.mau.validation.tenRequired') }),
  tieu_de_mac_dinh: z.string().min(1, { message: i18n.t('thietLapCongViec.mau.validation.tieuDeRequired') }),
  mo_ta_mac_dinh: z.string().optional().nullable(),
  uu_tien_mac_dinh: z.enum(UU_TIEN_VALUES, {
    errorMap: () => ({ message: i18n.t('thietLapCongViec.mau.validation.uuTienRequired') }),
  }),
  trang_thai_mac_dinh: z.coerce.number().refine((val) => val === 0 || val === 1, {
    message: i18n.t('thietLapCongViec.mau.validation.statusInvalid'),
  }),
});

export type MauCongViecFormValues = z.infer<typeof mauCongViecSchema>;
