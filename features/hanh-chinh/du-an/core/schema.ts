import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const duAnSchema = z.object({
  ma_du_an: z.string().min(1, { message: i18n.t('duAn.validation.maRequired') }),
  ten_du_an: z.string().min(1, { message: i18n.t('duAn.validation.tenRequired') }),
  id_phong_ban: z.array(z.string()).min(1, { message: i18n.t('duAn.validation.phongBanRequired') }),
  ngay_bat_dau: z.string().min(1, { message: i18n.t('duAn.validation.ngayBatDauRequired') }),
  ngay_ket_thuc: z.string().min(1, { message: i18n.t('duAn.validation.ngayKetThucRequired') }),
  muc_tieu: z.string().optional().nullable(),
  mo_ta: z.string().optional().nullable(),
  trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1, {
    message: i18n.t('duAn.validation.statusInvalid'),
  }),
}).refine(
  (data) => !data.ngay_bat_dau || !data.ngay_ket_thuc || data.ngay_ket_thuc >= data.ngay_bat_dau,
  { message: i18n.t('duAn.validation.ngayKetThucSauBatDau'), path: ['ngay_ket_thuc'] }
);

export type DuAnFormValues = z.infer<typeof duAnSchema>;
