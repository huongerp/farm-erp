import type { PhieuBaoTriSuaChua, PhieuBaoTriSuaChuaCreate } from '../core/types';
import { MOCK_PHIEU_BAO_TRI_SUA_CHUA } from '@/mocks/hanh-chinh';
import { getTaiSanList } from '../../danh-muc-tai-san/services/danh-muc-tai-san-service';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';

let dbPhieu: PhieuBaoTriSuaChua[] = JSON.parse(JSON.stringify(MOCK_PHIEU_BAO_TRI_SUA_CHUA));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function enrichPhieu(items: PhieuBaoTriSuaChua[]): Promise<PhieuBaoTriSuaChua[]> {
  const [assets, employees] = await Promise.all([
    getTaiSanList(),
    getEmployees(),
  ]);
  const assetMap = new Map(assets.map((a) => [a.id, { ma: a.ma_tai_san, ten: a.ten_tai_san }]));
  const employeeMap = new Map(employees.map((e) => [e.id, { ten: e.ho_ten }]));
  return items.map((item) => ({
    ...item,
    ma_tai_san: item.ma_tai_san ?? assetMap.get(item.id_tai_san)?.ma,
    ten_tai_san: item.ten_tai_san ?? assetMap.get(item.id_tai_san)?.ten,
    ten_nguoi_tao: item.ten_nguoi_tao ?? employeeMap.get(item.id_nguoi_tao)?.ten ?? null,
    ten_nguoi_phu_trach: item.id_nguoi_phu_trach
      ? (item.ten_nguoi_phu_trach ?? employeeMap.get(item.id_nguoi_phu_trach)?.ten ?? null)
      : null,
  }));
}

export interface GetPhieuBaoTriListParams {
  q?: string;
  hang_muc?: string[];
  dateFrom?: string;
  dateTo?: string;
  id_tai_san?: string | string[];
}

export const getPhieuBaoTriList = async (
  params: GetPhieuBaoTriListParams = {}
): Promise<PhieuBaoTriSuaChua[]> => {
  await delay(500);
  let list = [...dbPhieu];

  if (params.id_tai_san) {
    const ids = Array.isArray(params.id_tai_san) ? params.id_tai_san : [params.id_tai_san];
    list = list.filter((p) => ids.includes(p.id_tai_san));
  }
  if (params.hang_muc && params.hang_muc.length > 0) {
    list = list.filter((p) => params.hang_muc!.includes(p.hang_muc));
  }
  if (params.dateFrom) {
    list = list.filter((p) => p.ngay_yeu_cau >= params.dateFrom!);
  }
  if (params.dateTo) {
    list = list.filter((p) => p.ngay_yeu_cau <= params.dateTo!);
  }
  if (params.q?.trim()) {
    const q = params.q.trim().toLowerCase();
    list = list.filter(
      (p) =>
        (p.ma_tai_san && p.ma_tai_san.toLowerCase().includes(q)) ||
        (p.ten_tai_san && p.ten_tai_san.toLowerCase().includes(q)) ||
        (p.mo_ta && p.mo_ta.toLowerCase().includes(q)) ||
        (p.ten_nguoi_tao && p.ten_nguoi_tao.toLowerCase().includes(q)) ||
        (p.ten_nguoi_phu_trach && p.ten_nguoi_phu_trach.toLowerCase().includes(q))
    );
  }

  return enrichPhieu(list);
};

export const getPhieuBaoTriById = async (id: string): Promise<PhieuBaoTriSuaChua | null> => {
  await delay(300);
  const found = dbPhieu.find((p) => p.id === id);
  if (!found) return null;
  const [enriched] = await enrichPhieu([found]);
  return enriched;
};

export const deletePhieuBaoTri = async (ids: string[]): Promise<void> => {
  await delay(400);
  dbPhieu = dbPhieu.filter((p) => !ids.includes(p.id));
};

export const createPhieuBaoTri = async (
  data: PhieuBaoTriSuaChuaCreate,
  id_nguoi_tao: string
): Promise<PhieuBaoTriSuaChua> => {
  await delay(500);
  const [assets, employees] = await Promise.all([
    getTaiSanList(),
    getEmployees(),
  ]);
  const asset = assets.find((a) => a.id === data.id_tai_san);
  const nguoiTao = employees.find((e) => e.id === id_nguoi_tao);
  const nguoiPhuTrach = data.id_nguoi_phu_trach
    ? employees.find((e) => e.id === data.id_nguoi_phu_trach)
    : null;

  const now = new Date().toISOString();
  const newPhieu: PhieuBaoTriSuaChua = {
    id: `pbt-${Date.now()}`,
    hang_muc: data.hang_muc,
    id_tai_san: data.id_tai_san,
    ma_tai_san: asset?.ma_tai_san,
    ten_tai_san: asset?.ten_tai_san,
    ngay_yeu_cau: data.ngay_yeu_cau,
    ngay_hen: data.ngay_hen,
    ngay_bat_dau: data.ngay_bat_dau ?? null,
    ngay_hoan_thanh: data.ngay_hoan_thanh ?? null,
    mo_ta: data.mo_ta.trim(),
    ghi_chu: data.ghi_chu?.trim() || null,
    id_nguoi_tao,
    ten_nguoi_tao: nguoiTao?.ho_ten ?? null,
    id_nguoi_phu_trach: data.id_nguoi_phu_trach ?? null,
    ten_nguoi_phu_trach: nguoiPhuTrach?.ho_ten ?? null,
    trang_thai: 0,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbPhieu = [newPhieu, ...dbPhieu];
  const [enriched] = await enrichPhieu([newPhieu]);
  return enriched;
};

export const updatePhieuBaoTri = async (
  id: string,
  data: PhieuBaoTriSuaChuaCreate
): Promise<PhieuBaoTriSuaChua> => {
  await delay(400);
  const idx = dbPhieu.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Phiếu không tồn tại');

  const [assets, employees] = await Promise.all([
    getTaiSanList(),
    getEmployees(),
  ]);
  const asset = assets.find((a) => a.id === data.id_tai_san);
  const nguoiPhuTrach = data.id_nguoi_phu_trach
    ? employees.find((e) => e.id === data.id_nguoi_phu_trach)
    : null;

  const now = new Date().toISOString();
  const updated: PhieuBaoTriSuaChua = {
    ...dbPhieu[idx],
    hang_muc: data.hang_muc,
    id_tai_san: data.id_tai_san,
    ma_tai_san: asset?.ma_tai_san,
    ten_tai_san: asset?.ten_tai_san,
    ngay_yeu_cau: data.ngay_yeu_cau,
    ngay_hen: data.ngay_hen,
    ngay_bat_dau: data.ngay_bat_dau ?? dbPhieu[idx].ngay_bat_dau ?? null,
    ngay_hoan_thanh: data.ngay_hoan_thanh ?? dbPhieu[idx].ngay_hoan_thanh ?? null,
    mo_ta: data.mo_ta.trim(),
    ghi_chu: data.ghi_chu?.trim() || null,
    id_nguoi_phu_trach: data.id_nguoi_phu_trach ?? null,
    ten_nguoi_phu_trach: nguoiPhuTrach?.ho_ten ?? null,
    trang_thai: data.trang_thai !== undefined ? data.trang_thai : dbPhieu[idx].trang_thai,
    tg_cap_nhat: now,
  };
  dbPhieu[idx] = updated;
  const [enriched] = await enrichPhieu([updated]);
  return enriched;
};
