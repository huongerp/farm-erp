import { PayrollWifiIp } from '../core/types';
import { PayrollWifiIpFormValues } from '../core/schema';
import { getBranches } from '../../../he-thong/chi-nhanh/services/chi-nhanh-service';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

function normalizeTrangThai(val: unknown): import('../../../../lib/constants').TrangThaiHoatDong {
  if (val === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG;
  if (val === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
  return Number(val) === 0 ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

let dbWifiIps: PayrollWifiIp[] = [];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getPayrollWifiIps = async (): Promise<PayrollWifiIp[]> => {
  await delay(600);
  return [...dbWifiIps];
};

export const createPayrollWifiIp = async (data: PayrollWifiIpFormValues): Promise<PayrollWifiIp> => {
  await delay(800);
  const branches = await getBranches();
  const branchName = branches.find(b => b.id === data.id_chi_nhanh)?.ten_chi_nhanh;
  const now = new Date().toISOString();
  const newItem: PayrollWifiIp = {
    id: `wifi-${Date.now()}`,
    ...data,
    ten_chi_nhanh: branchName,
    trang_thai: data.trang_thai,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbWifiIps = [newItem, ...dbWifiIps];
  return newItem;
};

export const updatePayrollWifiIp = async (id: string, data: PayrollWifiIpFormValues): Promise<PayrollWifiIp> => {
  await delay(800);
  const index = dbWifiIps.findIndex(i => i.id === id);
  if (index === -1) throw new Error(i18n.t('payrollIp.service.notFound'));
  const branches = await getBranches();
  const branchName = branches.find(b => b.id === data.id_chi_nhanh)?.ten_chi_nhanh;
  const updated: PayrollWifiIp = {
    ...dbWifiIps[index],
    ...data,
    ten_chi_nhanh: branchName,
    trang_thai: data.trang_thai,
    tg_cap_nhat: new Date().toISOString(),
  };
  dbWifiIps[index] = updated;
  return updated;
};

export const updatePayrollWifiIpStatus = async (
  ids: string[],
  status: import('../../../../lib/constants').TrangThaiHoatDong
): Promise<void> => {
  await delay(600);
  const now = new Date().toISOString();
  dbWifiIps = dbWifiIps.map(item =>
    ids.includes(item.id) ? { ...item, trang_thai: status, tg_cap_nhat: now } : item
  );
};

export const deletePayrollWifiIps = async (ids: string[]): Promise<void> => {
  await delay(600);
  dbWifiIps = dbWifiIps.filter(i => !ids.includes(i.id));
};

/** Import nhiều IP wifi */
export const importPayrollWifiIps = async (rows: PayrollWifiIpFormValues[]): Promise<{ created: number; errors: string[] }> => {
  await delay(500);
  const errors: string[] = [];
  let created = 0;
  const branches = await getBranches();
  const branchIds = new Set(branches.map(b => b.id));
  const now = () => new Date().toISOString();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!branchIds.has(row.id_chi_nhanh)) {
      errors.push(`Dòng ${i + 2}: ${i18n.t('payrollIp.importErrors.branchNotFound')}`);
      continue;
    }
    const exists = dbWifiIps.some(
      (x) => x.id_chi_nhanh === row.id_chi_nhanh && x.ip_wifi === row.ip_wifi
    );
    if (exists) {
      errors.push(`Dòng ${i + 2}: ${i18n.t('payrollIp.importErrors.duplicateIp')}`);
      continue;
    }
    const branchName = branches.find(b => b.id === row.id_chi_nhanh)?.ten_chi_nhanh;
    const stamp = now();
    const newItem: PayrollWifiIp = {
      id: `wifi-${Date.now()}-${i}`,
      ...row,
      ten_chi_nhanh: branchName,
      trang_thai: normalizeTrangThai(row.trang_thai),
      tg_tao: stamp,
      tg_cap_nhat: stamp,
    };
    dbWifiIps = [newItem, ...dbWifiIps];
    created++;
  }
  return { created, errors };
};
