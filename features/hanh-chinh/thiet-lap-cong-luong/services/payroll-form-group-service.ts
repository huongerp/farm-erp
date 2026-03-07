import { PayrollAdminFormGroup } from '../core/types';
import { PayrollAdminFormGroupFormValues } from '../core/schema';
import { MOCK_PAYROLL_ADMIN_FORM_GROUPS } from '@/mocks/hanh-chinh';
import i18n from '../../../../lib/i18n';

let dbGroups: PayrollAdminFormGroup[] = JSON.parse(JSON.stringify(MOCK_PAYROLL_ADMIN_FORM_GROUPS));

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getPayrollAdminFormGroups = async (): Promise<PayrollAdminFormGroup[]> => {
  await delay(600);
  return [...dbGroups];
};

export const createPayrollAdminFormGroup = async (
  data: PayrollAdminFormGroupFormValues
): Promise<PayrollAdminFormGroup> => {
  await delay(800);
  const now = new Date().toISOString();
  const newItem: PayrollAdminFormGroup = {
    id: `group-${Date.now()}`,
    ...data,
    trang_thai: data.trang_thai as 0 | 1,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbGroups = [newItem, ...dbGroups];
  return newItem;
};

export const updatePayrollAdminFormGroup = async (
  id: string,
  data: PayrollAdminFormGroupFormValues
): Promise<PayrollAdminFormGroup> => {
  await delay(800);
  const index = dbGroups.findIndex(i => i.id === id);
  if (index === -1) throw new Error(i18n.t('payrollIp.groups.service.notFound'));
  const updated: PayrollAdminFormGroup = {
    ...dbGroups[index],
    ...data,
    trang_thai: data.trang_thai as 0 | 1,
    tg_cap_nhat: new Date().toISOString(),
  };
  dbGroups[index] = updated;
  return updated;
};

export const updatePayrollAdminFormGroupStatus = async (ids: string[], status: 0 | 1): Promise<void> => {
  await delay(600);
  dbGroups = dbGroups.map((i) => (ids.includes(i.id) ? { ...i, trang_thai: status, tg_cap_nhat: new Date().toISOString() } : i));
};

export const deletePayrollAdminFormGroups = async (ids: string[]): Promise<void> => {
  await delay(600);
  dbGroups = dbGroups.filter(i => !ids.includes(i.id));
};
