import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const dotKiemKePTSchema = z
  .object({
    ma_dot: z.string().min(1, { message: i18n.t('kiemKeKhoPT.validation.maDotRequired') }),
    ten_dot: z.string().min(1, { message: i18n.t('kiemKeKhoPT.validation.tenDotRequired') }),
    ngay_bat_dau: z.string().min(1, { message: i18n.t('kiemKeKhoPT.validation.ngayBatDauRequired') }),
    ngay_ket_thuc: z.string().min(1, { message: i18n.t('kiemKeKhoPT.validation.ngayKetThucRequired') }),
    id_nguoi_phu_trach: z.string().min(1, { message: i18n.t('kiemKeKhoPT.validation.nguoiPhuTrachRequired') }),
    id_kho: z.array(z.string()).min(1, { message: i18n.t('kiemKeKhoPT.validation.idKhoRequired') }),
    ghi_chu: z.string().nullable().optional(),
  })
  .refine(
    (data) => !data.ngay_bat_dau || !data.ngay_ket_thuc || data.ngay_bat_dau <= data.ngay_ket_thuc,
    { message: i18n.t('kiemKeKhoPT.validation.ngayKetThucAfterBatDau'), path: ['ngay_ket_thuc'] }
  );

export type DotKiemKePTFormValues = z.infer<typeof dotKiemKePTSchema>;

export const capNhatKetQuaKiemKePTSchema = z.object({
  so_luong_thuc_te: z.number().min(0, { message: i18n.t('kiemKeKhoPT.validation.soLuongNonNegative') }),
  ghi_chu_dong: z.string().nullable().optional(),
});

export type CapNhatKetQuaKiemKePTFormValues = z.infer<typeof capNhatKetQuaKiemKePTSchema>;
