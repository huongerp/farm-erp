import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { hinhAnhUrlsSchema } from '../../shared/hinh-anh-url-schema';
import { GIOI_TINH, MUC_DICH_THAM_QUAN, PHUONG_TIEN } from './types';

const optText = z.string().trim().max(500).optional().or(z.literal(''));

export const khachFormSchema = z.object({
  ho_ten: z.string().max(200),
  gioi_tinh: z.enum(GIOI_TINH).or(z.literal('')),
  quoc_tich: optText,
  so_dien_thoai: optText,
  nguoi_gioi_thieu: optText,
  khu_vuc_tham_quan: optText,
  don_vi_lam_viec: optText,
});

export type KhachFormValues = z.infer<typeof khachFormSchema>;

const coThongTin = (k: KhachFormValues) =>
  [k.gioi_tinh, k.quoc_tich, k.so_dien_thoai, k.nguoi_gioi_thieu, k.khu_vuc_tham_quan, k.don_vi_lam_viec].some(
    (v) => (v ?? '').trim() !== ''
  );

/** Form phiếu tham quan — theo đúng phiếu giấy. `bat_dau` / `ket_thuc` là giá trị `datetime-local`. */
export const dangKyThamQuanFormSchema = z
  .object({
    id_chi_nhanh: z.string().min(1, { message: i18n.t('dangKyThamQuan.validation.chiNhanhRequired') }),
    ngay_dang_ky: z.string().min(1, { message: i18n.t('dangKyThamQuan.validation.ngayRequired') }),
    bat_dau: z.string().min(1, { message: i18n.t('dangKyThamQuan.validation.batDauRequired') }),
    ket_thuc: z.string().optional().or(z.literal('')),
    muc_dich: z.array(z.enum(MUC_DICH_THAM_QUAN)),
    muc_dich_khac: optText,
    phuong_tien: z.enum(PHUONG_TIEN).or(z.literal('')),
    nguoi_dai_dien: optText,
    id_nguoi_tiep_don: z.string().optional().or(z.literal('')),
    ghi_chu: z.string().max(2000).optional().or(z.literal('')),
    hinh_anh_urls: hinhAnhUrlsSchema,
    khach: z.array(khachFormSchema),
  })
  .superRefine((v, ctx) => {
    if (!v.khach.some((k) => k.ho_ten.trim())) {
      ctx.addIssue({ code: 'custom', path: ['khach'], message: i18n.t('dangKyThamQuan.validation.khachRequired') });
    }
    v.khach.forEach((k, i) => {
      if (!k.ho_ten.trim() && coThongTin(k)) {
        ctx.addIssue({ code: 'custom', path: ['khach', i, 'ho_ten'], message: i18n.t('dangKyThamQuan.validation.hoTenRequired') });
      }
    });
    if (v.ket_thuc && v.bat_dau && v.ket_thuc < v.bat_dau) {
      ctx.addIssue({ code: 'custom', path: ['ket_thuc'], message: i18n.t('dangKyThamQuan.validation.ketThucTruocBatDau') });
    }
    if (v.muc_dich.includes('khac') && !(v.muc_dich_khac ?? '').trim()) {
      ctx.addIssue({ code: 'custom', path: ['muc_dich_khac'], message: i18n.t('dangKyThamQuan.validation.mucDichKhacRequired') });
    }
  });

export type DangKyThamQuanFormValues = z.infer<typeof dangKyThamQuanFormSchema>;
