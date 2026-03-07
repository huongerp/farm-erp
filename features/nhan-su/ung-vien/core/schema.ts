import { z } from 'zod';
import i18n from '../../../../lib/i18n';

const taiLieuItemSchema = z.object({
  id: z.string(),
  ten_file: z.string(),
  loai: z.string().optional(),
  link: z.string().optional(),
});

export const ungVienSchema = z.object({
  ho_ten: z.string().min(1, { message: i18n.t('ungVien.validation.hoTenRequired') }),
  email: z.string().min(1, { message: i18n.t('ungVien.validation.emailRequired') }).email(i18n.t('ungVien.validation.emailInvalid')),
  so_dien_thoai: z.string(),
  dia_chi: z.string().nullable(),
  ngay_sinh: z.string().nullable(),
  ghi_chu_noi_bo: z.string().nullable(),
  id_de_xuat_tuyen_dung: z.string().min(1, { message: i18n.t('ungVien.validation.viTriRequired') }),
  id_trang_thai_ung_vien: z.string().min(1, { message: i18n.t('ungVien.validation.trangThaiRequired') }),
  id_kenh_tuyen_dung: z.string().nullable(),
  ngay_phong_van_gan_nhat: z.string().nullable(),
  ket_qua_phan_hoi_gan_nhat: z.string().nullable(),
  tai_lieu: z.array(taiLieuItemSchema),
});

export type UngVienFormValues = z.infer<typeof ungVienSchema>;
