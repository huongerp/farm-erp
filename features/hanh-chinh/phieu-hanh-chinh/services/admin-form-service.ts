import { AdminFormRequest } from '../core/types';
import { AdminFormValues } from '../core/schema';
import { MOCK_ADMIN_FORMS } from '@/mocks/hanh-chinh';
import { MOCK_EMPLOYEES } from '@/mocks/he-thong';
import i18n from '../../../../lib/i18n';

let dbForms: AdminFormRequest[] | null = null;

function getDb(): AdminFormRequest[] {
  if (dbForms === null) {
    dbForms = JSON.parse(JSON.stringify(MOCK_ADMIN_FORMS));
  }
  return dbForms;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getAdminForms = async (): Promise<AdminFormRequest[]> => {
  await delay(600);
  const list = getDb();
  return [...list].sort((a, b) => b.ngay.localeCompare(a.ngay));
};

/** Lấy phiếu hành chính của nhân viên theo tháng (dùng cho detail bảng công) */
export const getAdminFormsByUserAndMonth = async (
  userId: string,
  monthKey: string
): Promise<AdminFormRequest[]> => {
  await delay(300);
  const list = getDb();
  const prefix = monthKey + '-';
  return list
    .filter((f) => f.nguoi_tao_id === userId && f.ngay.startsWith(prefix))
    .sort((a, b) => b.ngay.localeCompare(a.ngay));
};

export const createAdminForm = async (data: AdminFormValues, creator: { id: string; name: string }): Promise<AdminFormRequest> => {
  await delay(800);
  const now = new Date().toISOString();
  const newItem: AdminFormRequest = {
    id: `form-${Date.now()}`,
    ...data,
    nguoi_tao_id: creator.id,
    ten_nguoi_tao: creator.name,
    trang_thai_quan_ly: 'pending',
    trang_thai_hcns: 'pending',
    trang_thai: 'pending',
    tg_tao: now,
    tg_cap_nhat: now,
  };
  const list = getDb();
  dbForms = [newItem, ...list];
  return newItem;
};

export const updateAdminForm = async (id: string, data: AdminFormValues): Promise<AdminFormRequest> => {
  await delay(800);
  const list = getDb();
  const index = list.findIndex(i => i.id === id);
  if (index === -1) throw new Error(i18n.t('adminForm.service.notFound'));
  const updated: AdminFormRequest = {
    ...list[index],
    ...data,
    tg_cap_nhat: new Date().toISOString(),
  };
  list[index] = updated;
  dbForms = list;
  return updated;
};

export const cancelAdminForm = async (id: string): Promise<void> => {
  await delay(600);
  const list = getDb();
  const index = list.findIndex(i => i.id === id);
  if (index === -1) throw new Error(i18n.t('adminForm.service.notFound'));
  list[index] = {
    ...list[index],
    trang_thai: 'cancelled',
    tg_cap_nhat: new Date().toISOString(),
  };
  dbForms = list;
};

export const deleteAdminForm = async (id: string): Promise<void> => {
  await delay(600);
  const list = getDb();
  const index = list.findIndex(i => i.id === id);
  if (index === -1) throw new Error(i18n.t('adminForm.service.notFound'));
  list.splice(index, 1);
  dbForms = list;
};

export const deleteAdminForms = async (ids: string[]): Promise<void> => {
  await delay(600);
  const list = getDb();
  dbForms = list.filter((item) => !ids.includes(item.id));
};

export const cancelAdminForms = async (ids: string[]): Promise<void> => {
  await delay(600);
  const list = getDb();
  dbForms = list.map((item) =>
    ids.includes(item.id)
      ? { ...item, trang_thai: 'cancelled', tg_cap_nhat: new Date().toISOString() }
      : item
  );
};

export const approveAdminFormsByManager = async (ids: string[]): Promise<void> => {
  await delay(600);
  const list = getDb();
  dbForms = list.map((item) => {
    if (!ids.includes(item.id)) return item;
    if (item.trang_thai === 'cancelled') return item;
    return {
      ...item,
      trang_thai_quan_ly: 'approved',
      trang_thai: item.trang_thai_hcns === 'approved' ? 'approved' : 'manager_approved',
      tg_cap_nhat: new Date().toISOString(),
    };
  });
};

export const rejectAdminFormsByManager = async (ids: string[]): Promise<void> => {
  await delay(600);
  const list = getDb();
  dbForms = list.map((item) =>
    ids.includes(item.id)
      ? { ...item, trang_thai_quan_ly: 'rejected', trang_thai: 'rejected', tg_cap_nhat: new Date().toISOString() }
      : item
  );
};

export const approveAdminFormsByHcns = async (ids: string[]): Promise<void> => {
  await delay(600);
  const list = getDb();
  dbForms = list.map((item) => {
    if (!ids.includes(item.id)) return item;
    if (item.trang_thai_quan_ly !== 'approved') return item;
    if (item.trang_thai === 'cancelled') return item;
    return {
      ...item,
      trang_thai_hcns: 'approved',
      trang_thai: 'approved',
      tg_cap_nhat: new Date().toISOString(),
    };
  });
};

export const rejectAdminFormsByHcns = async (ids: string[]): Promise<void> => {
  await delay(600);
  const list = getDb();
  dbForms = list.map((item) =>
    ids.includes(item.id)
      ? { ...item, trang_thai_hcns: 'rejected', trang_thai: 'rejected', tg_cap_nhat: new Date().toISOString() }
      : item
  );
};

export const createAdminFormSystem = async (data: {
  userId: string;
  userName?: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'full';
  reason: string;
}): Promise<AdminFormRequest> => {
  await delay(300);
  const now = new Date().toISOString();
  const employee = MOCK_EMPLOYEES.find((e) => e.id === data.userId);
  const newItem: AdminFormRequest = {
    id: `form-auto-${Date.now()}`,
    loai_phieu: 'late_early',
    ca: data.shift,
    ngay: data.date,
    ly_do: data.reason,
    nguoi_tao_id: data.userId,
    ten_nguoi_tao: data.userName ?? employee?.ho_ten ?? 'Unknown',
    id_phong_ban: employee?.id_phong_ban ?? null,
    ten_phong_ban: employee?.ten_phong_ban ?? null,
    quan_ly_id: 'emp-000',
    ten_quan_ly: 'Lê Minh Công',
    hcns_id: 'emp-000',
    ten_hcns: 'Lê Minh Công',
    trang_thai_quan_ly: 'pending',
    trang_thai_hcns: 'pending',
    trang_thai: 'pending',
    tg_tao: now,
    tg_cap_nhat: now,
  };
  const list = getDb();
  dbForms = [newItem, ...list];
  return newItem;
};

export const approveAdminFormByManager = async (id: string): Promise<void> => {
  await delay(600);
  const list = getDb();
  const index = list.findIndex(i => i.id === id);
  if (index === -1) throw new Error(i18n.t('adminForm.service.notFound'));
  if (list[index].trang_thai === 'cancelled') throw new Error(i18n.t('adminForm.service.invalidState'));
  list[index] = {
    ...list[index],
    trang_thai_quan_ly: 'approved',
    trang_thai: list[index].trang_thai_hcns === 'approved' ? 'approved' : 'manager_approved',
    tg_cap_nhat: new Date().toISOString(),
  };
  dbForms = list;
};

export const rejectAdminFormByManager = async (id: string): Promise<void> => {
  await delay(600);
  const list = getDb();
  const index = list.findIndex(i => i.id === id);
  if (index === -1) throw new Error(i18n.t('adminForm.service.notFound'));
  list[index] = {
    ...list[index],
    trang_thai_quan_ly: 'rejected',
    trang_thai: 'rejected',
    tg_cap_nhat: new Date().toISOString(),
  };
  dbForms = list;
};

export const approveAdminFormByHcns = async (id: string): Promise<void> => {
  await delay(600);
  const list = getDb();
  const index = list.findIndex(i => i.id === id);
  if (index === -1) throw new Error(i18n.t('adminForm.service.notFound'));
  if (list[index].trang_thai_quan_ly !== 'approved') throw new Error(i18n.t('adminForm.service.invalidState'));
  list[index] = {
    ...list[index],
    trang_thai_hcns: 'approved',
    trang_thai: 'approved',
    tg_cap_nhat: new Date().toISOString(),
  };
  dbForms = list;
};

export const rejectAdminFormByHcns = async (id: string): Promise<void> => {
  await delay(600);
  const list = getDb();
  const index = list.findIndex(i => i.id === id);
  if (index === -1) throw new Error(i18n.t('adminForm.service.notFound'));
  list[index] = {
    ...list[index],
    trang_thai_hcns: 'rejected',
    trang_thai: 'rejected',
    tg_cap_nhat: new Date().toISOString(),
  };
  dbForms = list;
};
