import { KenhTuyenDung } from '../core/types';
import { KenhTuyenDungFormValues } from '../core/schema';
import { MOCK_KENH_TUYEN_DUNG } from '@/mocks/nhan-su';
import i18n from '../../../../lib/i18n';

let db: KenhTuyenDung[] = JSON.parse(JSON.stringify(MOCK_KENH_TUYEN_DUNG));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getKenhTuyenDungs = async (): Promise<KenhTuyenDung[]> => {
  await delay(600);
  return [...db];
};

export const createKenhTuyenDung = async (
  data: KenhTuyenDungFormValues
): Promise<KenhTuyenDung> => {
  await delay(800);
  const now = new Date().toISOString();
  const newItem: KenhTuyenDung = {
    id: `ktd-${Date.now()}`,
    ...data,
    trang_thai: data.trang_thai as 0 | 1,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  db = [newItem, ...db];
  return newItem;
};

export const updateKenhTuyenDung = async (
  id: string,
  data: KenhTuyenDungFormValues
): Promise<KenhTuyenDung> => {
  await delay(800);
  const index = db.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('thietLapTuyenDung.kenhTuyenDung.service.notFound'));
  const updated: KenhTuyenDung = {
    ...db[index],
    ...data,
    trang_thai: data.trang_thai as 0 | 1,
    tg_cap_nhat: new Date().toISOString(),
  };
  db[index] = updated;
  return updated;
};

export const updateKenhTuyenDungStatus = async (
  ids: string[],
  status: 0 | 1
): Promise<void> => {
  await delay(600);
  db = db.map((i) =>
    ids.includes(i.id) ? { ...i, trang_thai: status, tg_cap_nhat: new Date().toISOString() } : i
  );
};

export const deleteKenhTuyenDungs = async (ids: string[]): Promise<void> => {
  await delay(600);
  db = db.filter((i) => !ids.includes(i.id));
};
