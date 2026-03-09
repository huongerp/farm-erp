import type { TrangThaiDoiTac } from '../core/types';
import type { TrangThaiDoiTacFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

const STORAGE_KEY = 'thiet_lap_trang_thai_doi_tac';

const DEFAULT_SEED: TrangThaiDoiTac[] = [
  { id: 'ttdt-1', ma: 'HOAT_DONG', ten: 'Hoạt động', thu_tu: 1, mau: '#22c55e', trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ttdt-2', ma: 'TAM_NGUNG', ten: 'Tạm ngừng', thu_tu: 2, mau: '#f59e0b', trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ttdt-3', ma: 'KHONG_HD', ten: 'Không hoạt động', thu_tu: 3, mau: '#64748b', trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
];

function normalizeTrangThai(val: unknown): import('../../../../lib/constants').TrangThaiHoatDong {
  if (val === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG;
  if (val === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
  return Number(val) === 0 ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function loadFromStorage(): TrangThaiDoiTac[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TrangThaiDoiTac[];
      return Array.isArray(parsed) ? parsed.map((i) => ({ ...i, trang_thai: normalizeTrangThai(i.trang_thai) })) : [...DEFAULT_SEED];
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_SEED];
}

function saveToStorage(list: TrangThaiDoiTac[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let db: TrangThaiDoiTac[] = loadFromStorage();

export const getTrangThaiDoiTacList = async (): Promise<TrangThaiDoiTac[]> => {
  await delay(300);
  db = loadFromStorage();
  return [...db];
};

export const createTrangThaiDoiTac = async (data: TrangThaiDoiTacFormValues): Promise<TrangThaiDoiTac> => {
  await delay(400);
  db = loadFromStorage();
  const now = new Date().toISOString();
  const newItem: TrangThaiDoiTac = {
    id: `ttdt-${Date.now()}`,
    ma: data.ma.trim(),
    ten: data.ten.trim(),
    thu_tu: data.thu_tu,
    mau: data.mau?.trim() || undefined,
    ghi_chu: data.ghi_chu?.trim() || undefined,
    trang_thai: data.trang_thai,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  db = [newItem, ...db];
  saveToStorage(db);
  return newItem;
};

export const updateTrangThaiDoiTac = async (id: string, data: TrangThaiDoiTacFormValues): Promise<TrangThaiDoiTac> => {
  await delay(400);
  db = loadFromStorage();
  const idx = db.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error(i18n.t('thietLapDeXuatVatTu.doiTac.service.notFound'));
  const updated: TrangThaiDoiTac = {
    ...db[idx],
    ma: data.ma.trim(),
    ten: data.ten.trim(),
    thu_tu: data.thu_tu,
    mau: data.mau?.trim() || undefined,
    ghi_chu: data.ghi_chu?.trim() || undefined,
    trang_thai: data.trang_thai,
    tg_cap_nhat: new Date().toISOString(),
  };
  db[idx] = updated;
  saveToStorage(db);
  return updated;
};

export const updateTrangThaiDoiTacStatus = async (ids: string[], status: import('../../../../lib/constants').TrangThaiHoatDong): Promise<void> => {
  await delay(300);
  db = loadFromStorage();
  db = db.map((i) => (ids.includes(i.id) ? { ...i, trang_thai: status, tg_cap_nhat: new Date().toISOString() } : i));
  saveToStorage(db);
};

export const deleteTrangThaiDoiTacList = async (ids: string[]): Promise<void> => {
  await delay(300);
  db = loadFromStorage();
  db = db.filter((i) => !ids.includes(i.id));
  saveToStorage(db);
};
