import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const lichPhongVanSchema = z.object({
  id_ung_vien: z.string().min(1, { message: i18n.t('lichPhongVan.validation.ungVienRequired') }),
  so_vong: z.coerce.number().min(1, { message: i18n.t('lichPhongVan.validation.soVongMin') }),
  ngay: z.string().min(1, { message: i18n.t('lichPhongVan.validation.ngayRequired') }),
  gio: z.string().min(1, { message: i18n.t('lichPhongVan.validation.gioRequired') }),
  hinh_thuc: z.enum(['online', 'offline'], {
    required_error: i18n.t('lichPhongVan.validation.hinhThucRequired'),
  }),
  dia_diem: z.string().min(1, { message: i18n.t('lichPhongVan.validation.diaDiemRequired') }),
  trang_thai: z.coerce.number().refine((val) => val >= 0 && val <= 3, {
    message: i18n.t('lichPhongVan.validation.trangThaiInvalid'),
  }),
  trang_thai_danh_gia: z.coerce.number().min(0).max(2).nullable().optional(),
  danh_gia_diem_so: z.string().nullable(),
  danh_gia_nhan_xet: z.string().nullable(),
  ket_qua: z.string().nullable(),
  ghi_chu: z.string().nullable(),
  danh_gia_chi_tiet: z.string().nullable().optional(),
});

export type LichPhongVanFormValues = z.infer<typeof lichPhongVanSchema>;
