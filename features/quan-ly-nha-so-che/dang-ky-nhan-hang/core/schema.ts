import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { hinhAnhUrlsSchema } from '../../shared/hinh-anh-url-schema';

const optText = z.string().trim().max(500).optional().or(z.literal(''));
const optGio = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: i18n.t('dangKyNhanHang.validation.gioInvalid') })
  .optional()
  .or(z.literal(''));

/** Form đăng ký — các trường giống phiếu giấy. Chỉ bắt buộc chi nhánh, ngày và số xe hoặc số cont. */
export const dangKyNhanHangFormSchema = z
  .object({
    id_chi_nhanh: z.string().min(1, { message: i18n.t('dangKyNhanHang.validation.chiNhanhRequired') }),
    ngay_dang_ky: z.string().min(1, { message: i18n.t('dangKyNhanHang.validation.ngayRequired') }),
    khach_hang: optText,
    loai_hang_hoa: optText,
    so_xe: optText,
    so_cont: optText,
    ten_tai_xe: optText,
    sdt_tai_xe: optText,
    gio_dang_ky_tu: optGio,
    gio_dang_ky_den: optGio,
    ghi_chu: z.string().max(2000).optional().or(z.literal('')),
    hinh_anh_urls: hinhAnhUrlsSchema,
  })
  .refine((v) => Boolean(v.so_xe?.trim() || v.so_cont?.trim()), {
    message: i18n.t('dangKyNhanHang.validation.xeHoacContRequired'),
    path: ['so_xe'],
  });

export type DangKyNhanHangFormValues = z.infer<typeof dangKyNhanHangFormSchema>;

/** Dialog check in / check out: giờ (mặc định bây giờ, sửa được) + ảnh + ghi chú đều tuỳ chọn. */
export const checkInOutFormSchema = z.object({
  thoi_diem: z.string().min(1, { message: i18n.t('dangKyNhanHang.validation.thoiDiemRequired') }),
  hinh_anh_urls: hinhAnhUrlsSchema,
  ghi_chu: z.string().max(2000).optional().or(z.literal('')),
});

export type CheckInOutFormValues = z.infer<typeof checkInOutFormSchema>;
