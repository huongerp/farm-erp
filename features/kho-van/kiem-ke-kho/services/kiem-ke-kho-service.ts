import type {
  DotKiemKeKho,
  ChiTietKiemKeKho,
  DotKiemKeKhoCreate,
  ChiTietKiemKeKhoUpdate,
  TrangThaiDotKiemKeKho,
  KetQuaKiemKeKho,
} from '../core/types';
import { getTonKhoTheoKho, capNhatTonKho } from '../../phieu-kho/services/ton-kho-service';
import { getKhoList } from '../../danh-sach-kho/services/kho-service';
import { getAllHangHoa } from '../../danh-sach-hang-hoa/services/hang-hoa-service';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';

/** Bộ lọc phạm vi khi tạo danh sách kiểm kê (hàng hóa, danh mục — tùy chọn) */
export interface TaoDanhSachKiemKeKhoFilters {
  id_hang_hoa?: string[];
  id_danh_muc?: string[];
}

const now = () => new Date().toISOString();
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let dbDot: DotKiemKeKho[] = [
  {
    id: 'dotkk-1',
    ma_dot: 'KK-KHO-Q1-2025',
    ten_dot: 'Kiểm kê kho Q1/2025',
    ngay_bat_dau: '2025-01-01',
    ngay_ket_thuc: '2025-01-15',
    trang_thai: 'hoan_thanh',
    id_nguoi_phu_trach: 'emp-000',
    ten_nguoi_phu_trach: 'Lê Minh Công',
    ma_nguoi_phu_trach: 'NV000',
    id_kho: ['kho-1', 'kho-2'],
    ghi_chu: 'Đợt kiểm kê định kỳ',
    trang_thai_active: 1,
    tg_tao: '2025-01-01T08:00:00Z',
    tg_cap_nhat: '2025-01-20T10:00:00Z',
  },
  {
    id: 'dotkk-2',
    ma_dot: 'KK-KHO-02',
    ten_dot: 'Kiểm kê đột xuất tháng 2',
    ngay_bat_dau: '2025-02-10',
    ngay_ket_thuc: '2025-02-14',
    trang_thai: 'dang_kiem_ke',
    id_nguoi_phu_trach: 'emp-001',
    ten_nguoi_phu_trach: 'Nguyễn Văn Thành',
    ma_nguoi_phu_trach: 'NV001',
    id_kho: ['kho-1'],
    ghi_chu: null,
    trang_thai_active: 1,
    tg_tao: '2025-02-05T08:00:00Z',
    tg_cap_nhat: '2025-02-10T09:00:00Z',
  },
  {
    id: 'dotkk-3',
    ma_dot: 'KK-KHO-DRAFT',
    ten_dot: 'Đợt kiểm kê dự thảo',
    ngay_bat_dau: '2025-03-01',
    ngay_ket_thuc: '2025-03-10',
    trang_thai: 'draft',
    id_nguoi_phu_trach: 'emp-000',
    ten_nguoi_phu_trach: 'Lê Minh Công',
    ma_nguoi_phu_trach: 'NV000',
    id_kho: ['kho-2'],
    ghi_chu: 'Chưa tạo danh sách',
    trang_thai_active: 1,
    tg_tao: '2025-02-20T14:00:00Z',
    tg_cap_nhat: '2025-02-20T14:00:00Z',
  },
];

