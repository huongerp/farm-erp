import { z } from 'zod';
import i18n from '../../../../../lib/i18n';

const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;

export const chuongSchema = z.object({
  ten: z.string().min(1, { message: i18n.t('thietLapKhoa.chuong.validation.tenRequired') }),
  mo_ta: z.string().optional().nullable(),
});

export type ChuongFormValues = z.infer<typeof chuongSchema>;

export const taiLieuFileSchema = z.object({
  id: z.string().optional(),
  ten_file: z.string().min(1),
  link: z.string().optional(),
});

export const baiHocSchema = z.object({
  ten: z.string().min(1, { message: i18n.t('thietLapKhoa.baiHoc.validation.tenRequired') }),
  mo_ta: z.string().optional().nullable(),
  video_youtube_url: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.trim() === '' || youtubeUrlRegex.test(val.trim()), {
      message: i18n.t('thietLapKhoa.baiHoc.validation.youtubeInvalid'),
    }),
  tai_lieu_links: z.array(z.string()).optional(),
  tai_lieu_files: z.array(taiLieuFileSchema).optional(),
});

export type BaiHocFormValues = z.infer<typeof baiHocSchema>;

export const baiTestSchema = z.object({
  ten: z.string().min(1, { message: i18n.t('thietLapKhoa.baiTest.validation.tenRequired') }),
  mo_ta: z.string().optional().nullable(),
});

export type BaiTestFormValues = z.infer<typeof baiTestSchema>;

export const dapAnOptionSchema = z.object({
  label: z.string(), // empty allowed; superRefine requires ≥2 with content
  dung: z.boolean().optional(),
});

export const cauHoiSchema = z
  .object({
    noi_dung: z.string().min(1, { message: i18n.t('thietLapKhoa.cauHoi.validation.noiDungRequired') }),
    loai: z.enum(['trac_nghiem', 'tu_luan']),
    dap_an_options: z.array(dapAnOptionSchema).optional(),
    goi_y_cham: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.loai !== 'trac_nghiem') return;
    const options = data.dap_an_options ?? [];
    const withContent = options.filter((o) => (o.label ?? '').trim().length > 0);
    const hasCorrect = options.some((o) => o.dung === true);
    if (!hasCorrect || withContent.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dap_an_options'],
        message: i18n.t('thietLapKhoa.cauHoi.validation.requireOneCorrect'),
      });
    }
  });

export type CauHoiFormValues = z.infer<typeof cauHoiSchema>;
