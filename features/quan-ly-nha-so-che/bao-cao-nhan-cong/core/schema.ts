import { z } from 'zod';
import { LOAI_CHUYEN_CODES, type LoaiChuyen } from './types';
import i18n from '../../../../lib/i18n';
import { hinhAnhUrlsSchema } from '../../shared/hinh-anh-url-schema';
import { findSubSlGioPairIssues, normalizeChiTietSubFormByLoai } from './ct-sub';

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

const chiTietRowSchema = z.object({
  loai_chuyen: z.enum(LOAI_CHUYEN_CODES as unknown as [LoaiChuyen, ...LoaiChuyen[]]),
  sl_cong_ngay: z.coerce.number().min(0).default(0),
  sl_cong_nua: z.coerce.number().min(0).default(0),
  sl_tang_ca: z.coerce.number().min(0).default(0),
  so_gio_tc: z.coerce.number().min(0).default(0),
  ghi_chu: z.string().max(8000).optional().nullable(),
  sub: chiTietSubSchema,
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
    });
  });

export type BaoCaoNhanCongFormValues = z.infer<typeof baoCaoNhanCongFormSchema>;
export type CtSubRowFormValues = z.infer<typeof ctSubRowSchema>;
export type ChiTietSubFormValues = z.infer<typeof chiTietSubSchema>;
