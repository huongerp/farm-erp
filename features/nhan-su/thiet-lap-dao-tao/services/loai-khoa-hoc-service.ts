import { LoaiKhoaHoc } from '../core/types';
import { LoaiKhoaHocFormValues } from '../core/schema';
import { MOCK_LOAI_KHOA_HOC } from '@/mocks/nhan-su';
import i18n from '../../../../lib/i18n';

let db: LoaiKhoaHoc[] = JSON.parse(JSON.stringify(MOCK_LOAI_KHOA_HOC));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getLoaiKhoaHocs = async (): Promise<LoaiKhoaHoc[]> => {
  await delay(600);
  return [...db];
};

export const createLoaiKhoaHoc = async (
  data: LoaiKhoaHocFormValues
): Promise<LoaiKhoaHoc> => {
  await delay(800);
  const now = new Date().toISOString();
  const newItem: LoaiKhoaHoc = {
    id: `lkh-${Date.now()}`,
    ...data,
    trang_thai: data.trang_thai as 0 | 1,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  db = [newItem, ...db];
  return newItem;
};

export const updateLoaiKhoaHoc = async (
  id: string,
  data: LoaiKhoaHocFormValues
): Promise<LoaiKhoaHoc> => {
  await delay(800);
  const index = db.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('thietLapDaoTao.loaiKhoaHoc.service.notFound'));
  const updated: LoaiKhoaHoc = {
    ...db[index],
    ...data,
    trang_thai: data.trang_thai as 0 | 1,
    tg_cap_nhat: new Date().toISOString(),
  };
  db[index] = updated;
  return updated;
};

export const updateLoaiKhoaHocStatus = async (
  ids: string[],
  status: 0 | 1
): Promise<void> => {
  await delay(600);
  db = db.map((i) =>
    ids.includes(i.id) ? { ...i, trang_thai: status, tg_cap_nhat: new Date().toISOString() } : i
  );
};

export const deleteLoaiKhoaHocs = async (ids: string[]): Promise<void> => {
  await delay(600);
  db = db.filter((i) => !ids.includes(i.id));
};
