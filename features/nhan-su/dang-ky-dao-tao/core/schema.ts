import { z } from 'zod';
import i18n from '../../../../lib/i18n';

/** Form tự đăng ký: chọn khóa (id_khoa_hoc). id_nhan_vien lấy từ user. */
export const dangKyTuDangKySchema = z.object({
  id_khoa_hoc: z.string().min(1, { message: i18n.t('dangKyDaoTao.validation.khoaRequired') }),
});

export type DangKyTuDangKyFormValues = z.infer<typeof dangKyTuDangKySchema>;

/** Form giao khóa: chọn khóa + nhân viên. id_nguoi_giao lấy từ user. */
export const giaoKhoaSchema = z.object({
  id_khoa_hoc: z.string().min(1, { message: i18n.t('dangKyDaoTao.validation.khoaRequired') }),
  id_nhan_vien: z.string().min(1, { message: i18n.t('dangKyDaoTao.validation.nhanVienRequired') }),
});

export type GiaoKhoaFormValues = z.infer<typeof giaoKhoaSchema>;
