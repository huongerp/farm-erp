import { z } from 'zod';
import i18n from '../../../../lib/i18n';

/** Một dòng chi tiết đề xuất (form cho phép dòng trống; filter khi submit). */
export const deXuatChiPhiChiTietFormItemSchema = z.object({
  id_danh_muc: z.string(),
  so_tien: z.coerce.number().min(0),
  noi_dung: z.string().optional(),
});

export const deXuatChiPhiSchema = z
  .object({
    so_phieu: z
      .string()
      .min(1, i18n.t('deXuatChiPhi.validation.codeRequired'))
      .max(50, i18n.t('deXuatChiPhi.validation.codeMax')),
    ngay: z.string().min(1, i18n.t('deXuatChiPhi.validation.dateRequired')),
    loai: z.enum(['thu', 'chi'], {
      required_error: i18n.t('deXuatChiPhi.validation.loaiRequired'),
    }),
    id_tai_khoan: z.string().optional().nullable(),
    id_nguoi_de_xuat: z.string().min(1, i18n.t('deXuatChiPhi.validation.requesterRequired')),
    trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1 || val === 2, {
      message: i18n.t('deXuatChiPhi.validation.statusInvalid'),
    }),
    ghi_chu: z.string().optional().nullable(),
    chi_tiet: z.array(deXuatChiPhiChiTietFormItemSchema).default([]),
  })
  .refine(
    (data) => {
      const hasItem = (data.chi_tiet ?? []).some(
        (row) => row.id_danh_muc && Number(row.so_tien ?? 0) > 0
      );
      return hasItem;
    },
    { message: i18n.t('deXuatChiPhi.validation.atLeastOneItem'), path: ['chi_tiet'] }
  );

export type DeXuatChiPhiChiTietFormItem = z.infer<typeof deXuatChiPhiChiTietFormItemSchema>;
export type DeXuatChiPhiFormValues = z.infer<typeof deXuatChiPhiSchema>;
