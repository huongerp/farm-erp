import { z } from 'zod';
import { LOAI_DOI_THU } from './constants';
import i18n from '../../../../lib/i18n';

const loaiDoiThuSchema = z.enum(LOAI_DOI_THU);

export const doiThuFormSchema = z.object({
  ten_doi_thu: z
    .string()
    .min(1, i18n.t('phanTichDoiThu.validation.tenRequired'))
    .max(255, i18n.t('phanTichDoiThu.validation.tenMax')),
  logo: z.string().optional().nullable(),
  phan_loai: loaiDoiThuSchema,
  diem_manh_nhat: z.string().optional().nullable(),
  website: z.union([z.string().url(), z.literal('')]).optional(),
  fanpage: z.union([z.string().url(), z.literal('')]).optional(),
  ghi_chu_nhan_dang: z.string().optional().nullable(),
  ten_cong_ty: z.string().optional().nullable(),
  mst: z.string().optional().nullable(),
  dia_chi: z.string().optional().nullable(),
  hotline: z.string().optional().nullable(),
  youtube: z.union([z.string().url(), z.literal('')]).optional(),
  facebook: z.union([z.string().url(), z.literal('')]).optional(),
  quy_mo: z.string().optional().nullable(),
  nam_thanh_lap: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  diem_manh: z.array(z.string()).optional().nullable(),
  diem_yeu: z.array(z.string()).optional().nullable(),
  phan_khuc: z.string().optional().nullable(),
  san_pham: z.string().optional().nullable(),
  linh_vuc_kinh_doanh: z.string().optional().nullable(),
  thi_truong_muc_tieu: z.string().optional().nullable(),
  so_nhan_vien: z.string().optional().nullable(),
  von_dieu_le: z.string().optional().nullable(),
  thi_phan: z.string().optional().nullable(),
  nguon_goc: z.string().optional().nullable(),
  nam_hoat_dong: z.string().optional().nullable(),
  dinh_vi: z.string().optional().nullable(),
  cach_thuc_hoat_dong: z.string().optional().nullable(),
  kenh_phan_phoi: z.string().optional().nullable(),
  chien_luoc_gia: z.string().optional().nullable(),
  marketing_truyen_thong: z.string().optional().nullable(),
  the_manh: z.string().optional().nullable(),
  tiktok: z.union([z.string().url(), z.literal('')]).optional(),
  link_khac: z.string().optional().nullable(),
  ghi_chu_khac: z.string().optional().nullable(),
});

export type DoiThuFormValues = z.infer<typeof doiThuFormSchema>;

export const nhatKyFormSchema = z.object({
  noi_dung: z.string().min(1, i18n.t('phanTichDoiThu.validation.noiDungRequired')),
  ngay: z.string().optional(),
});

export type NhatKyFormValues = z.infer<typeof nhatKyFormSchema>;

export const battlecardDongSchema = z.object({
  id: z.string(),
  tinh_nang_dich_vu: z.string(),
  giai_phap_minh: z.string(),
  giai_phap_doi_thu: z.string(),
});

const kichBanXuLyItemSchema = z.object({
  id: z.string(),
  noi_dung: z.string(),
});

export const battlecardFormSchema = z.object({
  so_sanh: z.array(battlecardDongSchema),
  diem_yeu_chi_mang: z.array(z.string()),
  kich_ban_xu_ly: z.array(kichBanXuLyItemSchema),
});

export type BattlecardFormValues = z.infer<typeof battlecardFormSchema>;
