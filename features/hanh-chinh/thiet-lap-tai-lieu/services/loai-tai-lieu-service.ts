import type { LoaiTaiLieu } from '../core/types';
import type { LoaiTaiLieuFormValues } from '../core/schema';
import { MOCK_LOAI_TAI_LIEU } from '@/mocks/hanh-chinh';
import i18n from '../../../../lib/i18n';

let db: LoaiTaiLieu[] = JSON.parse(JSON.stringify(MOCK_LOAI_TAI_LIEU));

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const getLoaiTaiLieuList = async (): Promise<LoaiTaiLieu[]> => {
  await delay(400);
  return [...db];
};

export const createLoaiTaiLieu = async (data: LoaiTaiLieuFormValues): Promise<LoaiTaiLieu> => {
  await delay(500);
  const now = new Date().toISOString();
  const newItem: LoaiTaiLieu = {
    id: `ltl-${Date.now()}`,
    ma: data.ma,
    ten: data.ten,
    ghi_chu: data.ghi_chu ?? undefined,
    trang_thai: data.trang_thai as 0 | 1,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  db = [newItem, ...db];
  return newItem;
};

export const updateLoaiTaiLieu = async (id: string, data: LoaiTaiLieuFormValues): Promise<LoaiTaiLieu> => {
  await delay(500);
  const idx = db.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error(i18n.t('thietLapTaiLieu.loai.service.notFound'));
  const updated: LoaiTaiLieu = {
    ...db[idx],
    ...data,
    trang_thai: data.trang_thai as 0 | 1,
    tg_cap_nhat: new Date().toISOString(),
  };
  db[idx] = updated;
  return updated;
};

export const updateLoaiTaiLieuStatus = async (ids: string[], status: 0 | 1): Promise<void> => {
  await delay(400);
  db = db.map((i) => (ids.includes(i.id) ? { ...i, trang_thai: status, tg_cap_nhat: new Date().toISOString() } : i));
};

export const deleteLoaiTaiLieuList = async (ids: string[]): Promise<void> => {
  await delay(400);
  db = db.filter((i) => !ids.includes(i.id));
};
