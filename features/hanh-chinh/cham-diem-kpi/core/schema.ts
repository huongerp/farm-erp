import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const chamDiemKpiItemSchema = z.object({
  id_chi_so: z.string().min(1),
  ty_trong: z.coerce.number().min(0).max(100),
  /** Loại chỉ số: xuôi (cao tốt) / ngược (thấp tốt) */
  loai: z.enum(['xuoi', 'nguoc']).optional(),
  muc_tieu: z.coerce.number().optional(),
  thuc_dat: z.coerce.number().optional(),
  /** Điểm 0-100: tính từ mục tiêu/thực đạt hoặc nhập tay */
  diem: z.coerce.number().min(0).max(100),
});

export const chamDiemKpiFormSchema = z.object({
  id_nhan_vien: z.string().min(1, { message: i18n.t('chamDiemKpi.validation.employeeRequired') }),
  nam: z.coerce.number().min(2000).max(2100),
  thang: z.coerce.number().min(1).max(12),
  items: z.array(chamDiemKpiItemSchema).min(1, { message: i18n.t('chamDiemKpi.validation.itemsRequired') }),
});

export type ChamDiemKpiItemFormValues = z.infer<typeof chamDiemKpiItemSchema>;
export type ChamDiemKpiFormValues = z.infer<typeof chamDiemKpiFormSchema>;
