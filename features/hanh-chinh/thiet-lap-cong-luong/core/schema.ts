import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { ADMIN_FORM_TYPES } from './constants';

const IP_REGEX =
  /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

export const payrollWifiIpSchema = z.object({
  id_chi_nhanh: z.string().min(1, { message: i18n.t('payrollIp.validation.branchRequired') }),
  ip_wifi: z
    .string()
    .min(7, { message: i18n.t('payrollIp.validation.ipRequired') })
    .regex(IP_REGEX, { message: i18n.t('payrollIp.validation.ipInvalid') }),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.enum([TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG]),
});

export type PayrollWifiIpFormValues = z.infer<typeof payrollWifiIpSchema>;

export const payrollAdminFormGroupSchema = z.object({
  loai_phieu: z.enum(ADMIN_FORM_TYPES, { errorMap: () => ({ message: i18n.t('payrollIp.groups.validation.typeRequired') }) }),
  so_luong_thang: z.coerce
    .number()
    .min(0, { message: i18n.t('payrollIp.groups.validation.quotaMin') })
    .max(999, { message: i18n.t('payrollIp.groups.validation.quotaMax') }),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.enum([TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG]),
});

export type PayrollAdminFormGroupFormValues = z.infer<typeof payrollAdminFormGroupSchema>;

const POINT_GROUP_TYPES = ['cong', 'tru'] as const;

export const payrollPointGroupSchema = z.object({
  ma: z.string().min(1, { message: i18n.t('payrollIp.pointGroups.validation.maRequired') }),
  ten: z.string().min(1, { message: i18n.t('payrollIp.pointGroups.validation.tenRequired') }),
  loai: z.enum(POINT_GROUP_TYPES, { errorMap: () => ({ message: i18n.t('payrollIp.pointGroups.validation.loaiRequired') }) }),
  thu_tu: z.coerce.number().min(0, { message: i18n.t('payrollIp.pointGroups.validation.thuTuMin') }),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.enum([TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG]),
});

export type PayrollPointGroupFormValues = z.infer<typeof payrollPointGroupSchema>;
