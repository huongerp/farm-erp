import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const taiSanSchema = z.object({
  ma_tai_san: z.string().min(1, { message: i18n.t('danhSachTaiSan.validation.maRequired') }),
  ten_tai_san: z.string().min(1, { message: i18n.t('danhSachTaiSan.validation.tenRequired') }),
  id_nhom: z.string().min(1, { message: i18n.t('danhSachTaiSan.validation.nhomRequired') }),
  id_noi_luu: z.string().min(1, { message: i18n.t('danhSachTaiSan.validation.noiLuuRequired') }),
  id_trang_thai: z.string().min(1, { message: i18n.t('danhSachTaiSan.validation.trangThaiRequired') }),
  id_nhan_vien_dang_giu: z.string().optional().nullable(),
  ngay_nhap: z.string().min(1, { message: i18n.t('danhSachTaiSan.validation.ngayNhapRequired') }),
  nguyen_gia: z.coerce.number().min(0).optional().nullable(),
  /** Ngày bắt đầu trích khấu hao (YYYY-MM-DD); để trống = ngay_nhap */
  ngay_bat_dau_trich_khau_hao: z.string().optional().nullable(),
  /** URL ảnh hoặc data URL (base64) từ upload/kéo thả/dán */
  hinh_anh: z.string().optional().nullable(),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1, {
    message: i18n.t('danhSachTaiSan.validation.statusInvalid'),
  }),
});

export type TaiSanFormValues = z.infer<typeof taiSanSchema>;
