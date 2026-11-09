import { z } from 'zod';
import i18n from '../../../../lib/i18n';

/** Form tạo phiếu checklist công đoạn. Đổi trạng thái CHỈ qua RPC rpc_cl_*. */
export const taoPhieuSchema = z.object({
  id_mau: z.string().min(1, { message: i18n.t('checklistBanGiao.validation.chonMau') }),
  ngay: z.string().min(1, { message: i18n.t('checklistBanGiao.validation.chonNgay') }),
  ca: z.string().trim().max(100).optional().or(z.literal('')),
  khu_vuc: z.string().trim().max(200).optional().or(z.literal('')),
  day_chuyen: z.string().trim().max(200).optional().or(z.literal('')),
  id_chi_nhanh: z.string().optional().or(z.literal('')),
  ghi_chu: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type TaoPhieuFormValues = z.infer<typeof taoPhieuSchema>;
