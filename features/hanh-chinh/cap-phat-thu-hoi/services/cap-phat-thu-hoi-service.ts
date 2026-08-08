import type { PhieuCapPhatThuHoi, PhieuCapPhatThuHoiCreate, PhieuChiTietWithHeader, PhieuChiTietRow } from '../core/types';
import {
  getPhieuListSupabase,
  getPhieuByIdSupabase,
  createPhieuSupabase,
  updatePhieuSupabase,
  deletePhieuSupabase,
  getPhieuChiTietByTaiSanIdSupabase,
  getAllPhieuChiTietSupabase,
  importPhieuCapPhatThuHoiListSupabase,
  type PhieuCapPhatThuHoiImportRow,
} from './cap-phat-thu-hoi-supabase.service';
import { getEmployeesRef } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';

export type { PhieuCapPhatThuHoiImportRow };

async function enrichPhieu(items: PhieuCapPhatThuHoi[]): Promise<PhieuCapPhatThuHoi[]> {
  const employees = await getEmployeesRef();
  const employeeMap = new Map(employees.map((e) => [e.id, { ten: e.ho_ten, ma: e.ma_nhan_vien }]));
  return items.map((item) => ({
    ...item,
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
  const created = await createPhieuSupabase(data, id_nguoi_thuc_hien, id_nguoi_tao, ten_nguoi_tao);
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

/** Lấy lịch sử cấp phát/thu hồi của 1 tài sản – dùng cho TaiSanDetail */
export const getPhieuChiTietByTaiSan = async (
  idTaiSan: string
): Promise<PhieuChiTietWithHeader[]> => {
  return getPhieuChiTietByTaiSanIdSupabase(idTaiSan);
};

/** Lấy toàn bộ dòng chi tiết kèm header – dùng cho tab "Chi tiết" tổng hợp */
export const getAllPhieuChiTiet = async (): Promise<PhieuChiTietRow[]> => {
  return getAllPhieuChiTietSupabase();
};

export const importPhieuCapPhatThuHoiList = (
  rows: PhieuCapPhatThuHoiImportRow[]
): Promise<{ created: number; errors: string[] }> =>
  importPhieuCapPhatThuHoiListSupabase(rows);
