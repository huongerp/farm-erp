import type { HangMucTaiChinh } from '../../core/types';
import type { HangMucTaiChinhFormValues } from '../core/schema';
import { MOCK_DANH_MUC_TAI_CHINH } from '../../../../mocks/tai-chinh';
import i18n from '../../../../lib/i18n';

let db: HangMucTaiChinh[] = JSON.parse(JSON.stringify(MOCK_DANH_MUC_TAI_CHINH));

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();

export const getAllDanhMucTaiChinh = async (): Promise<HangMucTaiChinh[]> => {
  await delay(400);
  return [...db];
};

export const getDanhMucTaiChinhById = async (id: string): Promise<HangMucTaiChinh | null> => {
  await delay(200);
  return db.find((d) => d.id === id) ?? null;
};

export const createDanhMucTaiChinh = async (
  data: HangMucTaiChinhFormValues
): Promise<HangMucTaiChinh> => {
  await delay(500);
  const id = `dm-${Date.now()}`;
  const newItem: HangMucTaiChinh = {
    id,
    ma_danh_muc: data.ma_danh_muc.trim(),
    ten_danh_muc: data.ten_danh_muc.trim(),
    loai: data.loai,
    id_cha: data.id_cha && data.id_cha.trim() ? data.id_cha : null,
    thu_tu: data.thu_tu ?? 0,
    mo_ta: data.mo_ta?.trim() || undefined,
    trang_thai: data.trang_thai as 0 | 1,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  };
  db = [...db, newItem];
  return newItem;
};

export const updateDanhMucTaiChinh = async (
  id: string,
  data: HangMucTaiChinhFormValues
): Promise<HangMucTaiChinh> => {
  await delay(500);
  const index = db.findIndex((d) => d.id === id);
  if (index === -1) throw new Error(i18n.t('danhMucTaiChinh.service.notFound'));
  const existing = db[index];
  const updated: HangMucTaiChinh = {
    ...existing,
    ma_danh_muc: data.ma_danh_muc.trim(),
    ten_danh_muc: data.ten_danh_muc.trim(),
    loai: data.loai,
    id_cha: data.id_cha && data.id_cha.trim() ? data.id_cha : null,
    thu_tu: data.thu_tu ?? existing.thu_tu,
    mo_ta: data.mo_ta?.trim() || undefined,
    trang_thai: data.trang_thai as 0 | 1,
    tg_cap_nhat: ts(),
  };
  db[index] = updated;
  return updated;
};

export const deleteDanhMucTaiChinh = async (id: string): Promise<void> => {
  await delay(400);
  const hasChildren = db.some((d) => d.id_cha === id);
  if (hasChildren) throw new Error(i18n.t('danhMucTaiChinh.service.hasChildren'));
  db = db.filter((d) => d.id !== id);
};

export const deleteDanhMucTaiChinhMany = async (ids: string[]): Promise<void> => {
  await delay(500);
  for (const id of ids) {
    const hasChildren = db.some((d) => d.id_cha === id);
    if (hasChildren) throw new Error(i18n.t('danhMucTaiChinh.service.hasChildren'));
  }
  db = db.filter((d) => !ids.includes(d.id));
}
