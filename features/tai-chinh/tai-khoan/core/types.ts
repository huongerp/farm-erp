/**
 * Types cho module Tài khoản (re-export + mở rộng).
 */
import type { TaiKhoan as TaiKhoanBase } from '../../core/types';

export type { TaiKhoanBase as TaiKhoan };

/** Loại tài khoản: tiền mặt hoặc ngân hàng. */
export type LoaiTaiKhoan = 'tien_mat' | 'ngan_hang';

/** Dòng số dư theo kỳ (tab Tra cứu theo kỳ). */
export interface SoDuKyRow {
  ky: string;
  ky_label: string;
  id_tai_khoan: string;
  ten_tai_khoan: string;
  loai_tai_khoan: string;
  so_du_dau_ky: number;
  tong_thu: number;
  tong_chi: number;
  so_du_cuoi_ky: number;
}
