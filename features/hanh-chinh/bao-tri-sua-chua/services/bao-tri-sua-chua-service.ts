import type { PhieuBaoTriSuaChua, PhieuBaoTriSuaChuaCreate } from '../core/types';
import { getTaiSanList } from '../../danh-muc-tai-san/services/danh-muc-tai-san-service';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import { getHangMucLabel } from '../core/constants';
import i18n from '../../../../lib/i18n';
import {
  getPhieuChiPhiListSupabase,
  getPhieuChiPhiByIdSupabase,
  createPhieuChiPhiSupabase,
  updatePhieuChiPhiSupabase,
  deletePhieuChiPhiSupabase,
  type GetPhieuChiPhiListParams,
} from './chi-phi-tai-san-supabase.service';

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
    ten_hang_muc: item.ten_hang_muc ?? getHangMucLabel(item.id_hang_muc, i18n.t),
    ten_nguoi_tao: item.ten_nguoi_tao ?? employeeMap.get(item.id_nguoi_tao)?.ten ?? null,
  }));
}

export type GetPhieuBaoTriListParams = GetPhieuChiPhiListParams;

export const getPhieuBaoTriList = async (
  params: GetPhieuBaoTriListParams = {}
): Promise<PhieuBaoTriSuaChua[]> => {
  const list = await getPhieuChiPhiListSupabase(params);
  return enrichPhieu(list);
};

export const getPhieuBaoTriById = async (id: string): Promise<PhieuBaoTriSuaChua | null> => {
  const found = await getPhieuChiPhiByIdSupabase(id);
  if (!found) return null;
  const [enriched] = await enrichPhieu([found]);
  return enriched;
};

export const deletePhieuBaoTri = async (ids: string[]): Promise<void> => {
  await deletePhieuChiPhiSupabase(ids);
};

export const createPhieuBaoTri = async (
  data: PhieuBaoTriSuaChuaCreate,
  id_nguoi_tao: string
): Promise<PhieuBaoTriSuaChua> => {
  const created = await createPhieuChiPhiSupabase(
    { ...data, trang_thai: data.trang_thai ?? 'cho_duyet' },
    id_nguoi_tao
  );
  const [enriched] = await enrichPhieu([created]);
  return enriched;
};

export const updatePhieuBaoTri = async (
  id: string,
  data: PhieuBaoTriSuaChuaCreate
): Promise<PhieuBaoTriSuaChua> => {
  const updated = await updatePhieuChiPhiSupabase(id, data);
  const [enriched] = await enrichPhieu([updated]);
  return enriched;
};
