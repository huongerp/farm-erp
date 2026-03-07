import type { PhieuCapPhatThuHoi, PhieuCapPhatThuHoiCreate } from '../core/types';
import { MOCK_PHIEU_CAP_PHAT_THU_HOI } from '@/mocks/hanh-chinh';
import { getTaiSanList } from '../../danh-muc-tai-san/services/danh-muc-tai-san-service';
import { updateTaiSanLocationAndHolder } from '../../danh-muc-tai-san/services/danh-muc-tai-san-service';
import { getAssetStorageLocations } from '../../thiet-lap-tai-san/services/noi-luu-service';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';

let dbPhieu: PhieuCapPhatThuHoi[] = JSON.parse(JSON.stringify(MOCK_PHIEU_CAP_PHAT_THU_HOI));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function enrichPhieu(items: PhieuCapPhatThuHoi[]): Promise<PhieuCapPhatThuHoi[]> {
  const [assets, locations, employees] = await Promise.all([
    getTaiSanList(),
    getAssetStorageLocations(),
    getEmployees(),
  ]);
  const assetMap = new Map(assets.map((a) => [a.id, { ma: a.ma_tai_san, ten: a.ten_tai_san }]));
  const locationMap = new Map(locations.map((l) => [l.id, l.ten_noi_luu]));
  const employeeMap = new Map(employees.map((e) => [e.id, { ten: e.ho_ten, ma: e.ma_nhan_vien }]));
  return items.map((item) => ({
    ...item,
    ma_tai_san: item.ma_tai_san ?? assetMap.get(item.id_tai_san)?.ma,
    ten_tai_san: item.ten_tai_san ?? assetMap.get(item.id_tai_san)?.ten,
    ten_noi_luu_truoc: item.ten_noi_luu_truoc ?? locationMap.get(item.id_noi_luu_truoc),
    ten_noi_luu_sau: item.ten_noi_luu_sau ?? locationMap.get(item.id_noi_luu_sau),
    ten_nguoi_giu_truoc: item.id_nguoi_giu_truoc
      ? (item.ten_nguoi_giu_truoc ?? employeeMap.get(item.id_nguoi_giu_truoc)?.ten ?? null)
      : null,
    ma_nguoi_giu_truoc: item.id_nguoi_giu_truoc
      ? (item.ma_nguoi_giu_truoc ?? employeeMap.get(item.id_nguoi_giu_truoc)?.ma ?? null)
      : null,
    ten_nguoi_giu_sau: item.id_nguoi_giu_sau
      ? (item.ten_nguoi_giu_sau ?? employeeMap.get(item.id_nguoi_giu_sau)?.ten ?? null)
      : null,
    ma_nguoi_giu_sau: item.id_nguoi_giu_sau
      ? (item.ma_nguoi_giu_sau ?? employeeMap.get(item.id_nguoi_giu_sau)?.ma ?? null)
      : null,
    ten_nguoi_thuc_hien: item.ten_nguoi_thuc_hien ?? employeeMap.get(item.id_nguoi_thuc_hien)?.ten ?? null,
  }));
}

export interface GetPhieuListParams {
  filter?: 'all' | 'mine';
  id_nguoi?: string;
  q?: string;
  /** Lọc phiếu theo tài sản (dùng trong detail tài sản) */
  id_tai_san?: string;
}

export const getPhieuList = async (
  params: GetPhieuListParams = {}
): Promise<PhieuCapPhatThuHoi[]> => {
  await delay(500);
  let list = [...dbPhieu];
  if (params.id_tai_san) {
    list = list.filter((p) => p.id_tai_san === params.id_tai_san);
  }
  if (params.filter === 'mine' && params.id_nguoi) {
    list = list.filter(
      (p) =>
        p.id_nguoi_thuc_hien === params.id_nguoi ||
        p.id_nguoi_giu_truoc === params.id_nguoi ||
        p.id_nguoi_giu_sau === params.id_nguoi
    );
  }
  if (params.q?.trim()) {
    const q = params.q.trim().toLowerCase();
    list = list.filter(
      (p) =>
        (p.ma_tai_san && p.ma_tai_san.toLowerCase().includes(q)) ||
        (p.ten_tai_san && p.ten_tai_san.toLowerCase().includes(q)) ||
        (p.ten_nguoi_thuc_hien && p.ten_nguoi_thuc_hien.toLowerCase().includes(q)) ||
        (p.ten_noi_luu_truoc && p.ten_noi_luu_truoc.toLowerCase().includes(q)) ||
        (p.ten_noi_luu_sau && p.ten_noi_luu_sau.toLowerCase().includes(q))
    );
  }
  return enrichPhieu(list);
};

export const getPhieuById = async (id: string): Promise<PhieuCapPhatThuHoi | null> => {
  await delay(300);
  const found = dbPhieu.find((p) => p.id === id);
  if (!found) return null;
  const [enriched] = await enrichPhieu([found]);
  return enriched;
};

export const deletePhieu = async (ids: string[]): Promise<void> => {
  await delay(400);
  dbPhieu = dbPhieu.filter((p) => !ids.includes(p.id));
};

