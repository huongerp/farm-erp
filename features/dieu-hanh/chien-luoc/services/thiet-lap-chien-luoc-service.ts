import type { LoaiChienLuoc } from '../core/types';
import type { NhomLoaiChienLuoc } from '../core/types';
import { getLoaiChienLuocDefault } from '../core/constants';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const genId = () => `loai-cl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

let store: LoaiChienLuoc[] = getLoaiChienLuocDefault();

export interface CreateLoaiChienLuocPayload {
  nhom: NhomLoaiChienLuoc;
  ma: string;
  ten: string;
  mo_ta?: string | null;
  cau_chien_luoc_mau?: string | null;
  thu_tu: number;
}

export async function getLoaiChienLuocList(): Promise<LoaiChienLuoc[]> {
  await delay(150);
  return [...store].sort((a, b) => a.thu_tu - b.thu_tu);
}

export async function getLoaiChienLuocById(id: string): Promise<LoaiChienLuoc | null> {
  await delay(100);
  return store.find((x) => x.id === id) ?? null;
}

export async function updateLoaiChienLuoc(
  id: string,
  payload: { ten?: string; mo_ta?: string | null; cau_chien_luoc_mau?: string | null; thu_tu?: number }
): Promise<LoaiChienLuoc> {
  await delay(200);
  const idx = store.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error('LoaiChienLuoc not found');
  const prev = store[idx];
  const updated: LoaiChienLuoc = {
    ...prev,
    ten: payload.ten ?? prev.ten,
    mo_ta: payload.mo_ta !== undefined ? payload.mo_ta : prev.mo_ta,
    cau_chien_luoc_mau: payload.cau_chien_luoc_mau !== undefined ? payload.cau_chien_luoc_mau : prev.cau_chien_luoc_mau,
    thu_tu: payload.thu_tu ?? prev.thu_tu,
  };
  store = store.slice();
  store[idx] = updated;
  return { ...updated };
}

export async function createLoaiChienLuoc(
  payload: CreateLoaiChienLuocPayload
): Promise<LoaiChienLuoc> {
  await delay(200);
  const item: LoaiChienLuoc = {
    id: genId(),
    nhom: payload.nhom,
    ma: payload.ma,
    ten: payload.ten,
    mo_ta: payload.mo_ta ?? null,
    cau_chien_luoc_mau: payload.cau_chien_luoc_mau ?? null,
    thu_tu: payload.thu_tu,
  };
  store = store.slice();
  store.push(item);
  return { ...item };
}

export async function deleteLoaiChienLuoc(id: string): Promise<void> {
  await delay(200);
  const idx = store.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error('LoaiChienLuoc not found');
  store = store.slice();
  store.splice(idx, 1);
}
