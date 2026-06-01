import { z } from 'zod';
import i18n from '../../../../lib/i18n';

const DIEM_CONG_TRU_LOAI = ['cong', 'tru'] as const;

export const diemCongTruSchema = z.object({
  id_nhan_vien: z.string().min(1, { message: i18n.t('diemCongTru.validation.employeeRequired') }),
  nam: z.coerce.number().min(2000).max(2100, { message: i18n.t('diemCongTru.validation.yearInvalid') }),
  thang: z.coerce.number().min(1).max(12, { message: i18n.t('diemCongTru.validation.monthInvalid') }),
  loai: z.enum(DIEM_CONG_TRU_LOAI, { message: i18n.t('diemCongTru.validation.loaiRequired') }),
  id_hang_muc: z.string().min(1, { message: i18n.t('diemCongTru.validation.categoryRequired') }),
  diem: z.coerce.number().min(0, { message: i18n.t('diemCongTru.validation.diemMin') }),
  mo_ta: z.string().optional().nullable(),
});

export type DiemCongTruFormValues = z.infer<typeof diemCongTruSchema>;
