import type { HoSo } from '../core/types';
import type { HoSoFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { MOCK_HO_SO, PHONG_BAN_NAMES, MOCK_TAI_LIEU } from '../../../../mocks/hanh-chinh';

let db: HoSo[] = JSON.parse(JSON.stringify(MOCK_HO_SO));

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function enrichHoSo(item: HoSo): HoSo {
  const ten_phong_ban = item.id_phong_ban ? PHONG_BAN_NAMES[item.id_phong_ban] : undefined;
  const taiLieu = MOCK_TAI_LIEU.find((t) => t.id === item.id_tai_lieu);
  const ten_tai_lieu = taiLieu?.trich_yeu;
  return { ...item, ten_phong_ban, ten_tai_lieu };
}

export const getHoSoList = async (opts?: { id_tai_lieu?: string }): Promise<HoSo[]> => {
  await delay(400);
  let list = db.map(enrichHoSo);
  if (opts?.id_tai_lieu) list = list.filter((h) => h.id_tai_lieu === opts.id_tai_lieu);
  return list;
};

export const getHoSoByTaiLieuId = async (idTaiLieu: string): Promise<HoSo[]> => {
  await delay(300);
  return db.filter((h) => h.id_tai_lieu === idTaiLieu).map(enrichHoSo);
};

export const getHoSoById = async (id: string): Promise<HoSo | null> => {
  await delay(200);
  const item = db.find((i) => i.id === id) ?? null;
  return item ? enrichHoSo(item) : null;
};

export const createHoSo = async (data: HoSoFormValues): Promise<HoSo> => {
  await delay(500);
  const now = new Date().toISOString();
  const newItem: HoSo = {
    id: `hs-${Date.now()}`,
    id_tai_lieu: data.id_tai_lieu,
    ma_ho_so: data.ma_ho_so,
    ten_ho_so: data.ten_ho_so,
    id_phong_ban: data.id_phong_ban,
    thoi_han_luu_tru: data.thoi_han_luu_tru,
    mo_ta: data.mo_ta,
    trang_thai: data.trang_thai as 0 | 1,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  db = [newItem, ...db];
  return enrichHoSo(newItem);
};

export const updateHoSo = async (id: string, data: HoSoFormValues): Promise<HoSo> => {
  await delay(500);
  const idx = db.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error(i18n.t('hoSo.service.notFound'));
  const updated: HoSo = {
    ...db[idx],
    id_tai_lieu: data.id_tai_lieu,
    ma_ho_so: data.ma_ho_so,
    ten_ho_so: data.ten_ho_so,
    id_phong_ban: data.id_phong_ban,
    thoi_han_luu_tru: data.thoi_han_luu_tru,
    mo_ta: data.mo_ta,
    trang_thai: data.trang_thai as 0 | 1,
    tg_cap_nhat: new Date().toISOString(),
  };
  db[idx] = updated;
  return enrichHoSo(updated);
};

export const deleteHoSoList = async (ids: string[]): Promise<void> => {
  await delay(400);
  db = db.filter((i) => !ids.includes(i.id));
};

// --- Ghim hồ sơ (theo user) ---
const ghimByUser: Record<string, string[]> = {};

function getCurrentUserId(): string {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return 'emp-000';
    const parsed = JSON.parse(raw);
    return parsed?.state?.user?.id ?? 'emp-000';
  } catch {
    return 'emp-000';
  }
}

export const getHoSoGhimIds = async (): Promise<string[]> => {
  await delay(200);
  const userId = getCurrentUserId();
  return ghimByUser[userId] ?? [];
};

export const toggleHoSoGhim = async (idHoSo: string): Promise<{ pinned: boolean }> => {
  await delay(300);
  const userId = getCurrentUserId();
  const list = ghimByUser[userId] ?? [];
  const idx = list.indexOf(idHoSo);
  let pinned: boolean;
  if (idx >= 0) {
    list.splice(idx, 1);
    pinned = false;
  } else {
    list.push(idHoSo);
    pinned = true;
  }
  ghimByUser[userId] = list;
  return { pinned };
};
