import type { TieuChiKpi } from '../core/types';
import type { TieuChiKpiFormValues } from '../core/schema';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();
const genId = () => `tck-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const now = ts();

/** Seed tiêu chí KPI mẫu (gắn với hdl-seed-1, hdl-seed-2) */
const seedTieuChi: TieuChiKpi[] = [
  {
    id: 'tck-seed-1',
    id_hanh_dong: 'hdl-seed-1',
    ma: 'TCK-001',
    ten: 'Doanh thu từ SME (triệu VND)',
    mo_ta: 'Tổng doanh thu từ phân khúc SME',
    don_vi_tinh: 'VND',
    loai: 'xuoi',
    gia_tri_muc_tieu: 5000,
    gia_tri_toi_thieu: 3000,
    cach_tinh_diem: 'TONG',
    tan_suat: 'quy',
    ty_trong: 50,
    thu_tu: 0,
    tg_tao: now,
    tg_cap_nhat: now,
  },
  {
    id: 'tck-seed-2',
    id_hanh_dong: 'hdl-seed-1',
    ma: 'TCK-002',
    ten: 'Số khách hàng SME mới',
    don_vi_tinh: 'NGUOI',
    loai: 'xuoi',
    gia_tri_muc_tieu: 120,
    cach_tinh_diem: 'LUY_KE',
    tan_suat: 'nam',
    ty_trong: 50,
    thu_tu: 1,
    tg_tao: now,
    tg_cap_nhat: now,
  },
  {
    id: 'tck-seed-3',
    id_hanh_dong: 'hdl-seed-2',
    ma: 'TCK-003',
    ten: 'Điểm NPS trung bình',
    mo_ta: 'Net Promoter Score từ survey khách hàng SME',
    don_vi_tinh: 'DIEM',
    loai: 'xuoi',
    gia_tri_muc_tieu: 45,
    gia_tri_toi_thieu: 30,
    cach_tinh_diem: 'TB',
    tan_suat: 'quy',
    ty_trong: 60,
    thu_tu: 0,
    tg_tao: now,
    tg_cap_nhat: now,
  },
  {
    id: 'tck-seed-4',
    id_hanh_dong: 'hdl-seed-2',
    ten: 'Tỷ lệ khiếu nại (giảm)',
    don_vi_tinh: 'PCT',
    loai: 'nguoc',
    gia_tri_muc_tieu: 2,
    cach_tinh_diem: 'TB',
    tan_suat: 'thang',
    ty_trong: 40,
    thu_tu: 1,
    tg_tao: now,
    tg_cap_nhat: now,
  },
  {
    id: 'tck-seed-5',
    id_hanh_dong: 'hdl-seed-4',
    ma: 'TCK-005',
    ten: 'Số nhân sự được lên lương',
    don_vi_tinh: 'NGUOI',
    loai: 'xuoi',
    gia_tri_muc_tieu: 50,
    cach_tinh_diem: 'LUY_KE',
    tan_suat: 'quy',
    ty_trong: 40,
    thu_tu: 0,
    tg_tao: now,
    tg_cap_nhat: now,
  },
  {
    id: 'tck-seed-6',
    id_hanh_dong: 'hdl-seed-4',
    ten: 'Tỷ lệ hoàn thành đào tạo (%)',
    don_vi_tinh: 'PCT',
    loai: 'xuoi',
    gia_tri_muc_tieu: 95,
    cach_tinh_diem: 'TB',
    tan_suat: 'thang',
    ty_trong: 35,
    thu_tu: 1,
    tg_tao: now,
    tg_cap_nhat: now,
  },
  {
    id: 'tck-seed-7',
    id_hanh_dong: 'hdl-seed-4',
    ten: 'Thời gian đào tạo trung bình (ngày)',
    don_vi_tinh: 'NGAY',
    loai: 'nguoc',
    gia_tri_muc_tieu: 5,
    cach_tinh_diem: 'TB',
    tan_suat: 'quy',
    ty_trong: 25,
    thu_tu: 2,
    tg_tao: now,
    tg_cap_nhat: now,
  },
];

const store: TieuChiKpi[] = [...seedTieuChi];

export interface TieuChiListParams {
  id_hanh_dong?: string;
  loai?: string;
  cach_tinh_diem?: string;
  tan_suat?: string;
}

export async function getTieuChiList(
  params?: TieuChiListParams
): Promise<TieuChiKpi[]> {
  await delay(200);
  let list = [...store];
  if (params?.id_hanh_dong) {
    list = list.filter((t) => t.id_hanh_dong === params.id_hanh_dong);
  }
  if (params?.loai) {
    list = list.filter((t) => t.loai === params.loai);
  }
  if (params?.cach_tinh_diem) {
    list = list.filter((t) => t.cach_tinh_diem === params.cach_tinh_diem);
  }
  if (params?.tan_suat) {
    list = list.filter((t) => t.tan_suat === params.tan_suat);
  }
  return list.sort((a, b) => (b.tg_cap_nhat || '').localeCompare(a.tg_cap_nhat || ''));
}

export async function getTieuChiByHanhDongId(
  id_hanh_dong: string
): Promise<TieuChiKpi[]> {
  await delay(150);
  return store
    .filter((t) => t.id_hanh_dong === id_hanh_dong)
    .sort((a, b) => (a.thu_tu ?? 0) - (b.thu_tu ?? 0));
}

export async function getTieuChiById(id: string): Promise<TieuChiKpi | null> {
  if (!id) return null;
  await delay(100);
  return store.find((t) => t.id === id) ?? null;
}

export async function createTieuChiKpi(
  payload: TieuChiKpiFormValues
): Promise<TieuChiKpi> {
  await delay(300);
  const now = ts();
  const item: TieuChiKpi = {
    id: genId(),
    id_hanh_dong: payload.id_hanh_dong,
    ma: payload.ma ?? null,
    ten: payload.ten,
    mo_ta: payload.mo_ta ?? null,
    don_vi_tinh: payload.don_vi_tinh,
    loai: payload.loai,
    gia_tri_muc_tieu: payload.gia_tri_muc_tieu,
    gia_tri_toi_thieu: payload.gia_tri_toi_thieu ?? null,
    cach_tinh_diem: payload.cach_tinh_diem,
    tan_suat: payload.tan_suat,
    ty_trong: payload.ty_trong,
    thu_tu: payload.thu_tu ?? null,
    nguon_du_lieu: payload.nguon_du_lieu ?? null,
    ghi_chu: payload.ghi_chu ?? null,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  store.push(item);
  return { ...item };
}

export async function updateTieuChiKpi(
  id: string,
  payload: Partial<TieuChiKpiFormValues>
): Promise<TieuChiKpi> {
  await delay(300);
  const idx = store.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('TieuChiKpi not found');
  const prev = store[idx];
  const updated: TieuChiKpi = {
    ...prev,
    ...payload,
    id: prev.id,
    id_hanh_dong: prev.id_hanh_dong,
    tg_tao: prev.tg_tao,
    tg_cap_nhat: ts(),
  };
  store[idx] = updated;
  return { ...updated };
}

export async function deleteTieuChiKpi(id: string): Promise<void> {
  await delay(200);
  const idx = store.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('TieuChiKpi not found');
  store.splice(idx, 1);
}

/** Chuẩn hóa tỷ trọng của các tiêu chí cùng hành động về tổng 100%. */
export async function rebalanceTyTrongForHanhDong(
  id_hanh_dong: string,
  mode: 'equal' | 'proportional'
): Promise<TieuChiKpi[]> {
  await delay(150);
  const same = store.filter((t) => t.id_hanh_dong === id_hanh_dong);
  if (same.length === 0) return [];
  const total = same.reduce((s, t) => s + t.ty_trong, 0);
  const scale = total <= 0 ? 100 / same.length : 100 / total;
  const now = ts();
  same.forEach((t) => {
    const idx = store.findIndex((x) => x.id === t.id);
    if (idx === -1) return;
    const newTyTrong =
      mode === 'equal'
        ? Math.round((100 / same.length) * 100) / 100
        : Math.round(t.ty_trong * scale * 100) / 100;
    store[idx] = { ...store[idx], ty_trong: newTyTrong, tg_cap_nhat: now };
  });
  return getTieuChiByHanhDongId(id_hanh_dong);
}
