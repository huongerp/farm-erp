import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const dotKiemKeKhoSchema = z.object({
  ma_dot: z.string().min(1, { message: i18n.t('kiemKeKho.validation.maDotRequired') }),
  ten_dot: z.string().min(1, { message: i18n.t('kiemKeKho.validation.tenDotRequired') }),
  ngay_bat_dau: z.string().min(1, { message: i18n.t('kiemKeKho.validation.ngayBatDauRequired') }),
  ngay_ket_thuc: z.string().min(1, { message: i18n.t('kiemKeKho.validation.ngayKetThucRequired') }),
  id_nguoi_phu_trach: z.string().min(1, { message: i18n.t('kiemKeKho.validation.nguoiPhuTrachRequired') }),
  id_kho: z.array(z.string()).min(1, { message: i18n.t('kiemKeKho.validation.idKhoRequired') }),
  ghi_chu: z.string().nullable().optional(),
}).refine(
  (data) => !data.ngay_bat_dau || !data.ngay_ket_thuc || data.ngay_bat_dau <= data.ngay_ket_thuc,
  { message: i18n.t('kiemKeKho.validation.ngayKetThucAfterBatDau'), path: ['ngay_ket_thuc'] }
);

export type DotKiemKeKhoFormValues = z.infer<typeof dotKiemKeKhoSchema>;

export const capNhatKetQuaKiemKeKhoSchema = z.object({
  so_luong_thuc_te: z.number().min(0, { message: i18n.t('kiemKeKho.validation.soLuongNonNegative') }),
  ghi_chu_dong: z.string().nullable().optional(),
});

export type CapNhatKetQuaKiemKeKhoFormValues = z.infer<typeof capNhatKetQuaKiemKeKhoSchema>;
