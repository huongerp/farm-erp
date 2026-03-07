import type { HanhDongCotLoi } from '../core/types';
import type { HanhDongCotLoiFormValues } from '../core/schema';
import { getNhomHanhDongDefault } from '../core/constants';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();
const genId = () => `hdl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const currentYear = new Date().getFullYear();
const now = ts();

/** Seed vài hành động mẫu (gắn với cl-seed-1, cl-seed-2 đã duyệt) */
const seedHanhDong: HanhDongCotLoi[] = [
  {
    id: 'hdl-seed-1',
    id_chien_luoc: 'cl-seed-1',
    ma: 'HDL-001',
    ten: 'Tăng doanh thu từ phân khúc SME',
    mo_ta: 'Triển khai kênh bán hàng và chương trình ưu đãi cho SME.',
    bsc_dimension: 'tai_chinh',
    nhom_hanh_dong: 'TANG',
    ty_trong: 40,
    thu_tu: 0,
    tg_tao: now,
    tg_cap_nhat: now,
  },
  {
    id: 'hdl-seed-2',
    id_chien_luoc: 'cl-seed-1',
    ma: 'HDL-002',
    ten: 'Nâng cao hài lòng khách hàng SME',
    mo_ta: 'Survey NPS và cải thiện hỗ trợ sau bán.',
    bsc_dimension: 'khach_hang',
    nhom_hanh_dong: 'CAI_THIEN',
    ty_trong: 35,
    thu_tu: 1,
    tg_tao: now,
    tg_cap_nhat: now,
  },
  {
    id: 'hdl-seed-3',
    id_chien_luoc: 'cl-seed-1',
    ma: 'HDL-003',
    ten: 'Tối ưu quy trình chăm sóc khách hàng',
    bsc_dimension: 'quy_trinh',
    nhom_hanh_dong: 'TOI_UU_HOA',
    ty_trong: 25,
    thu_tu: 2,
    tg_tao: now,
    tg_cap_nhat: now,
  },
  {
    id: 'hdl-seed-4',
    id_chien_luoc: 'cl-seed-2',
    ma: 'HDL-004',
    ten: 'Duy trì chất lượng sản phẩm',
    mo_ta: 'Audit định kỳ và kiểm soát đầu vào.',
    bsc_dimension: 'quy_trinh',
    nhom_hanh_dong: 'DUY_TRI',
    ty_trong: 50,
    thu_tu: 0,
    tg_tao: now,
    tg_cap_nhat: now,
  },
  {
    id: 'hdl-seed-5',
    id_chien_luoc: 'cl-seed-2',
    ma: 'HDL-005',
    ten: 'Đảm bảo tỷ lệ giữ chân khách hàng',
    bsc_dimension: 'khach_hang',
    nhom_hanh_dong: 'DAM_BAO',
    ty_trong: 50,
    thu_tu: 1,
    tg_tao: now,
    tg_cap_nhat: now,
  },
];

const store: HanhDongCotLoi[] = [...seedHanhDong];

export interface HanhDongListParams {
  id_chien_luoc?: string;
  nam?: number;
  bsc_dimension?: string;
  nhom_hanh_dong?: string;
}

export async function getHanhDongList(
  params?: HanhDongListParams,
  chienLuocMap?: Map<string, { nam: number }>
): Promise<HanhDongCotLoi[]> {
  await delay(200);
  let list = [...store];
  if (params?.id_chien_luoc) {
    list = list.filter((h) => h.id_chien_luoc === params.id_chien_luoc);
  }
  if (params?.nam != null && chienLuocMap) {
    list = list.filter((h) => chienLuocMap.get(h.id_chien_luoc)?.nam === params.nam);
  }
  if (params?.bsc_dimension) {
    list = list.filter((h) => h.bsc_dimension === params.bsc_dimension);
  }
  if (params?.nhom_hanh_dong) {
    list = list.filter((h) => h.nhom_hanh_dong === params.nhom_hanh_dong);
  }
  return list.sort((a, b) => (b.tg_cap_nhat || '').localeCompare(a.tg_cap_nhat || ''));
}

export async function getHanhDongByChienLuocId(
  id_chien_luoc: string
): Promise<HanhDongCotLoi[]> {
  await delay(150);
  return store
    .filter((h) => h.id_chien_luoc === id_chien_luoc)
    .sort((a, b) => (a.thu_tu ?? 0) - (b.thu_tu ?? 0));
}

export async function getHanhDongById(id: string): Promise<HanhDongCotLoi | null> {
  if (!id) return null;
  await delay(100);
  return store.find((h) => h.id === id) ?? null;
}

export async function createHanhDongCotLoi(
  payload: HanhDongCotLoiFormValues
): Promise<HanhDongCotLoi> {
  await delay(300);
  const now = ts();
  const item: HanhDongCotLoi = {
    id: genId(),
    id_chien_luoc: payload.id_chien_luoc,
    ma: payload.ma ?? null,
    ten: payload.ten,
    mo_ta: payload.mo_ta ?? null,
    bsc_dimension: payload.bsc_dimension,
    nhom_hanh_dong: payload.nhom_hanh_dong,
    ty_trong: payload.ty_trong,
    thu_tu: payload.thu_tu ?? null,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  store.push(item);
  return { ...item };
}

export async function updateHanhDongCotLoi(
  id: string,
  payload: Partial<HanhDongCotLoiFormValues>
): Promise<HanhDongCotLoi> {
  await delay(300);
  const idx = store.findIndex((h) => h.id === id);
  if (idx === -1) throw new Error('HanhDongCotLoi not found');
  const prev = store[idx];
  const updated: HanhDongCotLoi = {
    ...prev,
    ...payload,
    id: prev.id,
    id_chien_luoc: prev.id_chien_luoc,
    tg_tao: prev.tg_tao,
    tg_cap_nhat: ts(),
  };
  store[idx] = updated;
  return { ...updated };
}

export async function deleteHanhDongCotLoi(id: string): Promise<void> {
  await delay(200);
  const idx = store.findIndex((h) => h.id === id);
  if (idx === -1) throw new Error('HanhDongCotLoi not found');
  store.splice(idx, 1);
}

/** Chuẩn hóa tỷ trọng của các hành động cùng chiến lược về tổng 100% (chia đều). Cập nhật store và trả về danh sách đã cân bằng. */
export async function rebalanceTyTrongForChienLuoc(
  id_chien_luoc: string,
  mode: 'equal' | 'proportional'
): Promise<HanhDongCotLoi[]> {
  await delay(150);
  const same = store.filter((h) => h.id_chien_luoc === id_chien_luoc);
  if (same.length === 0) return [];
  const total = same.reduce((s, h) => s + h.ty_trong, 0);
  const scale = total <= 0 ? 100 / same.length : 100 / total;
  const now = ts();
  same.forEach((h, i) => {
    const idx = store.findIndex((x) => x.id === h.id);
    if (idx === -1) return;
    const newTyTrong =
      mode === 'equal'
        ? Math.round((100 / same.length) * 100) / 100
        : Math.round(h.ty_trong * scale * 100) / 100;
    store[idx] = { ...store[idx], ty_trong: newTyTrong, tg_cap_nhat: now };
  });
  return getHanhDongByChienLuocId(id_chien_luoc);
}
