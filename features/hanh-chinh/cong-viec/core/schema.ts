import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { CONG_VIEC_TRANG_THAI, CONG_VIEC_UU_TIEN } from './constants';

const TRANG_THAI_VALUES = [...CONG_VIEC_TRANG_THAI] as [string, ...string[]];
const UU_TIEN_VALUES = [...CONG_VIEC_UU_TIEN] as [string, ...string[]];

export const congViecSchema = z.object({
  tieu_de: z.string().min(1, { message: i18n.t('congViec.validation.tieuDeRequired') }),
  mo_ta: z.string().optional().nullable(),
  id_cha: z.number().nullable(),
  trach_nhiem: z
    .union([z.number().min(1, { message: i18n.t('congViec.validation.trachNhiemRequired') }), z.null()])
    .refine((v) => v != null && v >= 1, { message: i18n.t('congViec.validation.trachNhiemRequired') }),
  nguoi_ho_tro: z.array(z.number()),
  uu_tien: z.enum(UU_TIEN_VALUES, { message: i18n.t('congViec.validation.uuTienRequired') }),
  trang_thai: z.enum(TRANG_THAI_VALUES, { message: i18n.t('congViec.validation.trangThaiRequired') }),
});

export type CongViecFormValues = z.infer<typeof congViecSchema>;

/** Form thêm một bình luận vào trao_doi */
export const binhLuanSchema = z.object({
  noi_dung: z.string().min(1, { message: i18n.t('congViec.binhLuan.validation.noiDungRequired') }),
});

export type BinhLuanFormValues = z.infer<typeof binhLuanSchema>;
