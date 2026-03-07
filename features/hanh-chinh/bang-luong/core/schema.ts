import { z } from 'zod';

const CONG_TRU_LOAI = ['cong', 'tru'] as const;

export const congTruLuongItemSchema = z.object({
  loai: z.enum(CONG_TRU_LOAI),
  so_tien: z.coerce.number().min(0),
  ly_do: z.string().optional().nullable(),
});

export const bangLuongCongTruFormSchema = z.object({
  id_nhan_vien: z.string().min(1),
  nam: z.coerce.number().min(2000).max(2100),
  thang: z.coerce.number().min(1).max(12),
  items: z.array(congTruLuongItemSchema).min(0),
});

export type CongTruLuongItemFormValues = z.infer<typeof congTruLuongItemSchema>;
export type BangLuongCongTruFormValues = z.infer<typeof bangLuongCongTruFormSchema>;
