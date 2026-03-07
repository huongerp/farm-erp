/**
 * Types cho module Kế hoạch chi phí.
 * Một bảng: mỗi bản ghi = 1 dòng (năm, phòng, khoản mục, mô tả, 12 tháng).
 * Liên kết với Danh mục tài chính (id_danh_muc) và Thu chi (aggregate thực chi).
 */

/** Một dòng kế hoạch chi phí (1 bản ghi = 1 bảng). */
export interface KeHoachChiPhi {
  id: string;
  nam: number;
  id_phong_ban?: string;
  ten_phong_ban?: string;
  id_danh_muc: string;
  ten_danh_muc: string;
  mo_ta?: string;
  thang_1: number;
  thang_2: number;
  thang_3: number;
  thang_4: number;
  thang_5: number;
  thang_6: number;
  thang_7: number;
  thang_8: number;
  thang_9: number;
  thang_10: number;
  thang_11: number;
  thang_12: number;
  /** Tổng năm = tổng 12 tháng (luôn đồng bộ). */
  tong_nam: number;
  /** Tổng số lượng (tổng 12 tháng so_luong, nếu có). */
  tong_sl?: number;
  /** Số lượng theo tháng (tùy chọn). */
  thang_1_so_luong?: number;
  thang_1_don_gia?: number;
  thang_2_so_luong?: number;
  thang_2_don_gia?: number;
  thang_3_so_luong?: number;
  thang_3_don_gia?: number;
  thang_4_so_luong?: number;
  thang_4_don_gia?: number;
  thang_5_so_luong?: number;
  thang_5_don_gia?: number;
  thang_6_so_luong?: number;
  thang_6_don_gia?: number;
  thang_7_so_luong?: number;
  thang_7_don_gia?: number;
  thang_8_so_luong?: number;
  thang_8_don_gia?: number;
  thang_9_so_luong?: number;
  thang_9_don_gia?: number;
  thang_10_so_luong?: number;
  thang_10_don_gia?: number;
  thang_11_so_luong?: number;
  thang_11_don_gia?: number;
  thang_12_so_luong?: number;
  thang_12_don_gia?: number;
  ghi_chu?: string;
  id_nguoi_tao?: string;
  ten_nguoi_tao?: string;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Helper: mảng key 12 tháng để iterate. */
export const THANG_KEYS = [
  'thang_1',
  'thang_2',
  'thang_3',
  'thang_4',
  'thang_5',
  'thang_6',
  'thang_7',
  'thang_8',
  'thang_9',
  'thang_10',
  'thang_11',
  'thang_12',
] as const;

export type ThangKey = (typeof THANG_KEYS)[number];

/** Dữ liệu thực chi aggregate theo danh mục + tháng (từ Thu chi). */
export interface ThucChiTheoThang {
  id_danh_muc: string;
  ten_danh_muc: string;
  thang_1: number;
  thang_2: number;
  thang_3: number;
  thang_4: number;
  thang_5: number;
  thang_6: number;
  thang_7: number;
  thang_8: number;
  thang_9: number;
  thang_10: number;
  thang_11: number;
  thang_12: number;
  tong_nam: number;
}
