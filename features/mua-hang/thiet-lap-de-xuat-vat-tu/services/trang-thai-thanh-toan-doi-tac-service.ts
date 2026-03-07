import type { TrangThaiThanhToanDoiTac } from '../core/types';
import type { TrangThaiThanhToanDoiTacFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const STORAGE_KEY = 'thiet_lap_trang_thai_thanh_toan_doi_tac';

const DEFAULT_SEED: TrangThaiThanhToanDoiTac[] = [
  { id: 'tttt-1', ma: 'CHO_THANH_TOAN', ten: 'Chờ thanh toán', thu_tu: 1, mau: '#f59e0b', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'tttt-2', ma: 'DA_THANH_TOAN', ten: 'Đã thanh toán', thu_tu: 2, mau: '#22c55e', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'tttt-3', ma: 'QUA_HAN', ten: 'Quá hạn', thu_tu: 3, mau: '#ef4444', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'tttt-4', ma: 'DA_HUY', ten: 'Đã hủy', thu_tu: 4, mau: '#64748b', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function loadFromStorage(): TrangThaiThanhToanDoiTac[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TrangThaiThanhToanDoiTac[];
      return Array.isArray(parsed) ? parsed : [...DEFAULT_SEED];
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_SEED];
}

function saveToStorage(list: TrangThaiThanhToanDoiTac[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let db: TrangThaiThanhToanDoiTac[] = loadFromStorage();

export const getTrangThaiThanhToanDoiTacList = async (): Promise<TrangThaiThanhToanDoiTac[]> => {
  await delay(300);
  db = loadFromStorage();
  return [...db];
};

export const createTrangThaiThanhToanDoiTac = async (data: TrangThaiThanhToanDoiTacFormValues): Promise<TrangThaiThanhToanDoiTac> => {
  await delay(400);
  db = loadFromStorage();
  const now = new Date().toISOString();
  const newItem: TrangThaiThanhToanDoiTac = {
    id: `tttt-${Date.now()}`,
    ma: data.ma.trim(),
    ten: data.ten.trim(),
    thu_tu: data.thu_tu,
    mau: data.mau?.trim() || undefined,
    ghi_chu: data.ghi_chu?.trim() || undefined,
    trang_thai: data.trang_thai as 0 | 1,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  db = [newItem, ...db];
  saveToStorage(db);
  return newItem;
};

export const updateTrangThaiThanhToanDoiTac = async (id: string, data: TrangThaiThanhToanDoiTacFormValues): Promise<TrangThaiThanhToanDoiTac> => {
  await delay(400);
  db = loadFromStorage();
  const idx = db.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error(i18n.t('thietLapDeXuatVatTu.thanhToan.service.notFound'));
  const updated: TrangThaiThanhToanDoiTac = {
    ...db[idx],
    ma: data.ma.trim(),
    ten: data.ten.trim(),
    thu_tu: data.thu_tu,
    mau: data.mau?.trim() || undefined,
    ghi_chu: data.ghi_chu?.trim() || undefined,
    trang_thai: data.trang_thai as 0 | 1,
    tg_cap_nhat: new Date().toISOString(),
  };
  db[idx] = updated;
  saveToStorage(db);
  return updated;
};

export const updateTrangThaiThanhToanDoiTacStatus = async (ids: string[], status: 0 | 1): Promise<void> => {
  await delay(300);
  db = loadFromStorage();
  db = db.map((i) => (ids.includes(i.id) ? { ...i, trang_thai: status, tg_cap_nhat: new Date().toISOString() } : i));
  saveToStorage(db);
};

export const deleteTrangThaiThanhToanDoiTacList = async (ids: string[]): Promise<void> => {
  await delay(300);
  db = loadFromStorage();
  db = db.filter((i) => !ids.includes(i.id));
  saveToStorage(db);
};
