import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const khoaDaoTaoSchema = z.object({
  ma: z.string().min(1, { message: i18n.t('khoaDaoTao.validation.maRequired') }),
  ten: z.string().min(1, { message: i18n.t('khoaDaoTao.validation.tenRequired') }),
  id_loai_khoa_hoc: z.string().min(1, { message: i18n.t('khoaDaoTao.validation.loaiKhoaHocRequired') }),
  mo_ta: z.string().optional().nullable(),
  thoi_luong: z.coerce.number().min(0, { message: i18n.t('khoaDaoTao.validation.thoiLuongMin') }),
  ngay_bat_dau: z.string().min(1, { message: i18n.t('khoaDaoTao.validation.ngayBatDauRequired') }),
  ngay_ket_thuc: z.string().min(1, { message: i18n.t('khoaDaoTao.validation.ngayKetThucRequired') }),
  dia_diem: z.string().optional().nullable(),
  link_online: z.string().optional().nullable(),
  trang_thai: z.coerce.number().min(0).max(5),
  so_luong_toi_da: z.coerce.number().min(0).optional().nullable(),
  giang_vien: z.string().optional().nullable(),
  ghi_chu: z.string().optional().nullable(),
  /** Chức vụ được xem (phân quyền) */
  id_chuc_vu_xem: z.array(z.string()).optional(),
});

export type KhoaDaoTaoFormValues = z.infer<typeof khoaDaoTaoSchema>;
