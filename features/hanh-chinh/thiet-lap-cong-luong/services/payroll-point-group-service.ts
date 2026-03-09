import { PayrollPointGroup } from '../core/types';
import { PayrollPointGroupFormValues } from '../core/schema';
import { MOCK_PAYROLL_POINT_GROUPS } from '@/mocks/hanh-chinh';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

function normalizeTrangThai(val: unknown): import('../../../../lib/constants').TrangThaiHoatDong {
  if (val === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG;
  if (val === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
  return Number(val) === 0 ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

let dbPointGroups: PayrollPointGroup[] = JSON.parse(JSON.stringify(MOCK_PAYROLL_POINT_GROUPS)).map((i: PayrollPointGroup) => ({
  ...i,
  trang_thai: normalizeTrangThai(i.trang_thai),
}));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getPayrollPointGroups = async (): Promise<PayrollPointGroup[]> => {
  await delay(600);
  return [...dbPointGroups];
};

export const createPayrollPointGroup = async (
  data: PayrollPointGroupFormValues
): Promise<PayrollPointGroup> => {
  await delay(800);
  const now = new Date().toISOString();
  const newItem: PayrollPointGroup = {
    id: `pg-${Date.now()}`,
    ...data,
    loai: data.loai as 'cong' | 'tru',
    trang_thai: data.trang_thai,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbPointGroups = [newItem, ...dbPointGroups];
  return newItem;
};

export const updatePayrollPointGroup = async (
  id: string,
  data: PayrollPointGroupFormValues
): Promise<PayrollPointGroup> => {
  await delay(800);
  const index = dbPointGroups.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('payrollIp.pointGroups.service.notFound'));
  const updated: PayrollPointGroup = {
    ...dbPointGroups[index],
    ...data,
    loai: data.loai as 'cong' | 'tru',
    trang_thai: data.trang_thai,
    tg_cap_nhat: new Date().toISOString(),
  };
  dbPointGroups[index] = updated;
  return updated;
};

export const updatePayrollPointGroupStatus = async (
  ids: string[],
  status: import('../../../../lib/constants').TrangThaiHoatDong
): Promise<void> => {
  await delay(600);
  dbPointGroups = dbPointGroups.map((i) =>
    ids.includes(i.id) ? { ...i, trang_thai: status, tg_cap_nhat: new Date().toISOString() } : i
  );
};

export const deletePayrollPointGroups = async (ids: string[]): Promise<void> => {
  await delay(600);
  dbPointGroups = dbPointGroups.filter((i) => !ids.includes(i.id));
};
