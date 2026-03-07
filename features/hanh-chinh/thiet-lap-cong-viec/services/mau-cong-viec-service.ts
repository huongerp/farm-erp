import type { MauCongViec } from '../core/types';
import type { MauCongViecFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { MOCK_MAU_CONG_VIEC } from '../../../../mocks/cong-viec';

const STORAGE_KEY = 'mau_cong_viec_list';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function loadFromStorage(): MauCongViec[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const seed = JSON.parse(JSON.stringify(MOCK_MAU_CONG_VIEC)) as MauCongViec[];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  } catch {
    // ignore
  }
  return [];
}

function saveToStorage(list: MauCongViec[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export const getMauCongViecList = async (): Promise<MauCongViec[]> => {
  await delay(400);
  return loadFromStorage();
};

export const createMauCongViec = async (
  data: MauCongViecFormValues
): Promise<MauCongViec> => {
  await delay(500);
  const list = loadFromStorage();
  const now = new Date().toISOString();
  const newItem: MauCongViec = {
    id: `mau-${Date.now()}`,
    ten_mau: data.ten_mau,
    tieu_de_mac_dinh: data.tieu_de_mac_dinh,
    mo_ta_mac_dinh: data.mo_ta_mac_dinh ?? '',
    uu_tien_mac_dinh: data.uu_tien_mac_dinh as 'cao' | 'trung_binh' | 'thap',
    trang_thai_mac_dinh: data.trang_thai_mac_dinh as 0 | 1,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  list.unshift(newItem);
  saveToStorage(list);
  return newItem;
};

export const updateMauCongViec = async (
  id: string,
  data: MauCongViecFormValues
): Promise<MauCongViec> => {
  await delay(500);
  const list = loadFromStorage();
  const index = list.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('thietLapCongViec.mau.service.notFound'));
  const updated: MauCongViec = {
    ...list[index],
    ...data,
    uu_tien_mac_dinh: data.uu_tien_mac_dinh as 'cao' | 'trung_binh' | 'thap',
    trang_thai_mac_dinh: data.trang_thai_mac_dinh as 0 | 1,
    tg_cap_nhat: new Date().toISOString(),
  };
  list[index] = updated;
  saveToStorage(list);
  return updated;
};

export const updateMauCongViecStatus = async (
  ids: string[],
  status: 0 | 1
): Promise<void> => {
  await delay(400);
  const list = loadFromStorage();
  const next = list.map((i) =>
    ids.includes(i.id)
      ? { ...i, trang_thai_mac_dinh: status, tg_cap_nhat: new Date().toISOString() }
      : i
  );
  saveToStorage(next);
};

export const deleteMauCongViecList = async (ids: string[]): Promise<void> => {
  await delay(400);
  const list = loadFromStorage().filter((i) => !ids.includes(i.id));
  saveToStorage(list);
};
