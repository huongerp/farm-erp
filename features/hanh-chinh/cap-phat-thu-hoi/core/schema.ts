import { z } from 'zod';
import i18n from '../../../../lib/i18n';

const loaiPhieuEnum = z.enum([
  'cap_phat',
  'thu_hoi',
  'luan_chuyen_vi_tri',
  'luan_chuyen_nguoi',
  'luan_chuyen_ca_hai',
]);

export const phieuCapPhatThuHoiSchema = z.object({
  loai_phieu: loaiPhieuEnum,
  id_tai_san: z.string().min(1, { message: i18n.t('capPhatThuHoi.validation.assetRequired') }),
  id_noi_luu_truoc: z.string().min(1),
  id_noi_luu_sau: z.string().min(1, { message: i18n.t('capPhatThuHoi.validation.locationRequired') }),
  id_nguoi_giu_truoc: z.string().optional().nullable(),
  id_nguoi_giu_sau: z.string().optional().nullable(),
  ngay_thuc_hien: z.string().min(1),
  id_nguoi_thuc_hien: z.string().min(1),
  ghi_chu: z.string().optional().nullable(),
}).refine(
  (data) => {
    if (data.loai_phieu === 'cap_phat') return !!data.id_nguoi_giu_sau;
    if (data.loai_phieu === 'thu_hoi') return true;
    if (data.loai_phieu === 'luan_chuyen_nguoi' || data.loai_phieu === 'luan_chuyen_ca_hai') return !!data.id_nguoi_giu_sau;
    return true;
  },
  { message: i18n.t('capPhatThuHoi.validation.holderRequired'), path: ['id_nguoi_giu_sau'] }
);

export type PhieuCapPhatThuHoiFormValues = z.infer<typeof phieuCapPhatThuHoiSchema>;
