/**
 * Tồn kho: nguồn từ view fp_mh_ton_kho (Supabase).
 * Định mức: bảng fp_mh_dinh_muc_ton_kho — dùng qua getDinhMucTonKho / useDinhMucTonKho.
 */

import {
  getAllTonKhoSupabase,
  getTonKhoSupabase,
  getTonKhoTheoKhoSupabase,
  getTonKhoTheoHangHoaSupabase,
  getDinhMucTonKhoSupabase,
  getDinhMucListSupabase,
  getDinhMucByHangHoaSupabase,
  createDinhMucTonKhoSupabase,
  updateDinhMucTonKhoSupabase,
  deleteDinhMucTonKhoSupabase,
} from './ton-kho-supabase.service';

export type { TonKhoRecord, DinhMucTonKhoMap, DinhMucTonKhoRow } from './ton-kho-supabase.service';
export { dinhMucKey } from './ton-kho-supabase.service';

/** Lấy số lượng tồn tại (kho, hàng). Trả về 0 nếu chưa có. */
export const getTonKho = getTonKhoSupabase;

/** Lấy toàn bộ tồn theo một kho. */
export const getTonKhoTheoKho = getTonKhoTheoKhoSupabase;

/** Lấy toàn bộ bản ghi tồn (từ view fp_mh_ton_kho). */
export const getAllTonKho = getAllTonKhoSupabase;

/** Lấy tồn theo từng kho cho một hàng hóa. */
export const getTonKhoTheoHangHoa = getTonKhoTheoHangHoaSupabase;

/** Lấy map định mức (kho_id, hang_hoa_id) -> ton_toi_thieu. */
export const getDinhMucTonKho = getDinhMucTonKhoSupabase;

/** Danh sách định mức tồn kho (tab Định mức tồn). */
export const getDinhMucList = getDinhMucListSupabase;

/** Định mức theo hàng hóa (detail bảng con). */
export const getDinhMucByHangHoa = getDinhMucByHangHoaSupabase;

/** Tạo / cập nhật / xóa định mức. */
export const createDinhMucTonKho = createDinhMucTonKhoSupabase;
export const updateDinhMucTonKho = updateDinhMucTonKhoSupabase;
export const deleteDinhMucTonKho = deleteDinhMucTonKhoSupabase;

/**
 * Không cập nhật gì — tồn lấy từ view Supabase.
 * Giữ hàm để tương thích với module kiểm kê; kiểm kê có thể cần flow riêng (ghi bảng khác / điều chỉnh).
 */
export function capNhatTonKho(_id_kho: string, _id_hang_hoa: string, _bien_dong: number): void {
  // no-op: tồn thật từ view fp_mh_ton_kho
}
