import type { PhieuBaoTriSuaChua, PhieuBaoTriSuaChuaCreate } from '../core/types';
import { getTaiSanList } from '../../danh-muc-tai-san/services/danh-muc-tai-san-service';
import { getEmployeesRef } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import { getLoaiChiPhiList } from '../../thiet-lap-tai-san/services/loai-chi-phi-service';
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
  const [assets, employees, loaiChiPhi] = await Promise.all([
    getTaiSanList(),
    getEmployeesRef(),
    getLoaiChiPhiList(),
  ]);
  const assetMap = new Map(assets.map((a) => [String(a.id), { ma: a.ma_tai_san, ten: a.ten_tai_san }]));
  const employeeMap = new Map(employees.map((e) => [String(e.id), { ten: e.ho_ten }]));
  const loaiTenById = new Map(loaiChiPhi.map((l) => [l.id, l.ten]));
  return items.map((item) => {
    const aid = String(item.id_tai_san);
    const fromAsset = assetMap.get(aid);
    return {
      ...item,
      /** Luôn ưu tiên danh mục tài sản hiện tại để hiển thị đúng khi đổi mã/tên tài sản */
      ma_tai_san: fromAsset?.ma ?? item.ma_tai_san,
      ten_tai_san: fromAsset?.ten ?? item.ten_tai_san,
      ten_hang_muc:
        item.ten_hang_muc ?? loaiTenById.get(item.id_hang_muc) ?? getHangMucLabel(item.id_hang_muc, i18n.t),
      ten_nguoi_tao:
        item.ten_nguoi_tao ??
        (item.id_nguoi_tao ? employeeMap.get(String(item.id_nguoi_tao))?.ten : undefined) ??
        null,
    };
  });
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
  id_nguoi_tao: string,
  options?: { ten_nguoi_tao?: string | null }
): Promise<PhieuBaoTriSuaChua> => {
  const created = await createPhieuChiPhiSupabase(
    { ...data, trang_thai: data.trang_thai ?? 'cho_duyet' },
    id_nguoi_tao,
    options
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
