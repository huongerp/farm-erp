import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI } from '../../../../lib/constants';

const optionalNumber = (schema: z.ZodType<number>, errorKey: string) =>
  z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    schema.refine((v) => Number.isFinite(v), { message: i18n.t(errorKey) }).optional()
  );

const optionalUrl = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : val),
  z.string().url(i18n.t('branch.validation.mapUrlInvalid')).optional()
);

export const branchSchema = z.object({
  ma_chi_nhanh: z.string()
    .min(2, i18n.t('branch.validation.codeMin'))
    .max(50, i18n.t('branch.validation.codeMax'))
    .regex(/^[A-Z0-9_]+$/, i18n.t('branch.validation.codeFormat')),
  ten_chi_nhanh: z.string()
    .min(3, i18n.t('branch.validation.nameMin'))
    .max(255, i18n.t('branch.validation.nameMax')),
  dia_chi: z.string()
    .min(5, i18n.t('branch.validation.addressMin'))
    .max(255, i18n.t('branch.validation.addressMax')),
  tinh_thanh: z.string()
    .min(2, i18n.t('branch.validation.provinceMin'))
    .max(120, i18n.t('branch.validation.provinceMax')),
  quan_huyen: z.string()
    .min(2, i18n.t('branch.validation.districtMin'))
    .max(120, i18n.t('branch.validation.districtMax')),
  vi_do: optionalNumber(
    z.coerce.number().min(-90, i18n.t('branch.validation.latRange')).max(90, i18n.t('branch.validation.latRange')),
    'branch.validation.latInvalid'
  ),
  kinh_do: optionalNumber(
    z.coerce.number().min(-180, i18n.t('branch.validation.lngRange')).max(180, i18n.t('branch.validation.lngRange')),
    'branch.validation.lngInvalid'
  ),
  duong_dan_map: optionalUrl,
  trang_thai: z.enum([TRANG_THAI.DANG_DUNG, TRANG_THAI.NGUNG]),
});

export type BranchFormValues = z.infer<typeof branchSchema>;
