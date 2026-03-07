import type {
  DotKiemKe,
  ChiTietKiemKe,
  DotKiemKeCreate,
  ChiTietKiemKeUpdate,
  TrangThaiDotKiemKe,
  KetQuaKiemKe,
} from '../core/types';
import { getTaiSanList, updateTaiSanFromKiemKe } from '../../danh-muc-tai-san/services/danh-muc-tai-san-service';
import { getAssetStorageLocations } from '../../thiet-lap-tai-san/services/noi-luu-service';
import { getAssetStatuses } from '../../thiet-lap-tai-san/services/trang-thai-service';
import { getBranches } from '@/features/he-thong/chi-nhanh/services/chi-nhanh-service';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';

/** Bộ lọc phạm vi khi tạo danh sách kiểm kê (chi nhánh, vị trí, người giữ) */
export interface TaoDanhSachKiemKeFilters {
  id_chi_nhanh?: string[];
  id_noi_luu?: string[];
  id_nguoi_giu?: string[];
}

const now = () => new Date().toISOString();

let dbDot: DotKiemKe[] = [
  {
    id: 'dot-1',
    ma_dot: 'KK-Q1-2025',
    ten_dot: 'Kiểm kê tài sản Q1/2025',
    ngay_bat_dau: '2025-01-01',
    ngay_ket_thuc: '2025-01-15',
    trang_thai: 'hoan_thanh',
    id_nguoi_phu_trach: 'emp-000',
    ten_nguoi_phu_trach: 'Lê Minh Công',
    ma_nguoi_phu_trach: 'NV000',
    id_nhom: [],
    id_noi_luu: [],
    ghi_chu: 'Đợt kiểm kê định kỳ',
    trang_thai_active: 1,
    tg_tao: '2025-01-01T08:00:00Z',
    tg_cap_nhat: '2025-01-20T10:00:00Z',
  },
  {
    id: 'dot-2',
    ma_dot: 'KK-DX-02',
    ten_dot: 'Kiểm kê đột xuất tháng 2',
    ngay_bat_dau: '2025-02-10',
    ngay_ket_thuc: '2025-02-14',
    trang_thai: 'dang_kiem_ke',
    id_nguoi_phu_trach: 'emp-001',
    ten_nguoi_phu_trach: 'Nguyễn Văn Thành',
    ma_nguoi_phu_trach: 'NV001',
    id_nhom: ['nhom-2'],
    id_noi_luu: [],
    ghi_chu: null,
    trang_thai_active: 1,
    tg_tao: '2025-02-05T08:00:00Z',
    tg_cap_nhat: '2025-02-10T09:00:00Z',
  },
  {
    id: 'dot-3',
    ma_dot: 'KK-DRAFT',
    ten_dot: 'Đợt kiểm kê dự thảo',
    ngay_bat_dau: '2025-03-01',
    ngay_ket_thuc: '2025-03-10',
    trang_thai: 'draft',
    id_nguoi_phu_trach: 'emp-000',
    ten_nguoi_phu_trach: 'Lê Minh Công',
    ma_nguoi_phu_trach: 'NV000',
    id_nhom: [],
    id_noi_luu: ['noi-luu-1'],
    ghi_chu: 'Chưa tạo danh sách',
    trang_thai_active: 1,
    tg_tao: '2025-02-20T14:00:00Z',
    tg_cap_nhat: '2025-02-20T14:00:00Z',
  },
];

