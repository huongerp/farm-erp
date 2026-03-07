import type { TaiLieu } from '../core/types';
import type { TaiLieuFormValues } from '../core/schema';
import { MOCK_TAI_LIEU, MOCK_LOAI_TAI_LIEU, MOCK_TRANG_THAI_TAI_LIEU, MOCK_NHOM_TAI_LIEU, PHONG_BAN_NAMES } from '../../../../mocks/hanh-chinh';
import i18n from '../../../../lib/i18n';

let db: TaiLieu[] = Array.isArray(MOCK_TAI_LIEU)
  ? JSON.parse(JSON.stringify(MOCK_TAI_LIEU))
  : [];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function enrichTaiLieu(item: TaiLieu): TaiLieu {
  const loai = MOCK_LOAI_TAI_LIEU.find((l) => l.id === item.id_loai);
  const tt = MOCK_TRANG_THAI_TAI_LIEU.find((t) => t.id === item.id_trang_thai);
  const ten_phong_ban = item.id_phong_ban ? PHONG_BAN_NAMES[item.id_phong_ban] : undefined;
  const nhom = item.id_nhom_tai_lieu ? MOCK_NHOM_TAI_LIEU.find((n) => n.id === item.id_nhom_tai_lieu) : undefined;
  return {
    ...item,
    ten_loai: loai?.ten,
    ma_loai: loai?.ma,
    ten_trang_thai: tt?.ten,
    mau_trang_thai: tt?.mau,
    ten_phong_ban,
    ten_nhom_tai_lieu: nhom?.ten,
  };
}

export const getTaiLieuList = async (): Promise<TaiLieu[]> => {
  await delay(400);
  return db.map(enrichTaiLieu);
};

export const getTaiLieuById = async (id: string): Promise<TaiLieu | null> => {
  await delay(200);
  const item = db.find((i) => i.id === id) ?? null;
  return item ? enrichTaiLieu(item) : null;
};

export const createTaiLieu = async (data: TaiLieuFormValues): Promise<TaiLieu> => {
  await delay(500);
  const now = new Date().toISOString();
  const newItem: TaiLieu = {
    id: `tl-${Date.now()}`,
    ma_so: data.ma_so?.trim() || undefined,
    huong: data.huong,
    id_loai: data.id_loai,
    id_trang_thai: data.id_trang_thai,
    trich_yeu: data.trich_yeu,
    so_den: data.so_den,
    ngay_den: data.ngay_den,
    noi_gui: data.noi_gui,
    so_di: data.so_di,
    ngay_ky: data.ngay_ky,
    noi_nhan: data.noi_nhan,
    id_phong_ban: data.id_phong_ban,
    id_nhom_tai_lieu: data.id_nhom_tai_lieu,
    ghi_chu: data.ghi_chu,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  db = [newItem, ...db];
  return enrichTaiLieu(newItem);
};

export const updateTaiLieu = async (id: string, data: TaiLieuFormValues): Promise<TaiLieu> => {
  await delay(500);
  const idx = db.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error(i18n.t('taiLieu.service.notFound'));
  const updated: TaiLieu = {
    ...db[idx],
    ...data,
    tg_cap_nhat: new Date().toISOString(),
  };
  db[idx] = updated;
  return enrichTaiLieu(updated);
};

export const deleteTaiLieuList = async (ids: string[]): Promise<void> => {
  await delay(400);
  db = db.filter((i) => !ids.includes(i.id));
};

export const updateTaiLieuPhanQuyen = async (id: string, id_chuc_vu_xem: string[]): Promise<TaiLieu> => {
  await delay(300);
  const idx = db.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error(i18n.t('taiLieu.service.notFound'));
  const updated: TaiLieu = { ...db[idx], id_chuc_vu_xem, tg_cap_nhat: new Date().toISOString() };
  db[idx] = updated;
  return enrichTaiLieu(updated);
};

// --- Ghim tài liệu (theo user) ---
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

export const getTaiLieuGhimIds = async (): Promise<string[]> => {
  await delay(200);
  const userId = getCurrentUserId();
  return ghimByUser[userId] ?? [];
};

export const toggleTaiLieuGhim = async (idTaiLieu: string): Promise<{ pinned: boolean }> => {
  await delay(300);
  const userId = getCurrentUserId();
  const list = ghimByUser[userId] ?? [];
  const idx = list.indexOf(idTaiLieu);
  let pinned: boolean;
  if (idx >= 0) {
    list.splice(idx, 1);
    pinned = false;
  } else {
    list.push(idTaiLieu);
    pinned = true;
  }
  ghimByUser[userId] = list;
  return { pinned };
};
