import { z } from 'zod';
import i18n from '../../../../lib/i18n';

const loaiPhieuEnum = z.enum([
  'cap_phat',
  'thu_hoi',
  'luan_chuyen_vi_tri',
  'luan_chuyen_nguoi',
  'luan_chuyen_ca_hai',
]);

/** Schema cho 1 dòng chi tiết (1 tài sản) */
export const phieuChiTietItemSchema = z.object({
  id_tai_san: z.string().min(1, { message: i18n.t('capPhatThuHoi.validation.assetRequired') }),
  id_noi_luu_sau: z.string().min(1, { message: i18n.t('capPhatThuHoi.validation.locationRequired') }),
  ghi_chu: z.string().optional().nullable(),
});

/** Schema cho dòng trống trong form (cho phép chưa điền) – filter khi submit */
export const phieuChiTietFormItemSchema = z.object({
  id_tai_san: z.string(),
  id_noi_luu_truoc: z.string().optional(),
  id_noi_luu_sau: z.string(),
  ghi_chu: z.string().optional().nullable(),
});

export const phieuCapPhatThuHoiSchema = z.object({
  loai_phieu: loaiPhieuEnum,
  id_nguoi_giu_truoc: z.string().optional().nullable(),
  id_nguoi_giu_sau: z.string().optional().nullable(),
  ngay_thuc_hien: z.string().min(1),
  id_nguoi_thuc_hien: z.string().min(1),
  ghi_chu: z.string().optional().nullable(),
  chi_tiet: z.array(phieuChiTietFormItemSchema).min(1, { message: i18n.t('capPhatThuHoi.validation.atLeastOneAsset') }),
}).refine(
  (data) => {
    if (data.loai_phieu === 'cap_phat') return !!data.id_nguoi_giu_sau;
    if (data.loai_phieu === 'thu_hoi') return true;
    if (data.loai_phieu === 'luan_chuyen_nguoi' || data.loai_phieu === 'luan_chuyen_ca_hai') return !!data.id_nguoi_giu_sau;
    return true;
  },
  { message: i18n.t('capPhatThuHoi.validation.holderRequired'), path: ['id_nguoi_giu_sau'] }
).refine(
  (data) => {
    const validLines = data.chi_tiet.filter((ct) => ct.id_tai_san && ct.id_noi_luu_sau);
    return validLines.length > 0;
  },
  { message: i18n.t('capPhatThuHoi.validation.atLeastOneAsset'), path: ['chi_tiet'] }
);

export type PhieuChiTietFormItem = z.infer<typeof phieuChiTietFormItemSchema>;
export type PhieuCapPhatThuHoiFormValues = z.infer<typeof phieuCapPhatThuHoiSchema>;
