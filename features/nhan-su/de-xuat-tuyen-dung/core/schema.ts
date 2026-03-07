import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const deXuatTuyenDungSchema = z.object({
  id_chuc_vu: z.string().min(1, { message: i18n.t('deXuatTuyenDung.validation.idChucVuRequired') }),
  ma_de_xuat: z.string().min(1, { message: i18n.t('deXuatTuyenDung.validation.maDeXuatRequired') }),
  tieu_de: z.string().nullable(),
  mo_ta: z.string().min(1, { message: i18n.t('deXuatTuyenDung.validation.moTaRequired') }),
  yeu_cau: z.string().min(1, { message: i18n.t('deXuatTuyenDung.validation.yeuCauRequired') }),
  link_tuyen: z.string().min(1, { message: i18n.t('deXuatTuyenDung.validation.linkTuyenRequired') }),
  so_luong: z.coerce.number().min(1, { message: i18n.t('deXuatTuyenDung.validation.soLuongMin') }),
  so_luong_da_tuyen: z.coerce.number().min(0, { message: i18n.t('deXuatTuyenDung.validation.soLuongDaTuyenMin') }),
  han_nop: z.string().nullable(),
  trang_thai: z.coerce.number().refine((val) => val >= 0 && val <= 3, {
    message: i18n.t('deXuatTuyenDung.validation.statusInvalid'),
  }),
});

export type DeXuatTuyenDungFormValues = z.infer<typeof deXuatTuyenDungSchema>;
