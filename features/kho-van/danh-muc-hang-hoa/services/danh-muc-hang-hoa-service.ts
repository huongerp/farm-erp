import type { DanhMucHangHoa } from '../core/types';
import type { DanhMucHangHoaFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();

const seed: DanhMucHangHoa[] = [
  { id: 'dmhh-1', ma_danh_muc: 'NHOM-01', ten_danh_muc: 'Vật tư văn phòng', id_cha: null, thu_tu: 0, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dmhh-2', ma_danh_muc: 'NHOM-02', ten_danh_muc: 'Nguyên vật liệu', id_cha: null, thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dmhh-3', ma_danh_muc: 'VT-001', ten_danh_muc: 'Giấy A4', id_cha: 'dmhh-1', thu_tu: 0, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dmhh-4', ma_danh_muc: 'VT-002', ten_danh_muc: 'Bút bi', id_cha: 'dmhh-1', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
];

let db: DanhMucHangHoa[] = JSON.parse(JSON.stringify(seed));

export const getAllDanhMucHangHoa = async (): Promise<DanhMucHangHoa[]> => {
  await delay(400);
  return [...db];
};

export const getDanhMucHangHoaById = async (id: string): Promise<DanhMucHangHoa | null> => {
  await delay(200);
  return db.find((d) => d.id === id) ?? null;
};

export const createDanhMucHangHoa = async (
  data: DanhMucHangHoaFormValues
): Promise<DanhMucHangHoa> => {
  await delay(500);
  const id = `dmhh-${Date.now()}`;
  const newItem: DanhMucHangHoa = {
    id,
    ma_danh_muc: data.ma_danh_muc.trim().toUpperCase(),
    ten_danh_muc: data.ten_danh_muc.trim(),
    id_cha: data.id_cha && data.id_cha.trim() ? data.id_cha : null,
    thu_tu: data.thu_tu ?? 0,
    mo_ta: data.mo_ta?.trim() || undefined,
    trang_thai: data.trang_thai as 0 | 1,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  };
  db = [...db, newItem];
  return newItem;
};

export const updateDanhMucHangHoa = async (
  id: string,
  data: DanhMucHangHoaFormValues
): Promise<DanhMucHangHoa> => {
  await delay(500);
  const index = db.findIndex((d) => d.id === id);
  if (index === -1) throw new Error(i18n.t('danhMucHangHoa.service.notFound'));
  const existing = db[index];
  const updated: DanhMucHangHoa = {
    ...existing,
    ma_danh_muc: data.ma_danh_muc.trim().toUpperCase(),
    ten_danh_muc: data.ten_danh_muc.trim(),
    id_cha: data.id_cha && data.id_cha.trim() ? data.id_cha : null,
    thu_tu: data.thu_tu ?? existing.thu_tu,
    mo_ta: data.mo_ta?.trim() || undefined,
    trang_thai: data.trang_thai as 0 | 1,
    tg_cap_nhat: ts(),
  };
  db[index] = updated;
  return updated;
};

export const deleteDanhMucHangHoa = async (id: string): Promise<void> => {
  await delay(400);
  const hasChildren = db.some((d) => d.id_cha === id);
  if (hasChildren) throw new Error(i18n.t('danhMucHangHoa.service.hasChildren'));
  db = db.filter((d) => d.id !== id);
};

export const deleteDanhMucHangHoaMany = async (ids: string[]): Promise<void> => {
  await delay(500);
  for (const id of ids) {
    const hasChildren = db.some((d) => d.id_cha === id);
    if (hasChildren) throw new Error(i18n.t('danhMucHangHoa.service.hasChildren'));
  }
  db = db.filter((d) => !ids.includes(d.id));
}
