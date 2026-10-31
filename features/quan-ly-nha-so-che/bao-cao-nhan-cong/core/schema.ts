import { z } from 'zod';
import { CHAM_CONG_CODES, LOAI_CHUYEN_CODES, type ChamCong, type LoaiChuyen } from './types';
import i18n from '../../../../lib/i18n';
import { hinhAnhUrlsSchema } from '../../shared/hinh-anh-url-schema';
import { findSubSlGioPairIssues, normalizeChiTietSubFormByLoai } from './ct-sub';
import { nguoiVuotMotCong } from './danh-sach-nv';

const reqMsg = (key: string) => i18n.t(key);

const ctSubRowSchema = z.object({
  sl_cong: z.coerce.number().min(0).default(0),
  so_gio: z.coerce.number().min(0).default(0),
  ghi_chu: z.string().max(500).nullable().default(null),
});

const chiTietSubSchema = z.object({
  CN_NGAY: z.array(ctSubRowSchema).max(200).default([]),
  CN_NUA: z.array(ctSubRowSchema).max(200).default([]),
  TANG_CA: z.array(ctSubRowSchema).max(200).default([]),
});

/** Một người trong danh sách tên của chuyền (giờ ≤ 24, ràng buộc tên / giờ > 0 ở superRefine). */
const nhanVienRowSchema = z.object({
  ho_ten: z.string().max(200).default(''),
  vi_tri: z.string().max(200).nullable().default(null),
  cham_cong: z.enum(CHAM_CONG_CODES as unknown as [ChamCong, ...ChamCong[]]),
  so_gio_cong: z.coerce.number().min(0).max(24).default(0),
  so_gio_tc: z.coerce.number().min(0).max(24).default(0),
  ghi_chu: z.string().max(500).nullable().default(null),
});

const chiTietRowSchema = z.object({
  loai_chuyen: z.enum(LOAI_CHUYEN_CODES as unknown as [LoaiChuyen, ...LoaiChuyen[]]),
  sl_cong_ngay: z.coerce.number().min(0).default(0),
  sl_cong_nua: z.coerce.number().min(0).default(0),
  sl_tang_ca: z.coerce.number().min(0).default(0),
  so_gio_tc: z.coerce.number().min(0).default(0),
  ghi_chu: z.string().max(8000).optional().nullable(),
  sub: chiTietSubSchema,
  nhan_vien: z.array(nhanVienRowSchema).max(200).default([]),
});

export const baoCaoNhanCongFormSchema = z
  .object({
    ngay: z.string().min(1, 'required'),
    id_chi_nhanh: z.preprocess(
      (v) => (v == null || v === '' ? '' : String(v).trim()),
      z.string().min(1, reqMsg('baoCaoNhanCong.validation.branchRequired'))
    ),
    ten_chi_nhanh: z.string().optional().nullable(),
    ghi_chu: z.string().max(8000).optional().nullable(),
    hinh_anh_urls: hinhAnhUrlsSchema,
    chi_tiet: z.array(chiTietRowSchema).length(LOAI_CHUYEN_CODES.length),
  })
  .superRefine((data, ctx) => {
    const pairMsg = reqMsg('baoCaoNhanCong.validation.slGioPairRequired');
    data.chi_tiet.forEach((ct, chiTietIdx) => {
      const issues = findSubSlGioPairIssues(normalizeChiTietSubFormByLoai(ct.sub));
      for (const { loai, index } of issues) {
        for (const field of ['sl_cong', 'so_gio'] as const) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: pairMsg,
            path: ['chi_tiet', chiTietIdx, 'sub', loai, index, field],
          });
        }
      }
      ct.nhan_vien.forEach((nv, idx) => {
        const path = ['chi_tiet', chiTietIdx, 'nhan_vien', idx];
        if (!nv.ho_ten.trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: reqMsg('baoCaoNhanCong.validation.nvTenRequired'), path: [...path, 'ho_ten'] });
        }
        if (!(nv.so_gio_cong > 0)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: reqMsg('baoCaoNhanCong.validation.nvGioRequired'), path: [...path, 'so_gio_cong'] });
        }
      });
    });
    for (const { chiTietIdx, idx } of nguoiVuotMotCong(data.chi_tiet)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: reqMsg('baoCaoNhanCong.validation.nvVuotMotCong'),
        path: ['chi_tiet', chiTietIdx, 'nhan_vien', idx, 'ho_ten'],
      });
    }
  });

export type BaoCaoNhanCongFormValues = z.infer<typeof baoCaoNhanCongFormSchema>;
export type CtSubRowFormValues = z.infer<typeof ctSubRowSchema>;
export type ChiTietSubFormValues = z.infer<typeof chiTietSubSchema>;
export type NhanVienRowFormValues = z.infer<typeof nhanVienRowSchema>;
