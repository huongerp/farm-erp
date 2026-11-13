import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { LOAI_MAU_CL, type TanSuatVeSinh } from './types';

/**
 * Form header mẫu checklist. Mục & hạng mục quản lý state riêng trong editor
 * (không qua react-hook-form/zod) — xem components/MucHangMucEditor.tsx.
 */
export const checklistMauFormSchema = z.object({
  ma: z.string().trim().max(100).optional().or(z.literal('')),
  ten: z.string().trim().min(1, { message: i18n.t('checklistMau.validation.tenRequired') }).max(300),
  mo_ta: z.string().trim().max(2000).optional().or(z.literal('')),
  loai: z.enum(LOAI_MAU_CL),
  ten_ben_thuc_hien: z.string().trim().max(200).optional().or(z.literal('')),
  ten_ben_kiem_tra: z.string().trim().max(200).optional().or(z.literal('')),
  chuc_vu_thuc_hien_ids: z.array(z.string()),
  chuc_vu_kiem_tra_ids: z.array(z.string()),
  co_ket_luan_van_hanh: z.boolean(),
  ghi_chu_cuoi: z.string().trim().max(4000).optional().or(z.literal('')),
  dang_dung: z.boolean(),
  thu_tu: z.coerce
    .number()
    .int({ message: i18n.t('checklistMau.validation.thuTuNguyen') })
    .min(0),
});

export type ChecklistMauFormValues = z.infer<typeof checklistMauFormSchema>;

/** Giá trị form inline của một hạng mục (không dùng zod). */
export interface HangMucFormValues {
  doi_tuong: string;
  tieu_chuan: string;
  phuong_phap: string;
  quan_trong: boolean;
  id_thiet_bi: string | null;
  tan_suat: TanSuatVeSinh | null;
  dang_dung: boolean;
}
