import type { PhieuCapPhatThuHoi, PhieuCapPhatThuHoiCreate } from '../core/types';
import {
  getPhieuListSupabase,
  getPhieuByIdSupabase,
  createPhieuSupabase,
  updatePhieuSupabase,
  deletePhieuSupabase,
} from './cap-phat-thu-hoi-supabase.service';
import { getTaiSanList } from '../../danh-muc-tai-san/services/danh-muc-tai-san-service';
import { getAssetStorageLocations } from '../../thiet-lap-tai-san/services/noi-luu-service';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';

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
  id_tai_san?: string;
}

export const getPhieuList = async (
  params: GetPhieuListParams = {}
): Promise<PhieuCapPhatThuHoi[]> => {
  const list = await getPhieuListSupabase(params);
  return enrichPhieu(list);
};

export const getPhieuById = async (id: string): Promise<PhieuCapPhatThuHoi | null> => {
  const found = await getPhieuByIdSupabase(id);
  if (!found) return null;
  const [enriched] = await enrichPhieu([found]);
  return enriched;
};

export const deletePhieu = async (ids: string[]): Promise<void> => {
  await deletePhieuSupabase(ids);
};

export const createPhieuAndExecute = async (
  data: PhieuCapPhatThuHoiCreate,
  id_nguoi_thuc_hien: string,
  id_nguoi_tao?: string | null,
  ten_nguoi_tao?: string | null
): Promise<PhieuCapPhatThuHoi> => {
  const created = await createPhieuSupabase(
    data,
    id_nguoi_thuc_hien,
    id_nguoi_tao,
    ten_nguoi_tao
  );
  const [enriched] = await enrichPhieu([created]);
  return enriched;
};

export const updatePhieu = async (
  id: string,
  data: PhieuCapPhatThuHoiCreate,
  id_nguoi_thuc_hien: string
): Promise<PhieuCapPhatThuHoi> => {
  const updated = await updatePhieuSupabase(id, data, id_nguoi_thuc_hien);
  const [enriched] = await enrichPhieu([updated]);
  return enriched;
};
