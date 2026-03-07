import type { DonViTinh } from '../core/types';
import type { ThietLapDonViTinhFormValues } from '../core/schema';
import { getDonViTinhDefault } from '../core/constants';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const genId = () => `dvt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const store: DonViTinh[] = getDonViTinhDefault().map((x) => ({ ...x }));

export async function getDonViTinhList(): Promise<DonViTinh[]> {
  await delay(150);
  return [...store].sort((a, b) => a.thu_tu - b.thu_tu);
}

export async function getDonViTinhById(id: string): Promise<DonViTinh | null> {
  if (!id) return null;
  await delay(100);
  return store.find((d) => d.id === id) ?? null;
}

export async function createDonViTinh(
  payload: ThietLapDonViTinhFormValues
): Promise<DonViTinh> {
  await delay(250);
  const item: DonViTinh = {
    id: genId(),
    ma: payload.ma,
    ten: payload.ten,
    ky_hieu: payload.ky_hieu ?? null,
    thu_tu: payload.thu_tu,
  };
  store.push(item);
  return { ...item };
}

export async function updateDonViTinh(
  id: string,
  payload: Partial<ThietLapDonViTinhFormValues>
): Promise<DonViTinh> {
  await delay(250);
  const idx = store.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error('DonViTinh not found');
  store[idx] = { ...store[idx], ...payload };
  return { ...store[idx] };
}

export async function deleteDonViTinh(id: string): Promise<void> {
  await delay(200);
  const idx = store.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error('DonViTinh not found');
  store.splice(idx, 1);
}
