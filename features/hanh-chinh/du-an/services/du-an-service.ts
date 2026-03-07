import type { DuAn } from '../core/types';
import type { DuAnFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { MOCK_DU_AN } from '../../../../mocks/cong-viec';

const STORAGE_KEY = 'du_an_list';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizePhongBan(ids: string | string[] | undefined): string[] {
  if (Array.isArray(ids)) return ids.filter(Boolean);
  if (typeof ids === 'string' && ids) return [ids];
  return [];
}

function loadFromStorage(): DuAn[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw) as DuAn[];
      return list.map((item) => ({
        ...item,
        id_phong_ban: normalizePhongBan(item.id_phong_ban),
      }));
    }
    const seed = JSON.parse(JSON.stringify(MOCK_DU_AN)) as DuAn[];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  } catch {
    // ignore
  }
  return [];
}

function saveToStorage(list: DuAn[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export const getDuAnList = async (): Promise<DuAn[]> => {
  await delay(500);
  return loadFromStorage();
};

export const getDuAnById = async (id: string): Promise<DuAn | null> => {
  await delay(300);
  const list = loadFromStorage();
  return list.find((i) => i.id === id) ?? null;
};

export const createDuAn = async (
  data: DuAnFormValues,
  ten_phong_ban?: string
): Promise<DuAn> => {
  await delay(600);
  const list = loadFromStorage();
  const now = new Date().toISOString();
  const newItem: DuAn = {
    id: `da-${Date.now()}`,
    ma_du_an: data.ma_du_an,
    ten_du_an: data.ten_du_an,
    id_phong_ban: Array.isArray(data.id_phong_ban) ? data.id_phong_ban : [data.id_phong_ban].filter(Boolean),
    ten_phong_ban: ten_phong_ban ?? undefined,
    ngay_bat_dau: data.ngay_bat_dau,
    ngay_ket_thuc: data.ngay_ket_thuc,
    muc_tieu: data.muc_tieu ?? '',
    mo_ta: data.mo_ta ?? '',
    trang_thai: data.trang_thai as 0 | 1,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  list.unshift(newItem);
  saveToStorage(list);
  return newItem;
};

export const updateDuAn = async (
  id: string,
  data: DuAnFormValues,
  ten_phong_ban?: string
): Promise<DuAn> => {
  await delay(600);
  const list = loadFromStorage();
  const index = list.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('duAn.service.notFound'));
  const updated: DuAn = {
    ...list[index],
    ma_du_an: data.ma_du_an,
    ten_du_an: data.ten_du_an,
    id_phong_ban: Array.isArray(data.id_phong_ban) ? data.id_phong_ban : [data.id_phong_ban].filter(Boolean),
    ten_phong_ban: ten_phong_ban ?? list[index].ten_phong_ban,
    ngay_bat_dau: data.ngay_bat_dau,
    ngay_ket_thuc: data.ngay_ket_thuc,
    muc_tieu: data.muc_tieu ?? '',
    mo_ta: data.mo_ta ?? '',
    trang_thai: data.trang_thai as 0 | 1,
    tg_cap_nhat: new Date().toISOString(),
  };
  list[index] = updated;
  saveToStorage(list);
  return updated;
};

export const deleteDuAnList = async (ids: string[]): Promise<void> => {
  await delay(400);
  const list = loadFromStorage().filter((i) => !ids.includes(i.id));
  saveToStorage(list);
};

/** Import nhiều dự án từ Excel (chỉ thêm mới). */
export const importDuAnList = async (
  rows: Array<{
    ma_du_an: string;
    ten_du_an: string;
    id_phong_ban?: string;
    ngay_bat_dau: string;
    ngay_ket_thuc: string;
    muc_tieu?: string;
    mo_ta?: string;
    trang_thai?: number;
  }>
): Promise<{ created: number; errors: string[] }> => {
  await delay(500);
  const errors: string[] = [];
  const list = loadFromStorage();
  const initialLen = list.length;
  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      const ma = String(row.ma_du_an ?? '').trim();
      const ten = String(row.ten_du_an ?? '').trim();
      if (!ma || !ten) {
        errors.push(`Dòng ${i + 2}: Thiếu mã hoặc tên dự án`);
        continue;
      }
      const idPhongBan = row.id_phong_ban ? String(row.id_phong_ban).trim() : '';
      const ngayBatDau = String(row.ngay_bat_dau ?? '').trim();
      const ngayKetThuc = String(row.ngay_ket_thuc ?? '').trim();
      if (!ngayBatDau || !ngayKetThuc) {
        errors.push(`Dòng ${i + 2}: Thiếu ngày bắt đầu hoặc kết thúc`);
        continue;
      }
      const now = new Date().toISOString();
      const newItem: DuAn = {
        id: `da-${Date.now()}-${i}`,
        ma_du_an: ma,
        ten_du_an: ten,
        id_phong_ban: idPhongBan ? [idPhongBan] : [],
        ten_phong_ban: undefined,
        ngay_bat_dau: ngayBatDau,
        ngay_ket_thuc: ngayKetThuc,
        muc_tieu: row.muc_tieu != null ? String(row.muc_tieu).trim() : '',
        mo_ta: row.mo_ta != null ? String(row.mo_ta).trim() : '',
        trang_thai: Number(row.trang_thai) === 0 ? 0 : 1,
        tg_tao: now,
        tg_cap_nhat: now,
      };
      list.unshift(newItem);
    } catch (e: unknown) {
      errors.push(`Dòng ${i + 2}: ${(e as Error).message || 'Lỗi'}`);
    }
  }
  const created = list.length - initialLen;
  if (created > 0) saveToStorage(list);
  return { created, errors };
}
