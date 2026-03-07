import { DiemCongTruRecord } from '../core/types';
import { DiemCongTruFormValues } from '../core/schema';
import { MOCK_DIEM_CONG_TRU } from '@/mocks/hanh-chinh';
import { getPayrollPointGroups } from '../../thiet-lap-cong-luong/services/payroll-point-group-service';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import i18n from '../../../../lib/i18n';

let dbRecords: DiemCongTruRecord[] = JSON.parse(JSON.stringify(MOCK_DIEM_CONG_TRU));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getDiemCongTruRecords = async (): Promise<DiemCongTruRecord[]> => {
  await delay(600);
  return [...dbRecords];
};

export const getPayrollPointGroupsForModule = getPayrollPointGroups;

export const getEmployeesForSelect = getEmployees;

export const createDiemCongTruRecord = async (
  data: DiemCongTruFormValues
): Promise<DiemCongTruRecord> => {
  await delay(800);
  const [pointGroups, employees] = await Promise.all([getPayrollPointGroups(), getEmployees()]);
  const hangMuc = pointGroups.find((g) => g.id === data.id_hang_muc);
  const nhanVien = employees.find((e) => e.id === data.id_nhan_vien);
  const now = new Date().toISOString();
  const newRecord: DiemCongTruRecord = {
    id: `dct-${Date.now()}`,
    id_nhan_vien: data.id_nhan_vien,
    ten_nhan_vien: nhanVien?.ho_ten,
    ma_nhan_vien: nhanVien?.ma_nhan_vien,
    nam: data.nam,
    thang: data.thang,
    loai: data.loai as 'cong' | 'tru',
    id_hang_muc: data.id_hang_muc,
    ten_hang_muc: hangMuc?.ten,
    ma_hang_muc: hangMuc?.ma,
    diem: data.diem,
    mo_ta: data.mo_ta?.trim() || undefined,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbRecords = [newRecord, ...dbRecords];
  return newRecord;
};

export const updateDiemCongTruRecord = async (
  id: string,
  data: DiemCongTruFormValues
): Promise<DiemCongTruRecord> => {
  await delay(800);
  const index = dbRecords.findIndex((r) => r.id === id);
  if (index === -1) throw new Error(i18n.t('diemCongTru.service.notFound'));
  const [pointGroups, employees] = await Promise.all([getPayrollPointGroups(), getEmployees()]);
  const hangMuc = pointGroups.find((g) => g.id === data.id_hang_muc);
  const nhanVien = employees.find((e) => e.id === data.id_nhan_vien);
  const updated: DiemCongTruRecord = {
    ...dbRecords[index],
    id_nhan_vien: data.id_nhan_vien,
    ten_nhan_vien: nhanVien?.ho_ten,
    ma_nhan_vien: nhanVien?.ma_nhan_vien,
    nam: data.nam,
    thang: data.thang,
    loai: data.loai as 'cong' | 'tru',
    id_hang_muc: data.id_hang_muc,
    ten_hang_muc: hangMuc?.ten,
    ma_hang_muc: hangMuc?.ma,
    diem: data.diem,
    mo_ta: data.mo_ta?.trim() || undefined,
    tg_cap_nhat: new Date().toISOString(),
  };
  dbRecords[index] = updated;
  return updated;
};

export const deleteDiemCongTruRecords = async (ids: string[]): Promise<void> => {
  await delay(600);
  dbRecords = dbRecords.filter((r) => !ids.includes(r.id));
};
