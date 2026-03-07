import type { HangHoa } from '../core/types';
import type { HangHoaFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { getAllDanhMucHangHoa } from '../../danh-muc-hang-hoa/services/danh-muc-hang-hoa-service';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();

/** Raw row in memory (no ten_danh_muc). */
type HangHoaRow = Omit<HangHoa, 'ten_danh_muc'> & { ten_danh_muc?: string };

const seed: HangHoaRow[] = [
  { id: 'hh-1', ma_hang: 'SP-001', ten_hang: 'Giấy A4 70gsm', id_danh_muc: 'dmhh-3', thu_tu: 0, trang_thai: 1, don_vi_tinh: 'Ram', ton_toi_thieu: 50, mo_ta: 'Giấy in A4 định lượng 70g/m²', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'hh-2', ma_hang: 'SP-002', ten_hang: 'Bút bi xanh', id_danh_muc: 'dmhh-4', thu_tu: 1, trang_thai: 1, don_vi_tinh: 'Cái', ton_toi_thieu: 100, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'hh-3', ma_hang: 'SP-003', ten_hang: 'Bút bi đen', id_danh_muc: 'dmhh-4', thu_tu: 2, trang_thai: 1, don_vi_tinh: 'Cái', ton_toi_thieu: 80, mo_ta: 'Bút bi ngòi 0.5mm', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'hh-4', ma_hang: 'SP-004', ten_hang: 'Giấy A4 80gsm', id_danh_muc: 'dmhh-3', thu_tu: 3, trang_thai: 1, don_vi_tinh: 'Ram', ton_toi_thieu: 30, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'hh-5', ma_hang: 'SP-005', ten_hang: 'Bìa màu A4', id_danh_muc: 'dmhh-1', thu_tu: 4, trang_thai: 1, don_vi_tinh: 'Tờ', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'hh-6', ma_hang: 'SP-006', ten_hang: 'Kẹp ghim', id_danh_muc: 'dmhh-1', thu_tu: 5, trang_thai: 1, don_vi_tinh: 'Hộp', ton_toi_thieu: 20, mo_ta: 'Kẹp ghim 50 cái/hộp', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'hh-7', ma_hang: 'SP-007', ten_hang: 'Bột mì', id_danh_muc: 'dmhh-2', thu_tu: 6, trang_thai: 1, don_vi_tinh: 'Kg', ton_toi_thieu: 200, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'hh-8', ma_hang: 'SP-008', ten_hang: 'Đường trắng', id_danh_muc: 'dmhh-2', thu_tu: 7, trang_thai: 1, don_vi_tinh: 'Kg', ton_toi_thieu: 150, mo_ta: 'Đường tinh luyện', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'hh-9', ma_hang: 'SP-009', ten_hang: 'Hàng tồn (ngừng)', id_danh_muc: null, thu_tu: 8, trang_thai: 0, don_vi_tinh: 'Cái', mo_ta: 'Hàng mẫu không còn bán', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'hh-10', ma_hang: 'SP-010', ten_hang: 'Tẩy trắng', id_danh_muc: 'dmhh-1', thu_tu: 9, trang_thai: 1, don_vi_tinh: 'Cái', ton_toi_thieu: 50, tg_tao: ts(), tg_cap_nhat: ts() },
];

let db: HangHoaRow[] = JSON.parse(JSON.stringify(seed));

async function enrichWithTenDanhMuc<T extends { id_danh_muc: string | null }>(items: T[]): Promise<(T & { ten_danh_muc?: string })[]> {
  const dmList = await getAllDanhMucHangHoa();
  const map: Record<string, string> = {};
  dmList.forEach((d) => { map[d.id] = d.ten_danh_muc; });
  return items.map((item) => ({
    ...item,
    ten_danh_muc: item.id_danh_muc ? map[item.id_danh_muc] ?? undefined : undefined,
  }));
}

export const getAllHangHoa = async (): Promise<HangHoa[]> => {
  await delay(400);
  const sorted = [...db].sort((a, b) => a.thu_tu - b.thu_tu || a.ma_hang.localeCompare(b.ma_hang));
  return enrichWithTenDanhMuc(sorted) as Promise<HangHoa[]>;
};

export const getHangHoaById = async (id: string): Promise<HangHoa | null> => {
  await delay(200);
  const row = db.find((h) => h.id === id) ?? null;
  if (!row) return null;
  const [enriched] = await enrichWithTenDanhMuc([row]);
  return enriched as HangHoa;
};

export const createHangHoa = async (data: HangHoaFormValues): Promise<HangHoa> => {
  await delay(500);
  const code = data.ma_hang.trim().toUpperCase();
  const existing = db.some((h) => h.ma_hang === code);
  if (existing) throw new Error(i18n.t('hangHoa.service.duplicateCode'));

  const id = `hh-${Date.now()}`;
  const row: HangHoaRow = {
    id,
    ma_hang: code,
    ten_hang: data.ten_hang.trim(),
    id_danh_muc: data.id_danh_muc && data.id_danh_muc.trim() ? data.id_danh_muc : null,
    don_vi_tinh: data.don_vi_tinh?.trim() || undefined,
    ton_toi_thieu: data.ton_toi_thieu != null && data.ton_toi_thieu >= 0 ? data.ton_toi_thieu : undefined,
    mo_ta: data.mo_ta?.trim() || undefined,
    hinh_anh: data.hinh_anh || undefined,
    trang_thai: data.trang_thai as 0 | 1,
    thu_tu: data.thu_tu ?? 0,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  };
  db = [...db, row];
  const [enriched] = await enrichWithTenDanhMuc([row]);
  return enriched as HangHoa;
};

export const updateHangHoa = async (id: string, data: HangHoaFormValues): Promise<HangHoa> => {
  await delay(500);
  const index = db.findIndex((h) => h.id === id);
  if (index === -1) throw new Error(i18n.t('hangHoa.service.notFound'));

  const code = data.ma_hang.trim().toUpperCase();
  const other = db.find((h) => h.id !== id && h.ma_hang === code);
  if (other) throw new Error(i18n.t('hangHoa.service.duplicateCode'));

  const row: HangHoaRow = {
    ...db[index],
    ma_hang: code,
    ten_hang: data.ten_hang.trim(),
    id_danh_muc: data.id_danh_muc && data.id_danh_muc.trim() ? data.id_danh_muc : null,
    don_vi_tinh: data.don_vi_tinh?.trim() || undefined,
    ton_toi_thieu: data.ton_toi_thieu != null && data.ton_toi_thieu >= 0 ? data.ton_toi_thieu : undefined,
    mo_ta: data.mo_ta?.trim() || undefined,
    hinh_anh: data.hinh_anh ?? undefined,
    trang_thai: data.trang_thai as 0 | 1,
    thu_tu: data.thu_tu ?? db[index].thu_tu,
    tg_cap_nhat: ts(),
  };
  db[index] = row;
  const [enriched] = await enrichWithTenDanhMuc([row]);
  return enriched as HangHoa;
};

export const deleteHangHoa = async (id: string): Promise<void> => {
  await delay(400);
  const index = db.findIndex((h) => h.id === id);
  if (index === -1) throw new Error(i18n.t('hangHoa.service.notFound'));
  db = db.filter((h) => h.id !== id);
};

export const deleteHangHoaMany = async (ids: string[]): Promise<void> => {
  await delay(500);
  db = db.filter((h) => !ids.includes(h.id));
};
