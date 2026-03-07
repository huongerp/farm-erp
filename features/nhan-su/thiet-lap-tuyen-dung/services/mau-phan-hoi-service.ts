import { MauPhanHoi } from '../core/types';
import { MauPhanHoiFormValues } from '../core/schema';
import { MOCK_MAU_PHAN_HOI } from '@/mocks/nhan-su';
import i18n from '../../../../lib/i18n';

let db: MauPhanHoi[] = JSON.parse(JSON.stringify(MOCK_MAU_PHAN_HOI));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getMauPhanHois = async (): Promise<MauPhanHoi[]> => {
  await delay(600);
  return [...db];
};

export const createMauPhanHoi = async (
  data: MauPhanHoiFormValues
): Promise<MauPhanHoi> => {
  await delay(800);
  const now = new Date().toISOString();
  const newItem: MauPhanHoi = {
    id: `mph-${Date.now()}`,
    ...data,
    trang_thai: data.trang_thai as 0 | 1,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  db = [newItem, ...db];
  return newItem;
};

export const updateMauPhanHoi = async (
  id: string,
  data: MauPhanHoiFormValues
): Promise<MauPhanHoi> => {
  await delay(800);
  const index = db.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('thietLapTuyenDung.mauPhanHoi.service.notFound'));
  const updated: MauPhanHoi = {
    ...db[index],
    ...data,
    trang_thai: data.trang_thai as 0 | 1,
    tg_cap_nhat: new Date().toISOString(),
  };
  db[index] = updated;
  return updated;
};

export const updateMauPhanHoiStatus = async (
  ids: string[],
  status: 0 | 1
): Promise<void> => {
  await delay(600);
  db = db.map((i) =>
    ids.includes(i.id) ? { ...i, trang_thai: status, tg_cap_nhat: new Date().toISOString() } : i
  );
};

export const deleteMauPhanHois = async (ids: string[]): Promise<void> => {
  await delay(600);
  db = db.filter((i) => !ids.includes(i.id));
};