let dbChiTiet: ChiTietKiemKeKho[] = [
  {
    id: 'ctkk-1',
    id_dot_kiem_ke_kho: 'dotkk-1',
    id_kho: 'kho-1',
    ten_kho: 'Kho trung tâm',
    ma_kho: 'KHO-TW',
    id_hang_hoa: 'hh-1',
    ma_hang: 'SP-001',
    ten_hang: 'Giấy A4 70gsm',
    don_vi_tinh: 'Ram',
    so_luong_so: 100,
    so_luong_thuc_te: 100,
    ket_qua: 'khop',
    ghi_chu_dong: null,
    id_nguoi_kiem: 'emp-000',
    ten_nguoi_kiem: 'Lê Minh Công',
    ngay_kiem: '2025-01-12T10:00:00Z',
    tg_tao: '2025-01-01T08:00:00Z',
    tg_cap_nhat: '2025-01-12T10:00:00Z',
  },
  {
    id: 'ctkk-2',
    id_dot_kiem_ke_kho: 'dotkk-1',
    id_kho: 'kho-1',
    ten_kho: 'Kho trung tâm',
    ma_kho: 'KHO-TW',
    id_hang_hoa: 'hh-2',
    ma_hang: 'SP-002',
    ten_hang: 'Bút bi xanh',
    don_vi_tinh: 'Cái',
    so_luong_so: 250,
    so_luong_thuc_te: 248,
    ket_qua: 'thieu',
    ghi_chu_dong: 'Hao hụt 2 cái',
    id_nguoi_kiem: 'emp-000',
    ten_nguoi_kiem: 'Lê Minh Công',
    ngay_kiem: '2025-01-13T09:00:00Z',
    tg_tao: '2025-01-01T08:00:00Z',
    tg_cap_nhat: '2025-01-13T09:00:00Z',
  },
  {
    id: 'ctkk-3',
    id_dot_kiem_ke_kho: 'dotkk-2',
    id_kho: 'kho-1',
    ten_kho: 'Kho trung tâm',
    ma_kho: 'KHO-TW',
    id_hang_hoa: 'hh-5',
    ma_hang: 'SP-005',
    ten_hang: 'Bìa màu A4',
    don_vi_tinh: 'Tờ',
    so_luong_so: 120,
    so_luong_thuc_te: null,
    ket_qua: 'chua_kiem',
    ghi_chu_dong: null,
    id_nguoi_kiem: null,
    ten_nguoi_kiem: null,
    ngay_kiem: null,
    tg_tao: '2025-02-10T08:00:00Z',
    tg_cap_nhat: '2025-02-10T08:00:00Z',
  },
];

async function enrichDot(dots: DotKiemKeKho[]): Promise<DotKiemKeKho[]> {
  const employees = await getEmployees();
  const empMap = new Map(employees.map((e) => [e.id, { ten: e.ho_ten, ma: e.ma_nhan_vien }]));
  return dots.map((d) => ({
    ...d,
    ten_nguoi_phu_trach: d.ten_nguoi_phu_trach ?? empMap.get(d.id_nguoi_phu_trach)?.ten ?? null,
    ma_nguoi_phu_trach: d.ma_nguoi_phu_trach ?? empMap.get(d.id_nguoi_phu_trach)?.ma ?? null,
  }));
}

export interface GetDotKiemKeKhoListParams {
  filter?: 'all' | 'mine';
  id_nguoi?: string;
  q?: string;
  trang_thai_dot?: TrangThaiDotKiemKeKho[];
  dateFrom?: string;
  dateTo?: string;
  id_nguoi_phu_trach?: string[];
  id_kho?: string[];
}

