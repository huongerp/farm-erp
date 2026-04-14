import { TaiSan } from '../core/types';
import { TaiSanFormValues } from '../core/schema';
import { getAssetGroups } from '../../thiet-lap-tai-san/services/nhom-tai-san-service';
import { getAssetStorageLocations } from '../../thiet-lap-tai-san/services/noi-luu-service';
import { getAssetStatuses } from '../../thiet-lap-tai-san/services/trang-thai-service';
import { getEmployeesRef } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import {
  getTaiSanListSupabase,
  createTaiSanSupabase,
  updateTaiSanSupabase,
  updateTaiSanKhauHaoSupabase,
  updateTaiSanLocationAndHolderSupabase,
  updateTaiSanFromKiemKeSupabase,
  deleteTaiSanSupabase,
  getNextMaTaiSanSupabase,
  checkMaTaiSanExistsSupabase,
  getDistinctThuongHieuSupabase,
  getDistinctModelSupabase,
  getDistinctXuatXuSupabase,
  getDistinctNhaCungCapSupabase,
} from './danh-muc-tai-san-supabase.service';

async function enrichTaiSan(items: TaiSan[]): Promise<TaiSan[]> {
  const [groups, locations, statuses, employees] = await Promise.all([
    getAssetGroups(),
    getAssetStorageLocations(),
    getAssetStatuses(),
    getEmployeesRef(),
  ]);
  const groupMap = new Map(groups.map((g) => [g.id, g.ten]));
  const locationMap = new Map(locations.map((l) => [l.id, { ten_noi_luu: l.ten_noi_luu, id_chi_nhanh: l.id_chi_nhanh, ten_chi_nhanh: l.ten_chi_nhanh }]));
  const statusMap = new Map(statuses.map((s) => [s.id, s.ten]));
  const employeeMap = new Map(employees.map((e) => [e.id, { ten: e.ho_ten, ma: e.ma_nhan_vien }]));
  return items.map((item) => {
    const loc = locationMap.get(item.id_noi_luu);
    return {
      ...item,
      ten_nhom: item.ten_nhom ?? groupMap.get(item.id_nhom),
      ten_noi_luu: item.ten_noi_luu ?? loc?.ten_noi_luu,
      id_chi_nhanh: item.id_chi_nhanh ?? loc?.id_chi_nhanh ?? null,
      ten_chi_nhanh: item.ten_chi_nhanh ?? loc?.ten_chi_nhanh ?? null,
      ten_trang_thai: item.ten_trang_thai ?? statusMap.get(item.id_trang_thai),
      ten_nhan_vien_dang_giu: item.id_nhan_vien_dang_giu
        ? (item.ten_nhan_vien_dang_giu ?? employeeMap.get(item.id_nhan_vien_dang_giu)?.ten)
        : null,
      ma_nhan_vien_dang_giu: item.id_nhan_vien_dang_giu
        ? (item.ma_nhan_vien_dang_giu ?? employeeMap.get(item.id_nhan_vien_dang_giu)?.ma)
        : null,
    };
  });
}

export const getTaiSanList = async (): Promise<TaiSan[]> => {
  const list = await getTaiSanListSupabase();
  return enrichTaiSan(list);
};

export const createTaiSan = async (data: TaiSanFormValues): Promise<TaiSan> => {
  const created = await createTaiSanSupabase(data);
  return (await enrichTaiSan([created]))[0];
};

export const updateTaiSan = async (id: string, data: TaiSanFormValues): Promise<TaiSan> => {
  const updated = await updateTaiSanSupabase(id, data);
  return (await enrichTaiSan([updated]))[0];
};

/** Cập nhật giá trị còn lại và khấu hao lũy kế (chỉ gọi từ module Khấu hao khi chốt kỳ) */
export const updateTaiSanKhauHao = async (
  id: string,
  payload: { gia_tri_con_lai: number | null; khau_hao_luy_ke: number }
): Promise<TaiSan> => {
  const updated = await updateTaiSanKhauHaoSupabase(id, payload);
  return (await enrichTaiSan([updated]))[0];
};

/** Cập nhật chỉ nơi lưu và/hoặc người đang giữ (dùng khi thực hiện phiếu cấp phát/thu hồi/luân chuyển) */
export const updateTaiSanLocationAndHolder = async (
  id: string,
  payload: { id_noi_luu?: string; id_nhan_vien_dang_giu?: string | null }
): Promise<TaiSan> => {
  const updated = await updateTaiSanLocationAndHolderSupabase(id, payload);
  return (await enrichTaiSan([updated]))[0];
};

/** Cập nhật sổ theo kết quả kiểm kê: đồng bộ nơi lưu, người giữ, trạng thái từ thực tế kiểm. */
export const updateTaiSanFromKiemKe = async (
  id: string,
  payload: { id_noi_luu?: string | null; id_nhan_vien_dang_giu?: string | null; id_trang_thai?: string | null }
): Promise<TaiSan> => {
  const updated = await updateTaiSanFromKiemKeSupabase(id, payload);
  return (await enrichTaiSan([updated]))[0];
};

/** Bảng fp_ts_tai_san không có cột trang_thai (0/1); no-op khi dùng Supabase. */
export const updateTaiSanStatus = async (_ids: string[], _status: 0 | 1): Promise<void> => {
  /* no-op: schema dùng id_trang_thai + ten_trang_thai */
};

export const deleteTaiSan = deleteTaiSanSupabase;

/** Mã tài sản tiếp theo dạng TS00001 (cho form tạo mới, user có thể sửa). */
export const getNextMaTaiSan = getNextMaTaiSanSupabase;

/** Kiểm tra mã tài sản đã tồn tại; excludeId = id bản ghi đang sửa (khi edit). */
export const checkMaTaiSanExists = (ma: string, excludeId?: string | null) =>
  checkMaTaiSanExistsSupabase(ma, excludeId);

/** Danh sách giá trị distinct thương hiệu (cho combobox enum + thêm mới). */
export const getDistinctThuongHieu = getDistinctThuongHieuSupabase;

/** Danh sách giá trị distinct model (cho combobox enum + thêm mới). */
export const getDistinctModel = getDistinctModelSupabase;

/** Danh sách giá trị distinct xuất xứ (cho combobox enum + thêm mới). */
export const getDistinctXuatXu = getDistinctXuatXuSupabase;

/** Danh sách giá trị distinct nhà cung cấp (cho combobox enum + thêm mới). */
export const getDistinctNhaCungCap = getDistinctNhaCungCapSupabase;
