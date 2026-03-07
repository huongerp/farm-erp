import type { NhomHanhDong } from '../core/types';
import type { ThietLapNhomHanhDongFormValues } from '../core/schema';
import { getNhomHanhDongDefault } from '../core/constants';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();
const genId = () => `nhd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const store: NhomHanhDong[] = getNhomHanhDongDefault().map((x) => ({ ...x }));

export async function getNhomHanhDongList(): Promise<NhomHanhDong[]> {
  await delay(150);
  return [...store].sort((a, b) => a.thu_tu - b.thu_tu);
}

export async function getNhomHanhDongById(id: string): Promise<NhomHanhDong | null> {
  if (!id) return null;
  await delay(100);
  return store.find((n) => n.id === id) ?? null;
}

export async function createNhomHanhDong(
  payload: Omit<ThietLapNhomHanhDongFormValues, 'thu_tu'> & { thu_tu: number }
): Promise<NhomHanhDong> {
  await delay(250);
  const item: NhomHanhDong = {
    id: genId(),
    ma: payload.ma,
    ten: payload.ten,
    mo_ta: payload.mo_ta ?? null,
    thu_tu: payload.thu_tu,
  };
  store.push(item);
  return { ...item };
}

export async function updateNhomHanhDong(
  id: string,
  payload: Partial<ThietLapNhomHanhDongFormValues>
): Promise<NhomHanhDong> {
  await delay(250);
  const idx = store.findIndex((n) => n.id === id);
  if (idx === -1) throw new Error('NhomHanhDong not found');
  store[idx] = { ...store[idx], ...payload };
  return { ...store[idx] };
}

export async function deleteNhomHanhDong(id: string): Promise<void> {
  await delay(200);
  const idx = store.findIndex((n) => n.id === id);
  if (idx === -1) throw new Error('NhomHanhDong not found');
  store.splice(idx, 1);
}
