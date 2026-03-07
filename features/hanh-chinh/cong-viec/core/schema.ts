import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { CONG_VIEC_TRANG_THAI, CONG_VIEC_UU_TIEN } from './constants';

const TRANG_THAI_VALUES = [...CONG_VIEC_TRANG_THAI] as [string, ...string[]];
const UU_TIEN_VALUES = [...CONG_VIEC_UU_TIEN] as [string, ...string[]];

export const congViecSchema = z.object({
  ma_cong_viec: z.string().min(1, { message: i18n.t('congViec.validation.maRequired') }),
  tieu_de: z.string().min(1, { message: i18n.t('congViec.validation.tieuDeRequired') }),
  mo_ta: z.string().optional().nullable(),
  id_du_an: z.string().nullable(),
  id_cha: z.string().nullable(),
  danh_sach_nguoi_thuc_hien: z.array(z.string()),
  uu_tien: z.enum(UU_TIEN_VALUES, {
    errorMap: () => ({ message: i18n.t('congViec.validation.uuTienRequired') }),
  }),
  trang_thai: z.enum(TRANG_THAI_VALUES, {
    errorMap: () => ({ message: i18n.t('congViec.validation.trangThaiRequired') }),
  }),
  ngay_het_han: z.string().min(1, { message: i18n.t('congViec.validation.ngayHetHanRequired') }),
  phan_tram_hoan_thanh: z.coerce.number().min(0).max(100),
  id_mau_cong_viec: z.string().nullable(),
});

export type CongViecFormValues = z.infer<typeof congViecSchema>;

const urlOrEmpty = z.string().refine(
  (val) => {
    const t = val.trim();
    return t === '' || /^https?:\/\/[^\s]+$/.test(t);
  },
  { message: i18n.t('congViec.baoCaoKetQua.validation.linkInvalid') }
);

export const baoCaoKetQuaSchema = z.object({
  noi_dung: z.string().min(1, { message: i18n.t('congViec.baoCaoKetQua.validation.noiDungRequired') }),
  links: z.array(urlOrEmpty).optional(),
  file_dinh_kem: z.string().optional(),
});

export type BaoCaoKetQuaFormValues = z.infer<typeof baoCaoKetQuaSchema>;

export const binhLuanSchema = z.object({
  noi_dung: z.string().min(1, { message: i18n.t('congViec.binhLuan.validation.noiDungRequired') }),
});

export type BinhLuanFormValues = z.infer<typeof binhLuanSchema>;