export const createPhieuAndExecute = async (
  data: PhieuCapPhatThuHoiCreate,
  id_nguoi_thuc_hien: string
): Promise<PhieuCapPhatThuHoi> => {
  await delay(700);
  const [locations, employees] = await Promise.all([
    getAssetStorageLocations(),
    getEmployees(),
  ]);
  const ten_noi_luu_truoc = locations.find((l) => l.id === data.id_noi_luu_truoc)?.ten_noi_luu;
  const ten_noi_luu_sau = locations.find((l) => l.id === data.id_noi_luu_sau)?.ten_noi_luu;
  const getEmp = (id: string | null | undefined) => {
    if (!id) return { ten: null, ma: null };
    const e = employees.find((x) => x.id === id);
    return { ten: e?.ho_ten ?? null, ma: e?.ma_nhan_vien ?? null };
  };
  const truoc = getEmp(data.id_nguoi_giu_truoc);
  const sau = getEmp(data.id_nguoi_giu_sau);
  const performer = getEmp(data.id_nguoi_thuc_hien);
  const assets = await getTaiSanList();
  const asset = assets.find((a) => a.id === data.id_tai_san);

  const now = new Date().toISOString();
  const newPhieu: PhieuCapPhatThuHoi = {
    id: `phieu-${Date.now()}`,
    loai_phieu: data.loai_phieu,
    id_tai_san: data.id_tai_san,
    ma_tai_san: asset?.ma_tai_san,
    ten_tai_san: asset?.ten_tai_san,
    id_noi_luu_truoc: data.id_noi_luu_truoc,
    ten_noi_luu_truoc,
    id_noi_luu_sau: data.id_noi_luu_sau,
    ten_noi_luu_sau,
    id_nguoi_giu_truoc: data.id_nguoi_giu_truoc ?? null,
    ten_nguoi_giu_truoc: truoc.ten,
    ma_nguoi_giu_truoc: truoc.ma,
    id_nguoi_giu_sau: data.id_nguoi_giu_sau ?? null,
    ten_nguoi_giu_sau: sau.ten,
    ma_nguoi_giu_sau: sau.ma,
    ngay_thuc_hien: data.ngay_thuc_hien,
    id_nguoi_thuc_hien: data.id_nguoi_thuc_hien,
    ten_nguoi_thuc_hien: performer.ten,
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: 1,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbPhieu = [newPhieu, ...dbPhieu];

  await updateTaiSanLocationAndHolder(data.id_tai_san, {
    id_noi_luu: data.id_noi_luu_sau,
    id_nhan_vien_dang_giu: data.id_nguoi_giu_sau ?? null,
  });

  return newPhieu;
};

export const updatePhieu = async (
  id: string,
  data: PhieuCapPhatThuHoiCreate,
  id_nguoi_thuc_hien: string
): Promise<PhieuCapPhatThuHoi> => {
  await delay(400);
  const idx = dbPhieu.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Phiếu không tồn tại');
  const [locations, employees] = await Promise.all([
    getAssetStorageLocations(),
    getEmployees(),
  ]);
  const ten_noi_luu_truoc = locations.find((l) => l.id === data.id_noi_luu_truoc)?.ten_noi_luu;
  const ten_noi_luu_sau = locations.find((l) => l.id === data.id_noi_luu_sau)?.ten_noi_luu;
  const getEmp = (id: string | null | undefined) => {
    if (!id) return { ten: null, ma: null };
    const e = employees.find((x) => x.id === id);
    return { ten: e?.ho_ten ?? null, ma: e?.ma_nhan_vien ?? null };
  };
  const truoc = getEmp(data.id_nguoi_giu_truoc);
  const sau = getEmp(data.id_nguoi_giu_sau);
  const performer = getEmp(data.id_nguoi_thuc_hien);
  const assets = await getTaiSanList();
  const asset = assets.find((a) => a.id === data.id_tai_san);
  const now = new Date().toISOString();
  const updated: PhieuCapPhatThuHoi = {
    ...dbPhieu[idx],
    loai_phieu: data.loai_phieu,
    id_tai_san: data.id_tai_san,
    ma_tai_san: asset?.ma_tai_san,
    ten_tai_san: asset?.ten_tai_san,
    id_noi_luu_truoc: data.id_noi_luu_truoc,
    ten_noi_luu_truoc: ten_noi_luu_truoc ?? undefined,
    id_noi_luu_sau: data.id_noi_luu_sau,
    ten_noi_luu_sau: ten_noi_luu_sau ?? undefined,
    id_nguoi_giu_truoc: data.id_nguoi_giu_truoc ?? null,
    ten_nguoi_giu_truoc: truoc.ten,
    ma_nguoi_giu_truoc: truoc.ma,
    id_nguoi_giu_sau: data.id_nguoi_giu_sau ?? null,
    ten_nguoi_giu_sau: sau.ten,
    ma_nguoi_giu_sau: sau.ma,
    ngay_thuc_hien: data.ngay_thuc_hien,
    id_nguoi_thuc_hien: data.id_nguoi_thuc_hien,
    ten_nguoi_thuc_hien: performer.ten,
    ghi_chu: data.ghi_chu?.trim() || null,
    tg_cap_nhat: now,
  };
  dbPhieu[idx] = updated;
  await updateTaiSanLocationAndHolder(data.id_tai_san, {
    id_noi_luu: data.id_noi_luu_sau,
    id_nhan_vien_dang_giu: data.id_nguoi_giu_sau ?? null,
  });
  const [enriched] = await enrichPhieu([updated]);
  return enriched;
};
