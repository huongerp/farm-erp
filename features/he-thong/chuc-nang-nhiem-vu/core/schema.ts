import { z } from 'zod';
import i18n from '../../../../lib/i18n';

const t = (key: string) => i18n.t(key);

/** Sứ mệnh phòng ban */
export const missionSchema = z.object({
  id_phong_ban: z.string().min(1, t('chucNangNhiemVu.validation.departmentRequired')),
  noi_dung: z.string().min(1, t('chucNangNhiemVu.validation.missionContentRequired')).max(2000, t('chucNangNhiemVu.validation.missionContentMax')),
  thu_tu: z.coerce.number().int().min(0),
  trang_thai: z.coerce.number().refine((v) => v === 0 || v === 1, { message: t('chucNangNhiemVu.validation.statusInvalid') }),
});
export type MissionFormValues = z.infer<typeof missionSchema>;

/** Chức năng phòng ban */
export const functionSchema = z.object({
  id_phong_ban: z.string().min(1, t('chucNangNhiemVu.validation.departmentRequired')),
  ma_chuc_nang: z.string().min(1, t('chucNangNhiemVu.validation.codeRequired')).max(50).regex(/^[A-Z0-9_]+$/, t('chucNangNhiemVu.validation.codeFormat')),
  ten_chuc_nang: z.string().min(2, t('chucNangNhiemVu.validation.nameMin')).max(255),
  mo_ta: z.string().max(500).optional().nullable(),
  thu_tu: z.coerce.number().int().min(0),
  trang_thai: z.coerce.number().refine((v) => v === 0 || v === 1, { message: t('chucNangNhiemVu.validation.statusInvalid') }),
});
export type FunctionFormValues = z.infer<typeof functionSchema>;

/** Giá trị enum nhóm chịu trách nhiệm */
const responsibleGroupEnum = z.enum([
  'technical', 'sales', 'hr', 'finance', 'admin', 'operations', 'other',
]);

/** Nhiệm vụ */
export const taskSchema = z.object({
  id_chuc_nang: z.string().min(1, t('chucNangNhiemVu.validation.functionRequired')),
  ma_nhiem_vu: z.string().min(1, t('chucNangNhiemVu.validation.codeRequired')).max(50).regex(/^[A-Z0-9_]+$/, t('chucNangNhiemVu.validation.codeFormat')),
  ten_nhiem_vu: z.string().min(2, t('chucNangNhiemVu.validation.nameMin')).max(255),
  mo_ta: z.string().max(500).optional().nullable(),
  nhom_chiu_trach_nhiem: responsibleGroupEnum.nullable().optional(),
  thu_tu: z.coerce.number().int().min(0),
  trang_thai: z.coerce.number().refine((v) => v === 0 || v === 1, { message: t('chucNangNhiemVu.validation.statusInvalid') }),
});
export type TaskFormValues = z.infer<typeof taskSchema>;

/** Chỉ số KPI */
export const kpiCycleSchema = z.enum(['month', 'quarter', 'year']);
export const kpiIndicatorSchema = z.object({
  id_nhiem_vu: z.string().min(1, t('chucNangNhiemVu.validation.taskRequired')),
  ten_chi_so: z.string().min(2, t('chucNangNhiemVu.validation.kpiNameMin')).max(255),
  don_vi: z.string().min(1, t('chucNangNhiemVu.validation.unitRequired')).max(50),
  chi_tieu_nguong: z.string().min(1, t('chucNangNhiemVu.validation.targetRequired')).max(255),
  chu_ky_danh_gia: kpiCycleSchema,
  thu_tu: z.coerce.number().int().min(0),
  trang_thai: z.coerce.number().refine((v) => v === 0 || v === 1, { message: t('chucNangNhiemVu.validation.statusInvalid') }),
});
export type KpiIndicatorFormValues = z.infer<typeof kpiIndicatorSchema>;
