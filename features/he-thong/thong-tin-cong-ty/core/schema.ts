import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const companySchema = z.object({
  appName: z.string().min(2, i18n.t('company.validation.appNameMin')),
  appDescription: z.string().max(30, i18n.t('company.validation.appDescMax')).optional(),
  companyName: z.string().min(2, i18n.t('company.validation.companyNameMin')),
  taxId: z.union([z.string().min(5, i18n.t('company.validation.taxIdMin')), z.literal('')]),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email(i18n.t('company.validation.emailInvalid')).optional().or(z.literal('')),
  website: z.string().optional(),
});
