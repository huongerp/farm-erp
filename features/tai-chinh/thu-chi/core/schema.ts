import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const thuChiSchema = z
  .object({
    ma_giao_dich: z.string().min(1, i18n.t('thuChi.validation.maGiaoDichRequired')),
    ngay_giao_dich: z.string().min(1, i18n.t('thuChi.validation.ngayRequired')),
    so_tien: z.coerce.number().min(0.01, i18n.t('thuChi.validation.soTienMin')),
    loai: z.enum(['thu', 'chi', 'chuyen_quy']),
    id_tai_khoan: z.string().min(1, i18n.t('thuChi.validation.taiKhoanRequired')),
    id_danh_muc: z.string().optional(),
    noi_dung: z.string().min(1, i18n.t('thuChi.validation.noiDungRequired')),
    id_nhan_vien_thuc_hien: z.string().optional(),
    trang_thai: z.string(),
    id_tai_khoan_dich: z.string().optional(),
    phi_giao_dich: z.coerce.number().min(0).optional(),
    id_de_xuat_chi_phi: z.string().optional(),
    ghi_chu: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.loai === 'chuyen_quy') return !!data.id_tai_khoan_dich;
      return true;
    },
    { message: i18n.t('thuChi.validation.taiKhoanDichRequired'), path: ['id_tai_khoan_dich'] }
  );

export type ThuChiFormValues = z.infer<typeof thuChiSchema>;
