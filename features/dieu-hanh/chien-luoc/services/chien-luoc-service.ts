import type { ChienLuoc } from '../core/types';
import type { ChienLuocFormValues } from '../core/schema';
import { getSwotByYear } from '../../phan-tich-swot/services/swot-service';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();
const genId = () => `cl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const currentYear = new Date().getFullYear();
const now = new Date().toISOString();

/** Seed dữ liệu mẫu chiến lược (khớp với SWOT năm hiện tại: s1–s7, w1–w6, o1–o7, t1–t7) */
const seedChienLuoc: ChienLuoc[] = [
  {
    id: 'cl-seed-1',
    nam: currentYear,
    ma: 'CL-001',
    ten: 'Tăng thị phần nhờ thương hiệu và thị trường SME',
    mo_ta: 'Tận dụng điểm mạnh thương hiệu và đội ngũ kỹ thuật để mở rộng vào phân khúc SME đang tăng trưởng.',
    loai_tows: 'SO',
    nhom_chien_luoc: 'PHAT_TRIEN_TT',
    id_swot_analysis: null,
    id_strengths: ['s1', 's2', 's3'],
    id_weaknesses: [],
    id_opportunities: ['o2', 'o3'],
    id_threats: [],
    trang_thai_duyet: 'da_duyet',
    trang_thai_trien_khai: 'dang_trien_khai',
    id_nguoi_phu_trach: null,
    ngay_bat_dau: `${currentYear}-01-15`,
    ngay_ket_thuc: `${currentYear}-12-31`,
    uu_tien: 1,
    ghi_chu: null,
    tg_tao: now,
    tg_cap_nhat: now,
  },
  {
    id: 'cl-seed-2',
    nam: currentYear,
    ma: 'CL-002',
    ten: 'Đối phó cạnh tranh bằng loyalty và chất lượng',
    mo_ta: 'Dùng lợi thế khách hàng trung thành và chất lượng sản phẩm để giảm tác động cạnh tranh giá và đối thủ mới.',
    loai_tows: 'ST',
    nhom_chien_luoc: 'ON_DINH',
    id_swot_analysis: null,
    id_strengths: ['s2', 's3', 's6'],
    id_weaknesses: [],
    id_opportunities: [],
    id_threats: ['t1', 't3'],
    trang_thai_duyet: 'da_duyet',
    trang_thai_trien_khai: 'dang_trien_khai',
    id_nguoi_phu_trach: null,
    ngay_bat_dau: `${currentYear}-02-01`,
    ngay_ket_thuc: null,
    uu_tien: 2,
    ghi_chu: null,
    tg_tao: now,
    tg_cap_nhat: now,
  },
  {
    id: 'cl-seed-3',
    nam: currentYear,
    ma: 'CL-003',
    ten: 'Phát triển kênh online để bù điểm yếu phân phối',
    mo_ta: 'Tận dụng cơ hội chuyển đổi số và nền tảng online để cải thiện kênh phân phối còn hạn chế.',
    loai_tows: 'WO',
    nhom_chien_luoc: 'PHAT_TRIEN_SP',
    id_swot_analysis: null,
    id_strengths: [],
    id_weaknesses: ['w2', 'w4'],
    id_opportunities: ['o3', 'o6'],
    id_threats: [],
    trang_thai_duyet: 'cho_duyet',
    trang_thai_trien_khai: 'chua_bat_dau',
    id_nguoi_phu_trach: null,
    ngay_bat_dau: null,
    ngay_ket_thuc: null,
    uu_tien: 3,
    ghi_chu: 'Chờ HĐQT phê duyệt.',
    tg_tao: now,
    tg_cap_nhat: now,
  },
  {
    id: 'cl-seed-4',
    nam: currentYear,
    ma: 'CL-004',
    ten: 'Tái cấu trúc chi phí và tập trung phân khúc',
    mo_ta: 'Giảm chi phí vận hành, tối ưu quy trình để đối phó cạnh tranh giá và biến động lãi suất.',
    loai_tows: 'WT',
    nhom_chien_luoc: 'THU_HEP',
    id_swot_analysis: null,
    id_strengths: [],
    id_weaknesses: ['w3', 'w4', 'w6'],
    id_opportunities: [],
    id_threats: ['t3', 't6'],
    trang_thai_duyet: 'da_duyet',
    trang_thai_trien_khai: 'tam_ngung',
    id_nguoi_phu_trach: null,
    ngay_bat_dau: `${currentYear}-03-01`,
    ngay_ket_thuc: `${currentYear}-06-30`,
    uu_tien: 4,
    ghi_chu: 'Tạm ngưng đánh giá lại hiệu quả.',
    tg_tao: now,
    tg_cap_nhat: now,
  },
  {
    id: 'cl-seed-5',
    nam: currentYear - 1,
    ma: 'CL-005',
    ten: 'Hội nhập ngang – mở rộng thị phần qua M&A',
    mo_ta: 'Mua lại hoặc liên minh với đối thủ cùng ngành để tăng thị phần và năng lực cung ứng.',
    loai_tows: 'SO',
    nhom_chien_luoc: 'HOI_NHAP_NGANG',
    id_swot_analysis: null,
    id_strengths: ['s4', 's5'],
    id_weaknesses: [],
    id_opportunities: ['o2', 'o7'],
    id_threats: [],
    trang_thai_duyet: 'da_duyet',
    trang_thai_trien_khai: 'hoan_thanh',
    id_nguoi_phu_trach: null,
    ngay_bat_dau: `${currentYear - 1}-01-01`,
    ngay_ket_thuc: `${currentYear - 1}-11-30`,
    uu_tien: 1,
    ghi_chu: null,
    tg_tao: now,
    tg_cap_nhat: now,
  },
];

const store: ChienLuoc[] = [...seedChienLuoc];

export { getSwotByYear };

export interface ChienLuocListParams {
  nam?: number;
}

export async function getChienLuocList(params?: ChienLuocListParams): Promise<ChienLuoc[]> {
  await delay(200);
  let list = [...store];
  if (params?.nam != null) {
    list = list.filter((c) => c.nam === params.nam);
  }
  return list.sort((a, b) => {
    if (a.nam !== b.nam) return b.nam - a.nam;
    return (b.tg_tao || '').localeCompare(a.tg_tao || '');
  });
}

export async function getChienLuocById(id: string | undefined): Promise<ChienLuoc | null> {
  if (!id) return null;
  await delay(150);
  return store.find((c) => c.id === id) ?? null;
}

export async function createChienLuoc(payload: ChienLuocFormValues): Promise<ChienLuoc> {
  await delay(300);
  const now = ts();
  const item: ChienLuoc = {
    id: genId(),
    nam: payload.nam,
    ma: payload.ma ?? null,
    ten: payload.ten,
    mo_ta: payload.mo_ta ?? null,
    loai_tows: payload.loai_tows,
    nhom_chien_luoc: payload.nhom_chien_luoc,
    id_swot_analysis: payload.id_swot_analysis ?? null,
    id_strengths: payload.id_strengths ?? [],
    id_weaknesses: payload.id_weaknesses ?? [],
    id_opportunities: payload.id_opportunities ?? [],
    id_threats: payload.id_threats ?? [],
    trang_thai_duyet: payload.trang_thai_duyet ?? 'cho_duyet',
    trang_thai_trien_khai: payload.trang_thai_trien_khai ?? 'chua_bat_dau',
    id_nguoi_phu_trach: payload.id_nguoi_phu_trach ?? null,
    ngay_bat_dau: payload.ngay_bat_dau ?? null,
    ngay_ket_thuc: payload.ngay_ket_thuc ?? null,
    uu_tien: payload.uu_tien ?? null,
    ghi_chu: payload.ghi_chu ?? null,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  store.push(item);
  return { ...item };
}

export async function updateChienLuoc(
  id: string,
  payload: Partial<ChienLuocFormValues>
): Promise<ChienLuoc> {
  await delay(300);
  const idx = store.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('ChienLuoc not found');
  const prev = store[idx];
  const updated: ChienLuoc = {
    ...prev,
    ...payload,
    id: prev.id,
    tg_tao: prev.tg_tao,
    tg_cap_nhat: ts(),
  };
  store[idx] = updated;
  return { ...updated };
}

export async function deleteChienLuoc(id: string): Promise<void> {
  await delay(200);
  const idx = store.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('ChienLuoc not found');
  store.splice(idx, 1);
}
