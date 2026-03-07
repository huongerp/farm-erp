import type { CachTinhDiem } from '../core/types';
import type { ThietLapCachTinhDiemFormValues } from '../core/schema';
import { getCachTinhDiemDefault } from '../core/constants';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const genId = () => `ctd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const store: CachTinhDiem[] = getCachTinhDiemDefault().map((x) => ({ ...x }));

export async function getCachTinhDiemList(): Promise<CachTinhDiem[]> {
  await delay(150);
  return [...store].sort((a, b) => a.thu_tu - b.thu_tu);
}

export async function getCachTinhDiemById(id: string): Promise<CachTinhDiem | null> {
  if (!id) return null;
  await delay(100);
  return store.find((c) => c.id === id) ?? null;
}

export async function createCachTinhDiem(
  payload: ThietLapCachTinhDiemFormValues
): Promise<CachTinhDiem> {
  await delay(250);
  const item: CachTinhDiem = {
    id: genId(),
    ma: payload.ma,
    ten: payload.ten,
    mo_ta: payload.mo_ta ?? null,
    thu_tu: payload.thu_tu,
  };
  store.push(item);
  return { ...item };
}

export async function updateCachTinhDiem(
  id: string,
  payload: Partial<ThietLapCachTinhDiemFormValues>
): Promise<CachTinhDiem> {
  await delay(250);
  const idx = store.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('CachTinhDiem not found');
  store[idx] = { ...store[idx], ...payload };
  return { ...store[idx] };
}

export async function deleteCachTinhDiem(id: string): Promise<void> {
  await delay(200);
  const idx = store.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('CachTinhDiem not found');
  store.splice(idx, 1);
}
