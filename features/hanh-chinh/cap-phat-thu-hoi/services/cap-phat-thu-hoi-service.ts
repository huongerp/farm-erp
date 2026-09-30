import type { PhieuCapPhatThuHoi, PhieuCapPhatThuHoiCreate, PhieuChiTietWithHeader, PhieuChiTietRow } from '../core/types';
import type { PaginatedTableResult } from '@/lib/db';
import type { CapPhatThuHoiListServerQuery } from './cap-phat-thu-hoi-list-query';
import {
  getPhieuListDb,
  getPhieuByIdDb,
  createPhieuDb,
  updatePhieuDb,
  deletePhieuDb,
  getPhieuChiTietByTaiSanIdDb,
  getAllPhieuChiTietDb,
  importPhieuCapPhatThuHoiListDb,
  type PhieuCapPhatThuHoiImportRow,
  type PhieuCapPhatThuHoiImportItem,
  getPhieuCapPhatPageDb,
  fetchAllPhieuCapPhatForListQuery as fetchAllPhieuCapPhatForListQueryDb,
} from './cap-phat-thu-hoi-db.service';
import { getEmployeesRef } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';

export type { PhieuCapPhatThuHoiImportRow, PhieuCapPhatThuHoiImportItem };

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

/** Một trang danh sách (lọc / sắp xếp / phân trang ở PostgREST). */
export async function getPhieuCapPhatPage(
  query: CapPhatThuHoiListServerQuery
): Promise<PaginatedTableResult<PhieuCapPhatThuHoi>> {
  const page = await getPhieuCapPhatPageDb(query);
  return { ...page, data: await enrichPhieu(page.data) };
}

/** Toàn bộ bản ghi khớp bộ lọc — chỉ gọi khi mở hộp thoại Xuất file. */
export async function fetchAllPhieuCapPhatForListQuery(
  query: CapPhatThuHoiListServerQuery
): Promise<PhieuCapPhatThuHoi[]> {
  return enrichPhieu(await fetchAllPhieuCapPhatForListQueryDb(query));
}

export const getPhieuList = async (
  params: GetPhieuListParams = {}
): Promise<PhieuCapPhatThuHoi[]> => {
  const list = await getPhieuListDb(params);
  return enrichPhieu(list);
};

export const getPhieuById = async (id: string): Promise<PhieuCapPhatThuHoi | null> => {
  const found = await getPhieuByIdDb(id);
  if (!found) return null;
  const [enriched] = await enrichPhieu([found]);
  return enriched;
};

export const deletePhieu = async (ids: string[]): Promise<void> => {
  await deletePhieuDb(ids);
};

export const createPhieuAndExecute = async (
  data: PhieuCapPhatThuHoiCreate,
  id_nguoi_thuc_hien: string,
  id_nguoi_tao?: string | null,
  ten_nguoi_tao?: string | null
): Promise<PhieuCapPhatThuHoi> => {
  const created = await createPhieuDb(data, id_nguoi_thuc_hien, id_nguoi_tao, ten_nguoi_tao);
  const [enriched] = await enrichPhieu([created]);
  return enriched;
};

export const updatePhieu = async (
  id: string,
  data: PhieuCapPhatThuHoiCreate,
  id_nguoi_thuc_hien: string
): Promise<PhieuCapPhatThuHoi> => {
  const updated = await updatePhieuDb(id, data, id_nguoi_thuc_hien);
  const [enriched] = await enrichPhieu([updated]);
  return enriched;
};

/** Lấy lịch sử cấp phát/thu hồi của 1 tài sản – dùng cho TaiSanDetail */
export const getPhieuChiTietByTaiSan = async (
  idTaiSan: string
): Promise<PhieuChiTietWithHeader[]> => {
  return getPhieuChiTietByTaiSanIdDb(idTaiSan);
};

/** Lấy toàn bộ dòng chi tiết kèm header – dùng cho tab "Chi tiết" tổng hợp */
export const getAllPhieuChiTiet = async (): Promise<PhieuChiTietRow[]> => {
  return getAllPhieuChiTietDb();
};

export const importPhieuCapPhatThuHoiList = (items: PhieuCapPhatThuHoiImportItem[]) =>
  importPhieuCapPhatThuHoiListDb(items);
