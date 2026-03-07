import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const dotKiemKeSchema = z.object({
  ma_dot: z.string().min(1, { message: i18n.t('kiemKeTaiSan.validation.maDotRequired') }),
  ten_dot: z.string().min(1, { message: i18n.t('kiemKeTaiSan.validation.tenDotRequired') }),
  ngay_bat_dau: z.string().min(1, { message: i18n.t('kiemKeTaiSan.validation.ngayBatDauRequired') }),
  ngay_ket_thuc: z.string().min(1, { message: i18n.t('kiemKeTaiSan.validation.ngayKetThucRequired') }),
  id_nguoi_phu_trach: z.string().min(1, { message: i18n.t('kiemKeTaiSan.validation.nguoiPhuTrachRequired') }),
  id_nhom: z.array(z.string()),
  id_noi_luu: z.array(z.string()),
  ghi_chu: z.string().nullable().optional(),
}).refine(
  (data) => !data.ngay_bat_dau || !data.ngay_ket_thuc || data.ngay_bat_dau <= data.ngay_ket_thuc,
  { message: i18n.t('kiemKeTaiSan.validation.ngayKetThucAfterBatDau'), path: ['ngay_ket_thuc'] }
);

export type DotKiemKeFormValues = z.infer<typeof dotKiemKeSchema>;

export const capNhatKetQuaSchema = z.object({
  id_noi_luu_thuc_te: z.string().nullable(),
  id_nguoi_giu_thuc_te: z.string().nullable(),
  id_trang_thai_thuc_te: z.string().nullable(),
  ghi_chu_dong: z.string().nullable().optional(),
});

export type CapNhatKetQuaFormValues = z.infer<typeof capNhatKetQuaSchema>;