let dbChiTiet: ChiTietKiemKe[] = [
  {
    id: 'ct-1',
    id_dot_kiem_ke: 'dot-1',
    id_tai_san: 'ts-1',
    ma_tai_san: 'TS-VP-001',
    ten_tai_san: 'Laptop Dell XPS 15',
    id_noi_luu_so: 'noi-luu-1',
    ten_noi_luu_so: 'Văn phòng HCM',
    id_nguoi_giu_so: 'emp-000',
    ten_nguoi_giu_so: 'Lê Minh Công',
    id_trang_thai_so: 'tt-4',
    ten_trang_thai_so: 'Đang sử dụng',
    id_noi_luu_thuc_te: 'noi-luu-1',
    ten_noi_luu_thuc_te: 'Văn phòng HCM',
    id_nguoi_giu_thuc_te: 'emp-000',
    ten_nguoi_giu_thuc_te: 'Lê Minh Công',
    id_trang_thai_thuc_te: 'tt-4',
    ten_trang_thai_thuc_te: 'Đang sử dụng',
    ket_qua: 'khop',
    ghi_chu_dong: null,
    id_nguoi_kiem: 'emp-000',
    ten_nguoi_kiem: 'Lê Minh Công',
    ngay_kiem: '2025-01-12T10:00:00Z',
    tg_tao: '2025-01-01T08:00:00Z',
    tg_cap_nhat: '2025-01-12T10:00:00Z',
  },
  {
    id: 'ct-2',
    id_dot_kiem_ke: 'dot-1',
    id_tai_san: 'ts-2',
    ma_tai_san: 'TS-VP-002',
    ten_tai_san: 'Màn hình LG 27"',
    id_noi_luu_so: 'noi-luu-1',
    ten_noi_luu_so: 'Văn phòng HCM',
    id_nguoi_giu_so: 'emp-000',
    ten_nguoi_giu_so: 'Lê Minh Công',
    id_trang_thai_so: 'tt-4',
    ten_trang_thai_so: 'Đang sử dụng',
    id_noi_luu_thuc_te: 'noi-luu-1',
    ten_noi_luu_thuc_te: 'Văn phòng HCM',
    id_nguoi_giu_thuc_te: 'emp-001',
    ten_nguoi_giu_thuc_te: 'Nguyễn Văn Thành',
    id_trang_thai_thuc_te: 'tt-4',
    ten_trang_thai_thuc_te: 'Đang sử dụng',
    ket_qua: 'chenh_nguoi_giu',
    ghi_chu_dong: 'Đã chuyển cho NV Thành',
    id_nguoi_kiem: 'emp-000',
    ten_nguoi_kiem: 'Lê Minh Công',
    ngay_kiem: '2025-01-13T09:00:00Z',
    tg_tao: '2025-01-01T08:00:00Z',
    tg_cap_nhat: '2025-01-13T09:00:00Z',
  },
  {
    id: 'ct-3',
    id_dot_kiem_ke: 'dot-2',
    id_tai_san: 'ts-5',
    ma_tai_san: 'TS-KHO-001',
    ten_tai_san: 'Laptop dự phòng Acer',
    id_noi_luu_so: 'noi-luu-2',
    ten_noi_luu_so: 'Kho VP HCM',
    id_nguoi_giu_so: null,
    ten_nguoi_giu_so: null,
    id_trang_thai_so: 'tt-1',
    ten_trang_thai_so: 'Trong kho',
    id_noi_luu_thuc_te: null,
    ten_noi_luu_thuc_te: null,
    id_nguoi_giu_thuc_te: null,
    ten_nguoi_giu_thuc_te: null,
    id_trang_thai_thuc_te: null,
    ten_trang_thai_thuc_te: null,
    ket_qua: 'chua_kiem',
    ghi_chu_dong: null,
    id_nguoi_kiem: null,
    ten_nguoi_kiem: null,
    ngay_kiem: null,
    tg_tao: '2025-02-10T08:00:00Z',
    tg_cap_nhat: '2025-02-10T08:00:00Z',
  },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function enrichDot(dots: DotKiemKe[]): Promise<DotKiemKe[]> {
  const employees = await getEmployees();
  const empMap = new Map(employees.map((e) => [e.id, { ten: e.ho_ten, ma: e.ma_nhan_vien }]));
  return dots.map((d) => ({
    ...d,
    ten_nguoi_phu_trach: d.ten_nguoi_phu_trach ?? empMap.get(d.id_nguoi_phu_trach)?.ten ?? null,
    ma_nguoi_phu_trach: d.ma_nguoi_phu_trach ?? empMap.get(d.id_nguoi_phu_trach)?.ma ?? null,
  }));
}

export interface GetDotKiemKeListParams {
  filter?: 'all' | 'mine';
  id_nguoi?: string;
  q?: string;
  trang_thai_dot?: TrangThaiDotKiemKe[];
  dateFrom?: string;
  dateTo?: string;
  id_nguoi_phu_trach?: string[];
}

export async function getDotKiemKeList(params: GetDotKiemKeListParams = {}): Promise<DotKiemKe[]> {
  await delay(400);
  let list = [...dbDot];
  if (params.filter === 'mine' && params.id_nguoi) {
    list = list.filter((d) => d.id_nguoi_phu_trach === params.id_nguoi);
  }
  if (params.trang_thai_dot?.length) {
    list = list.filter((d) => params.trang_thai_dot!.includes(d.trang_thai));
  }
  if (params.dateFrom) {
    list = list.filter((d) => d.ngay_ket_thuc >= params.dateFrom!);
  }
  if (params.dateTo) {
    list = list.filter((d) => d.ngay_bat_dau <= params.dateTo!);
  }
  if (params.id_nguoi_phu_trach?.length) {
    list = list.filter((d) => params.id_nguoi_phu_trach!.includes(d.id_nguoi_phu_trach));
  }
  if (params.q?.trim()) {
    const q = params.q.trim().toLowerCase();
    list = list.filter(
      (d) =>
        d.ma_dot.toLowerCase().includes(q) ||
        (d.ten_dot && d.ten_dot.toLowerCase().includes(q)) ||
        (d.ten_nguoi_phu_trach && d.ten_nguoi_phu_trach.toLowerCase().includes(q))
    );
  }
  return enrichDot(list);
}

export async function getDotKiemKeById(id: string): Promise<DotKiemKe | null> {
  await delay(300);
  const found = dbDot.find((d) => d.id === id);
  if (!found) return null;
  const [enriched] = await enrichDot([found]);
  return enriched;
}

export async function getChiTietByDot(id_dot_kiem_ke: string): Promise<ChiTietKiemKe[]> {
  await delay(300);
  return dbChiTiet.filter((c) => c.id_dot_kiem_ke === id_dot_kiem_ke);
}

export async function createDotKiemKe(data: DotKiemKeCreate): Promise<DotKiemKe> {
  await delay(500);
  const employees = await getEmployees();
  const emp = employees.find((e) => e.id === data.id_nguoi_phu_trach);
  const dot: DotKiemKe = {
    id: `dot-${Date.now()}`,
    ma_dot: data.ma_dot,
    ten_dot: data.ten_dot,
    ngay_bat_dau: data.ngay_bat_dau,
    ngay_ket_thuc: data.ngay_ket_thuc,
    trang_thai: 'draft',
    id_nguoi_phu_trach: data.id_nguoi_phu_trach,
    ten_nguoi_phu_trach: emp?.ho_ten ?? null,
    ma_nguoi_phu_trach: emp?.ma_nhan_vien ?? null,
    id_nhom: data.id_nhom ?? [],
    id_noi_luu: data.id_noi_luu ?? [],
    ghi_chu: data.ghi_chu ?? null,
    trang_thai_active: 1,
    tg_tao: now(),
    tg_cap_nhat: now(),
  };
  dbDot = [dot, ...dbDot];
  return dot;
}

export async function updateDotKiemKe(id: string, data: Partial<DotKiemKeCreate>): Promise<DotKiemKe> {
  await delay(400);
  const idx = dbDot.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error('Đợt kiểm kê không tồn tại');
  const current = dbDot[idx];
  if (current.trang_thai !== 'draft') throw new Error('Chỉ được sửa đợt ở trạng thái Nháp');
  const updated: DotKiemKe = {
    ...current,
    ...(data.ma_dot != null && { ma_dot: data.ma_dot }),
    ...(data.ten_dot != null && { ten_dot: data.ten_dot }),
    ...(data.ngay_bat_dau != null && { ngay_bat_dau: data.ngay_bat_dau }),
    ...(data.ngay_ket_thuc != null && { ngay_ket_thuc: data.ngay_ket_thuc }),
    ...(data.id_nguoi_phu_trach != null && { id_nguoi_phu_trach: data.id_nguoi_phu_trach }),
    ...(data.id_nhom != null && { id_nhom: data.id_nhom }),
    ...(data.id_noi_luu != null && { id_noi_luu: data.id_noi_luu }),
    ...(data.ghi_chu !== undefined && { ghi_chu: data.ghi_chu }),
    tg_cap_nhat: now(),
  };
  dbDot[idx] = updated;
  const [enriched] = await enrichDot([updated]);
  return enriched;
}

export async function deleteDotKiemKe(ids: string[]): Promise<void> {
  await delay(400);
  const onlyDraft = dbDot.filter((d) => ids.includes(d.id) && d.trang_thai === 'draft');
  if (onlyDraft.length !== ids.length) {
    throw new Error('Chỉ được xóa đợt ở trạng thái Nháp');
  }
  dbDot = dbDot.filter((d) => !ids.includes(d.id));
  dbChiTiet = dbChiTiet.filter((c) => !ids.includes(c.id_dot_kiem_ke));
}

/** Chỉ cập nhật trạng thái đợt kiểm kê (draft | dang_kiem_ke | hoan_thanh). */
export async function changeTrangThaiDot(id: string, trang_thai: TrangThaiDotKiemKe): Promise<DotKiemKe> {
  await delay(300);
  const idx = dbDot.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error('Đợt kiểm kê không tồn tại');
  const current = dbDot[idx];
  const updated: DotKiemKe = { ...current, trang_thai, tg_cap_nhat: now() };
  dbDot[idx] = updated;
  const [enriched] = await enrichDot([updated]);
  return enriched;
}

/** Chuyển đợt sang "Đang kiểm kê" và tạo danh sách chi tiết từ tài sản thỏa phạm vi. filters từ popup (chi nhánh, vị trí, người giữ) thu hẹp thêm. */
export async function taoDanhSachKiemKe(
  id_dot_kiem_ke: string,
  filters?: TaoDanhSachKiemKeFilters
): Promise<ChiTietKiemKe[]> {
  await delay(600);
  const dot = dbDot.find((d) => d.id === id_dot_kiem_ke);
  if (!dot) throw new Error('Đợt kiểm kê không tồn tại');
  if (dot.trang_thai !== 'draft') throw new Error('Chỉ tạo danh sách khi đợt ở trạng thái Nháp');
  const [assets, locations] = await Promise.all([getTaiSanList(), getAssetStorageLocations()]);
  let filtered = assets.filter((a) => a.trang_thai === 1);
  if (dot.id_nhom.length) {
    filtered = filtered.filter((a) => dot.id_nhom.includes(a.id_nhom));
  }
  if (dot.id_noi_luu.length) {
    filtered = filtered.filter((a) => dot.id_noi_luu.includes(a.id_noi_luu));
  }
  if (filters?.id_chi_nhanh?.length) {
    const noiLuuIdsInBranches = new Set(
      locations.filter((l) => filters.id_chi_nhanh!.includes(l.id_chi_nhanh)).map((l) => l.id)
    );
    filtered = filtered.filter((a) => noiLuuIdsInBranches.has(a.id_noi_luu));
  }
  if (filters?.id_noi_luu?.length) {
    const setNoiLuu = new Set(filters.id_noi_luu);
    filtered = filtered.filter((a) => setNoiLuu.has(a.id_noi_luu));
  }
  if (filters?.id_nguoi_giu?.length) {
    const setNguoi = new Set(filters.id_nguoi_giu);
    filtered = filtered.filter((a) => a.id_nhan_vien_dang_giu != null && setNguoi.has(a.id_nhan_vien_dang_giu));
  }
  const existingIds = new Set(dbChiTiet.filter((c) => c.id_dot_kiem_ke === id_dot_kiem_ke).map((c) => c.id_tai_san));
  const toAdd = filtered.filter((a) => !existingIds.has(a.id));
  const created: ChiTietKiemKe[] = toAdd.map((a) => ({
    id: `ct-${Date.now()}-${a.id}`,
    id_dot_kiem_ke,
    id_tai_san: a.id,
    ma_tai_san: a.ma_tai_san,
    ten_tai_san: a.ten_tai_san,
    id_noi_luu_so: a.id_noi_luu,
    ten_noi_luu_so: a.ten_noi_luu ?? null,
    id_nguoi_giu_so: a.id_nhan_vien_dang_giu ?? null,
    ten_nguoi_giu_so: a.ten_nhan_vien_dang_giu ?? null,
    id_trang_thai_so: a.id_trang_thai,
    ten_trang_thai_so: a.ten_trang_thai ?? null,
    id_noi_luu_thuc_te: null,
    ten_noi_luu_thuc_te: null,
    id_nguoi_giu_thuc_te: null,
    ten_nguoi_giu_thuc_te: null,
    id_trang_thai_thuc_te: null,
    ten_trang_thai_thuc_te: null,
    ket_qua: 'chua_kiem',
    ghi_chu_dong: null,
    id_nguoi_kiem: null,
    ten_nguoi_kiem: null,
    ngay_kiem: null,
    tg_tao: now(),
    tg_cap_nhat: now(),
  }));
  dbChiTiet = dbChiTiet.filter((c) => c.id_dot_kiem_ke !== id_dot_kiem_ke).concat(created);
  dot.trang_thai = 'dang_kiem_ke' as TrangThaiDotKiemKe;
  dot.tg_cap_nhat = now();
  return getChiTietByDot(id_dot_kiem_ke);
}

function computeKetQua(c: ChiTietKiemKe): KetQuaKiemKe {
  const hasThucTe =
    c.id_noi_luu_thuc_te != null ||
    c.id_nguoi_giu_thuc_te != null ||
    c.id_trang_thai_thuc_te != null;
  if (!hasThucTe) return 'chua_kiem';
  const sameNoiLuu = (c.id_noi_luu_so || '') === (c.id_noi_luu_thuc_te || '');
  const sameNguoi = (c.id_nguoi_giu_so || '') === (c.id_nguoi_giu_thuc_te || '');
  const sameTrangThai = (c.id_trang_thai_so || '') === (c.id_trang_thai_thuc_te || '');
  if (sameNoiLuu && sameNguoi && sameTrangThai) return 'khop';
  if (!sameNoiLuu) return 'chenh_noi_luu';
  if (!sameNguoi) return 'chenh_nguoi_giu';
  if (!sameTrangThai) return 'chenh_trang_thai';
  return 'khop';
}

export async function updateChiTietKetQua(
  id_chi_tiet: string,
  data: ChiTietKiemKeUpdate,
  id_nguoi_kiem: string
): Promise<ChiTietKiemKe> {
  await delay(300);
  const idx = dbChiTiet.findIndex((c) => c.id === id_chi_tiet);
  if (idx === -1) throw new Error('Chi tiết không tồn tại');
  const [locations, employees, statuses] = await Promise.all([
    getAssetStorageLocations(),
    getEmployees(),
    getAssetStatuses(),
  ]);
  const locMap = new Map(locations.map((l) => [l.id, l.ten_noi_luu]));
  const empMap = new Map(employees.map((e) => [e.id, { ten: e.ho_ten }]));
  const statusMap = new Map(statuses.map((s) => [s.id, s.ten]));
  const emp = employees.find((e) => e.id === id_nguoi_kiem);
  const updated: ChiTietKiemKe = {
    ...dbChiTiet[idx],
    id_noi_luu_thuc_te: data.id_noi_luu_thuc_te ?? dbChiTiet[idx].id_noi_luu_thuc_te,
    ten_noi_luu_thuc_te: data.id_noi_luu_thuc_te != null ? (locMap.get(data.id_noi_luu_thuc_te) ?? null) : dbChiTiet[idx].ten_noi_luu_thuc_te,
    id_nguoi_giu_thuc_te: data.id_nguoi_giu_thuc_te !== undefined ? data.id_nguoi_giu_thuc_te : dbChiTiet[idx].id_nguoi_giu_thuc_te,
    ten_nguoi_giu_thuc_te: data.id_nguoi_giu_thuc_te != null ? (empMap.get(data.id_nguoi_giu_thuc_te)?.ten ?? null) : (data.id_nguoi_giu_thuc_te === null ? null : dbChiTiet[idx].ten_nguoi_giu_thuc_te),
    id_trang_thai_thuc_te: data.id_trang_thai_thuc_te !== undefined ? data.id_trang_thai_thuc_te : dbChiTiet[idx].id_trang_thai_thuc_te,
    ten_trang_thai_thuc_te: data.id_trang_thai_thuc_te != null ? (statusMap.get(data.id_trang_thai_thuc_te) ?? null) : (data.id_trang_thai_thuc_te === null ? null : dbChiTiet[idx].ten_trang_thai_thuc_te),
    ghi_chu_dong: data.ghi_chu_dong !== undefined ? data.ghi_chu_dong : dbChiTiet[idx].ghi_chu_dong,
    id_nguoi_kiem,
    ten_nguoi_kiem: emp?.ho_ten ?? null,
    ngay_kiem: now(),
    tg_cap_nhat: now(),
  };
  updated.ket_qua = computeKetQua(updated);
  dbChiTiet[idx] = updated;
  return updated;
}

/** Payload thêm dòng "tài sản phát hiện" (có thực tế, chưa trong danh sách đợt) */
export interface ThemChiTietPhatHienPayload {
  id_tai_san: string;
  id_noi_luu_thuc_te: string | null;
  id_nguoi_giu_thuc_te: string | null;
  id_trang_thai_thuc_te: string | null;
  ghi_chu_dong?: string | null;
}

/** Thêm một dòng chi tiết kiểm kê: tài sản có thực tế (phát hiện khi kiểm, chưa có trong danh sách đợt). */
export async function themChiTietPhatHien(
  id_dot_kiem_ke: string,
  payload: ThemChiTietPhatHienPayload,
  id_nguoi_kiem: string
): Promise<ChiTietKiemKe> {
  await delay(400);
  const dot = dbDot.find((d) => d.id === id_dot_kiem_ke);
  if (!dot) throw new Error('Đợt kiểm kê không tồn tại');
  if (dot.trang_thai !== 'dang_kiem_ke') throw new Error('Chỉ thêm khi đợt đang kiểm kê');
  const existing = dbChiTiet.some(
    (c) => c.id_dot_kiem_ke === id_dot_kiem_ke && c.id_tai_san === payload.id_tai_san
  );
  if (existing) throw new Error('Tài sản đã có trong danh sách đợt');
  const [assets, locations, employees, statuses] = await Promise.all([
    getTaiSanList(),
    getAssetStorageLocations(),
    getEmployees(),
    getAssetStatuses(),
  ]);
  const asset = assets.find((a) => a.id === payload.id_tai_san);
  if (!asset) throw new Error('Tài sản không tồn tại');
  const locMap = new Map(locations.map((l) => [l.id, l.ten_noi_luu]));
  const empMap = new Map(employees.map((e) => [e.id, e.ho_ten]));
  const statusMap = new Map(statuses.map((s) => [s.id, s.ten]));
  const emp = employees.find((e) => e.id === id_nguoi_kiem);
  const id_chi_tiet = `ct-${Date.now()}-${asset.id}`;
  const c: ChiTietKiemKe = {
    id: id_chi_tiet,
    id_dot_kiem_ke,
    id_tai_san: asset.id,
    ma_tai_san: asset.ma_tai_san,
    ten_tai_san: asset.ten_tai_san,
    id_noi_luu_so: asset.id_noi_luu,
    ten_noi_luu_so: asset.ten_noi_luu ?? null,
    id_nguoi_giu_so: asset.id_nhan_vien_dang_giu ?? null,
    ten_nguoi_giu_so: asset.ten_nhan_vien_dang_giu ?? null,
    id_trang_thai_so: asset.id_trang_thai,
    ten_trang_thai_so: asset.ten_trang_thai ?? null,
    id_noi_luu_thuc_te: payload.id_noi_luu_thuc_te,
    ten_noi_luu_thuc_te: payload.id_noi_luu_thuc_te ? (locMap.get(payload.id_noi_luu_thuc_te) ?? null) : null,
    id_nguoi_giu_thuc_te: payload.id_nguoi_giu_thuc_te,
    ten_nguoi_giu_thuc_te: payload.id_nguoi_giu_thuc_te ? (empMap.get(payload.id_nguoi_giu_thuc_te) ?? null) : null,
    id_trang_thai_thuc_te: payload.id_trang_thai_thuc_te,
    ten_trang_thai_thuc_te: payload.id_trang_thai_thuc_te ? (statusMap.get(payload.id_trang_thai_thuc_te) ?? null) : null,
    ghi_chu_dong: payload.ghi_chu_dong ?? null,
    id_nguoi_kiem,
    ten_nguoi_kiem: emp?.ho_ten ?? null,
    ngay_kiem: now(),
    tg_tao: now(),
    tg_cap_nhat: now(),
  };
  c.ket_qua = computeKetQua(c);
  dbChiTiet.push(c);
  return c;
}

/** Đồng bộ sổ danh mục tài sản theo kết quả kiểm (một dòng chi tiết). */
export async function capNhatSoTheoKetQua(id_chi_tiet: string): Promise<void> {
  await delay(300);
  const c = dbChiTiet.find((x) => x.id === id_chi_tiet);
  if (!c) throw new Error('Chi tiết không tồn tại');
  if (
    c.id_noi_luu_thuc_te == null &&
    c.id_nguoi_giu_thuc_te == null &&
    c.id_trang_thai_thuc_te == null
  ) {
    throw new Error('Chưa có kết quả kiểm thực tế để đồng bộ');
  }
  await updateTaiSanFromKiemKe(c.id_tai_san, {
    id_noi_luu: c.id_noi_luu_thuc_te ?? undefined,
    id_nhan_vien_dang_giu: c.id_nguoi_giu_thuc_te ?? undefined,
    id_trang_thai: c.id_trang_thai_thuc_te ?? undefined,
  });
}

export async function hoanThanhDot(id_dot_kiem_ke: string): Promise<DotKiemKe> {
  await delay(300);
  const dot = dbDot.find((d) => d.id === id_dot_kiem_ke);
  if (!dot) throw new Error('Đợt kiểm kê không tồn tại');
  if (dot.trang_thai !== 'dang_kiem_ke') throw new Error('Chỉ hoàn thành đợt đang kiểm kê');
  dot.trang_thai = 'hoan_thanh' as TrangThaiDotKiemKe;
  dot.tg_cap_nhat = now();
  const [enriched] = await enrichDot([dot]);
  return enriched;
}
