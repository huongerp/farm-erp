import type { TrangThaiTaiLieu } from '../core/types';
import type { TrangThaiTaiLieuFormValues } from '../core/schema';
import { MOCK_TRANG_THAI_TAI_LIEU } from '@/mocks/hanh-chinh';
import i18n from '../../../../lib/i18n';

let db: TrangThaiTaiLieu[] = JSON.parse(JSON.stringify(MOCK_TRANG_THAI_TAI_LIEU));

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const getTrangThaiTaiLieuList = async (): Promise<TrangThaiTaiLieu[]> => {
  await delay(400);
  return [...db];
};

export const createTrangThaiTaiLieu = async (data: TrangThaiTaiLieuFormValues): Promise<TrangThaiTaiLieu> => {
  await delay(500);
  const now = new Date().toISOString();
  const newItem: TrangThaiTaiLieu = {
    id: `ttl-${Date.now()}`,
    ma: data.ma,
    ten: data.ten,
    thu_tu: data.thu_tu,
    mau: data.mau ?? undefined,
    ghi_chu: data.ghi_chu ?? undefined,
    trang_thai: data.trang_thai as 0 | 1,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  db = [newItem, ...db];
  return newItem;
};

export const updateTrangThaiTaiLieu = async (id: string, data: TrangThaiTaiLieuFormValues): Promise<TrangThaiTaiLieu> => {
  await delay(500);
  const idx = db.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error(i18n.t('thietLapTaiLieu.trangThai.service.notFound'));
  const updated: TrangThaiTaiLieu = {
    ...db[idx],
    ...data,
    trang_thai: data.trang_thai as 0 | 1,
    tg_cap_nhat: new Date().toISOString(),
  };
  db[idx] = updated;
  return updated;
};

export const updateTrangThaiTaiLieuStatus = async (ids: string[], status: 0 | 1): Promise<void> => {
  await delay(400);
  db = db.map((i) => (ids.includes(i.id) ? { ...i, trang_thai: status, tg_cap_nhat: new Date().toISOString() } : i));
};

export const deleteTrangThaiTaiLieuList = async (ids: string[]): Promise<void> => {
  await delay(400);
  db = db.filter((i) => !ids.includes(i.id));
};
