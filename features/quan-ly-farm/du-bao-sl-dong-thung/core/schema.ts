import { z } from 'zod';
import i18n from '../../../../lib/i18n';

const reqMsg = (key: string) => i18n.t(key);

export const duBaoSlDongThungFormSchema = z.object({
  ngay: z.string().min(1, 'required'),
  id_chi_nhanh: z.preprocess(
    (v) => (v == null || v === '' ? '' : String(v).trim()),
    z.string().min(1, reqMsg('duBaoSlDongThung.validation.branchRequired'))
  ),
  ten_chi_nhanh: z.string().optional().nullable(),
  so_buong_can_mau: z.coerce.number().int().min(0).default(0),
  tong_can_nang_mau: z.coerce.number().min(0).default(0),
  tong_buong_nhap_ke_hoach: z.coerce.number().int().min(0).default(0),
  /** Phần trăm 0–100 (UI); lưu DB = /100 */
  ty_le_thu_hoi_ke_hoach_pct: z.coerce.number().min(0).max(100).default(0),
  quy_cach_dong_thung_ke_hoach: z.coerce.number().min(0).default(0),
  tong_buong_nhap_thuc_te: z.coerce.number().int().min(0).default(0),
  ty_le_thu_hoi_thuc_te_pct: z.coerce.number().min(0).max(100).default(0),
  quy_cach_dong_thung_thuc_te: z.coerce.number().min(0).default(0),
  ghi_chu: z.string().max(8000).optional().nullable(),
});

export type DuBaoSlDongThungFormValues = z.infer<typeof duBaoSlDongThungFormSchema>;
