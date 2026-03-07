import type { KetQuaBaoCaoKpi } from '../core/types';
import type { BaoCaoKetQuaFormValues } from '../core/schema';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();
const genId = () => `kq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const now = ts();

/** Seed báo cáo kết quả (id_tieu_chi từ tieu-chi-kpi seed, id_phong_ban giả định) */
const seedBaoCao: KetQuaBaoCaoKpi[] = [
  {
    id: 'kq-seed-1',
    id_tieu_chi: 'tck-seed-1',
    id_phong_ban: 'pb-1',
    ky_nam: 2025,
    ky_quy: 1,
    ky_thang: null,
    gia_tri_thuc_te: 4200,
    diem_tinh: 84,
    trang_thai: 'da_danh_gia',
    ghi_chu: 'Đạt 84% so với mục tiêu quý',
    tg_tao: now,
    tg_cap_nhat: now,
  },
  {
    id: 'kq-seed-2',
    id_tieu_chi: 'tck-seed-1',
    id_phong_ban: 'pb-2',
    ky_nam: 2025,
    ky_quy: 1,
    ky_thang: null,
    gia_tri_thuc_te: 3800,
    diem_tinh: 76,
    trang_thai: 'da_gui',
    ghi_chu: null,
    tg_tao: now,
    tg_cap_nhat: now,
  },
  {
    id: 'kq-seed-3',
    id_tieu_chi: 'tck-seed-2',
    id_phong_ban: 'pb-1',
    ky_nam: 2025,
    ky_quy: null,
    ky_thang: null,
    gia_tri_thuc_te: 95,
    diem_tinh: null,
    trang_thai: 'nhap',
    ghi_chu: 'Số KH mới trong năm',
    tg_tao: now,
    tg_cap_nhat: now,
  },
  {
    id: 'kq-seed-4',
    id_tieu_chi: 'tck-seed-4',
    id_phong_ban: 'pb-1',
    ky_nam: 2025,
    ky_quy: null,
    ky_thang: 3,
    gia_tri_thuc_te: 1.8,
    diem_tinh: 90,
    trang_thai: 'da_danh_gia',
    ghi_chu: null,
    tg_tao: now,
    tg_cap_nhat: now,
  },
];

const store: KetQuaBaoCaoKpi[] = [...seedBaoCao];

export interface BaoCaoListParams {
  id_tieu_chi?: string;
  id_phong_ban?: string;
  ky_nam?: number;
  ky_quy?: number;
  ky_thang?: number;
  trang_thai?: string;
}

export async function getBaoCaoList(
  params?: BaoCaoListParams
): Promise<KetQuaBaoCaoKpi[]> {
  await delay(200);
  let list = [...store];
  if (params?.id_tieu_chi) {
    list = list.filter((x) => x.id_tieu_chi === params.id_tieu_chi);
  }
  if (params?.id_phong_ban) {
    list = list.filter((x) => x.id_phong_ban === params.id_phong_ban);
  }
  if (params?.ky_nam != null) {
    list = list.filter((x) => x.ky_nam === params.ky_nam);
  }
  if (params?.ky_quy != null) {
    list = list.filter((x) => x.ky_quy === params.ky_quy);
  }
  if (params?.ky_thang != null) {
    list = list.filter((x) => x.ky_thang === params.ky_thang);
  }
  if (params?.trang_thai) {
    list = list.filter((x) => x.trang_thai === params.trang_thai);
  }
  return list.sort((a, b) =>
    (b.tg_cap_nhat || '').localeCompare(a.tg_cap_nhat || '')
  );
}

export async function getBaoCaoById(id: string): Promise<KetQuaBaoCaoKpi | null> {
  if (!id) return null;
  await delay(100);
  return store.find((x) => x.id === id) ?? null;
}

export async function createBaoCao(
  payload: BaoCaoKetQuaFormValues
): Promise<KetQuaBaoCaoKpi> {
  await delay(300);
  const item: KetQuaBaoCaoKpi = {
    id: genId(),
    id_tieu_chi: payload.id_tieu_chi,
    id_phong_ban: payload.id_phong_ban,
    ky_nam: payload.ky_nam,
    ky_quy: payload.ky_quy ?? null,
    ky_thang: payload.ky_thang ?? null,
    gia_tri_thuc_te: payload.gia_tri_thuc_te,
    diem_tinh: null,
    trang_thai: payload.trang_thai ?? 'nhap',
    ghi_chu: payload.ghi_chu ?? null,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  };
  store.push(item);
  return { ...item };
}

export async function updateBaoCao(
  id: string,
  payload: Partial<BaoCaoKetQuaFormValues>
): Promise<KetQuaBaoCaoKpi> {
  await delay(250);
  const idx = store.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error('BaoCao not found');
  const next = { ...store[idx], ...payload, tg_cap_nhat: ts() };
  store[idx] = next;
  return { ...next };
}

export async function deleteBaoCao(id: string): Promise<void> {
  await delay(200);
  const idx = store.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error('BaoCao not found');
  store.splice(idx, 1);
}