export async function getDotKiemKeKhoList(params: GetDotKiemKeKhoListParams = {}): Promise<DotKiemKeKho[]> {
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
  if (params.id_kho?.length) {
    list = list.filter((d) => d.id_kho.some((k) => params.id_kho!.includes(k)));
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

export async function getDotKiemKeKhoById(id: string): Promise<DotKiemKeKho | null> {
  await delay(300);
  const found = dbDot.find((d) => d.id === id);
  if (!found) return null;
  const [enriched] = await enrichDot([found]);
  return enriched;
}

export async function getChiTietByDot(id_dot_kiem_ke_kho: string): Promise<ChiTietKiemKeKho[]> {
  await delay(300);
  return dbChiTiet.filter((c) => c.id_dot_kiem_ke_kho === id_dot_kiem_ke_kho);
}

export async function createDotKiemKeKho(data: DotKiemKeKhoCreate): Promise<DotKiemKeKho> {
  await delay(500);
  const employees = await getEmployees();
  const emp = employees.find((e) => e.id === data.id_nguoi_phu_trach);
  const dot: DotKiemKeKho = {
    id: `dotkk-${Date.now()}`,
    ma_dot: data.ma_dot,
    ten_dot: data.ten_dot,
    ngay_bat_dau: data.ngay_bat_dau,
    ngay_ket_thuc: data.ngay_ket_thuc,
    trang_thai: 'draft',
    id_nguoi_phu_trach: data.id_nguoi_phu_trach,
    ten_nguoi_phu_trach: emp?.ho_ten ?? null,
    ma_nguoi_phu_trach: emp?.ma_nhan_vien ?? null,
    id_kho: data.id_kho ?? [],
    ghi_chu: data.ghi_chu ?? null,
    trang_thai_active: 1,
    tg_tao: now(),
    tg_cap_nhat: now(),
  };
  dbDot = [dot, ...dbDot];
  return dot;
}

export async function updateDotKiemKeKho(id: string, data: Partial<DotKiemKeKhoCreate>): Promise<DotKiemKeKho> {
  await delay(400);
  const idx = dbDot.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error('Đợt kiểm kê không tồn tại');
  const current = dbDot[idx];
  const onlyGhiChu = data.ghi_chu !== undefined && Object.keys(data).length === 1;
  if (current.trang_thai !== 'draft' && !onlyGhiChu) throw new Error('Chỉ được sửa đợt ở trạng thái Nháp');
  const updated: DotKiemKeKho = {
    ...current,
    ...(data.ma_dot != null && { ma_dot: data.ma_dot }),
    ...(data.ten_dot != null && { ten_dot: data.ten_dot }),
    ...(data.ngay_bat_dau != null && { ngay_bat_dau: data.ngay_bat_dau }),
    ...(data.ngay_ket_thuc != null && { ngay_ket_thuc: data.ngay_ket_thuc }),
    ...(data.id_nguoi_phu_trach != null && { id_nguoi_phu_trach: data.id_nguoi_phu_trach }),
    ...(data.id_kho != null && { id_kho: data.id_kho }),
    ...(data.ghi_chu !== undefined && { ghi_chu: data.ghi_chu }),
    tg_cap_nhat: now(),
  };
  dbDot[idx] = updated;
  const [enriched] = await enrichDot([updated]);
  return enriched;
}

export async function deleteDotKiemKeKho(ids: string[]): Promise<void> {
  await delay(400);
  const onlyDraft = dbDot.filter((d) => ids.includes(d.id) && d.trang_thai === 'draft');
  if (onlyDraft.length !== ids.length) {
    throw new Error('Chỉ được xóa đợt ở trạng thái Nháp');
  }
  dbDot = dbDot.filter((d) => !ids.includes(d.id));
  dbChiTiet = dbChiTiet.filter((c) => !ids.includes(c.id_dot_kiem_ke_kho));
}

export async function changeTrangThaiDot(id: string, trang_thai: TrangThaiDotKiemKeKho): Promise<DotKiemKeKho> {
  await delay(300);
  const idx = dbDot.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error('Đợt kiểm kê không tồn tại');
  const current = dbDot[idx];
  const updated: DotKiemKeKho = { ...current, trang_thai, tg_cap_nhat: now() };
  dbDot[idx] = updated;
  const [enriched] = await enrichDot([updated]);
  return enriched;
}

export async function taoDanhSachKiemKe(
  id_dot_kiem_ke_kho: string,
  filters?: TaoDanhSachKiemKeKhoFilters
): Promise<ChiTietKiemKeKho[]> {
  await delay(600);
  const dot = dbDot.find((d) => d.id === id_dot_kiem_ke_kho);
  if (!dot) throw new Error('Đợt kiểm kê không tồn tại');
  if (dot.trang_thai !== 'draft') throw new Error('Chỉ tạo danh sách khi đợt ở trạng thái Nháp');
  const [hangHoaList, khoList] = await Promise.all([getAllHangHoa(), getKhoList()]);
  const hangHoaMap = new Map(hangHoaList.map((h) => [h.id, h]));
  const khoMap = new Map(khoList.map((k) => [k.id, k]));

  const existingKeys = new Set(
    dbChiTiet.filter((c) => c.id_dot_kiem_ke_kho === id_dot_kiem_ke_kho).map((c) => `${c.id_kho}|${c.id_hang_hoa}`)
  );

  const toAdd: ChiTietKiemKeKho[] = [];
  for (const id_kho of dot.id_kho) {
    const tonTheoKho = await getTonKhoTheoKho(id_kho);
    const kho = khoMap.get(id_kho);
    for (const { id_hang_hoa, so_luong } of tonTheoKho) {
      if (so_luong <= 0) continue;
      const key = `${id_kho}|${id_hang_hoa}`;
      if (existingKeys.has(key)) continue;
      if (filters?.id_hang_hoa?.length && !filters.id_hang_hoa.includes(id_hang_hoa)) continue;
      const hh = hangHoaMap.get(id_hang_hoa);
      if (filters?.id_danh_muc?.length && (!hh?.id_danh_muc || !filters.id_danh_muc.includes(hh.id_danh_muc))) continue;

      toAdd.push({
        id: `ctkk-${Date.now()}-${id_kho}-${id_hang_hoa}`,
        id_dot_kiem_ke_kho,
        id_kho,
        ten_kho: kho?.ten_kho ?? null,
        ma_kho: kho?.ma_kho ?? null,
        id_hang_hoa,
        ma_hang: hh?.ma_hang ?? null,
        ten_hang: hh?.ten_hang ?? null,
        don_vi_tinh: hh?.don_vi_tinh ?? null,
        so_luong_so: so_luong,
        so_luong_thuc_te: null,
        ket_qua: 'chua_kiem',
        ghi_chu_dong: null,
        id_nguoi_kiem: null,
        ten_nguoi_kiem: null,
        ngay_kiem: null,
        tg_tao: now(),
        tg_cap_nhat: now(),
      });
      existingKeys.add(key);
    }
  }

  dbChiTiet = dbChiTiet.filter((c) => c.id_dot_kiem_ke_kho !== id_dot_kiem_ke_kho).concat(toAdd);
  const dotIdx = dbDot.findIndex((d) => d.id === id_dot_kiem_ke_kho);
  if (dotIdx >= 0) {
    dbDot[dotIdx] = { ...dbDot[dotIdx], trang_thai: 'dang_kiem_ke', tg_cap_nhat: now() };
  }
  return getChiTietByDot(id_dot_kiem_ke_kho);
}

function computeKetQua(c: ChiTietKiemKeKho): KetQuaKiemKeKho {
  if (c.so_luong_thuc_te == null) return 'chua_kiem';
  if (c.so_luong_so === c.so_luong_thuc_te) return 'khop';
  if (c.so_luong_thuc_te < c.so_luong_so) return 'thieu';
  return 'thua';
}

export async function updateChiTietKetQua(
  id_chi_tiet: string,
  data: ChiTietKiemKeKhoUpdate,
  id_nguoi_kiem: string
): Promise<ChiTietKiemKeKho> {
  await delay(300);
  const idx = dbChiTiet.findIndex((c) => c.id === id_chi_tiet);
  if (idx === -1) throw new Error('Chi tiết không tồn tại');
  const employees = await getEmployees();
  const emp = employees.find((e) => e.id === id_nguoi_kiem);
  const updated: ChiTietKiemKeKho = {
    ...dbChiTiet[idx],
    so_luong_thuc_te: data.so_luong_thuc_te !== undefined ? data.so_luong_thuc_te : dbChiTiet[idx].so_luong_thuc_te,
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

/** Điều chỉnh tồn sổ theo số lượng thực tế đã nhập (bien_dong = thuc_te - so). */
export async function dieuChinhTonTheoKetQua(id_chi_tiet: string): Promise<void> {
  await delay(300);
  const c = dbChiTiet.find((x) => x.id === id_chi_tiet);
  if (!c) throw new Error('Chi tiết không tồn tại');
  if (c.so_luong_thuc_te == null) throw new Error('Chưa có số lượng thực tế để điều chỉnh');
  const bien_dong = c.so_luong_thuc_te - c.so_luong_so;
  capNhatTonKho(c.id_kho, c.id_hang_hoa, bien_dong);
}

/** Điều chỉnh tồn cho toàn bộ chi tiết đã có so_luong_thuc_te trong đợt. */
export async function dieuChinhTonTheoDot(id_dot_kiem_ke_kho: string): Promise<number> {
  await delay(400);
  const chiTiets = dbChiTiet.filter(
    (c) => c.id_dot_kiem_ke_kho === id_dot_kiem_ke_kho && c.so_luong_thuc_te != null
  );
  for (const c of chiTiets) {
    const bien_dong = c.so_luong_thuc_te! - c.so_luong_so;
    capNhatTonKho(c.id_kho, c.id_hang_hoa, bien_dong);
  }
  return chiTiets.length;
}

export async function hoanThanhDot(id_dot_kiem_ke_kho: string): Promise<DotKiemKeKho> {
  await delay(300);
  const dot = dbDot.find((d) => d.id === id_dot_kiem_ke_kho);
  if (!dot) throw new Error('Đợt kiểm kê không tồn tại');
  if (dot.trang_thai !== 'dang_kiem_ke') throw new Error('Chỉ hoàn thành đợt đang kiểm kê');
  dot.trang_thai = 'hoan_thanh';
  dot.tg_cap_nhat = now();
  const [enriched] = await enrichDot([dot]);
  return enriched;
}
