/**
 * Tồn kho: nguồn từ view fp_mh_ton_kho.
 * Định mức: bảng fp_mh_dinh_muc_ton_kho — dùng qua getDinhMucTonKho / useDinhMucTonKho.
 */

import {
  getAllTonKhoDb,
  getTonKhoDb,
  getTonKhoTheoKhoDb,
  getTonKhoTheoHangHoaDb,
  getDinhMucTonKhoDb,
  getDinhMucListDb,
  getDinhMucByHangHoaDb,
  createDinhMucTonKhoDb,
  updateDinhMucTonKhoDb,
  deleteDinhMucTonKhoDb,
} from './ton-kho-db.service';

export type {
  TonKhoRecord,
  TonKhoMatrixScope,
  DinhMucTonKhoMap,
  DinhMucTonKhoRow,
} from './ton-kho-db.service';
export { getTonKhoMatrixDb } from './ton-kho-db.service';
export { dinhMucKey } from './ton-kho-db.service';

/** Lấy số lượng tồn tại (kho, hàng). Trả về 0 nếu chưa có. */
export const getTonKho = getTonKhoDb;

/** Lấy toàn bộ tồn theo một kho. */
export const getTonKhoTheoKho = getTonKhoTheoKhoDb;

/** Lấy toàn bộ bản ghi tồn (từ view fp_mh_ton_kho). */
export const getAllTonKho = getAllTonKhoDb;

/** Lấy tồn theo từng kho cho một hàng hóa. */
export const getTonKhoTheoHangHoa = getTonKhoTheoHangHoaDb;

/** Lấy map định mức (kho_id, hang_hoa_id) -> ton_toi_thieu. */
export const getDinhMucTonKho = getDinhMucTonKhoDb;

/** Danh sách định mức tồn kho (tab Định mức tồn). */
export const getDinhMucList = getDinhMucListDb;

/** Định mức theo hàng hóa (detail bảng con). */
export const getDinhMucByHangHoa = getDinhMucByHangHoaDb;

/** Tạo / cập nhật / xóa định mức. */
export const createDinhMucTonKho = createDinhMucTonKhoDb;
export const updateDinhMucTonKho = updateDinhMucTonKhoDb;
export const deleteDinhMucTonKho = deleteDinhMucTonKhoDb;
