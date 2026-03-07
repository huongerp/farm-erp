/**
 * Khấu hao tài sản: Kỳ khấu hao (tháng/năm) + Chi tiết từng tài sản trong kỳ.
 */

/** Trạng thái kỳ khấu hao */
export type TrangThaiKyKhauHao = 'draft' | 'chot';

/** Kỳ khấu hao (một tháng trong một năm) */
export interface KyKhauHao {
  id: string;
  thang: number;
  nam: number;
  trang_thai: TrangThaiKyKhauHao;
  /** Tổng nguyên giá (tính từ chi tiết khi đã tính toán) */
  tong_nguyen_gia?: number | null;
  /** Tổng khấu hao kỳ (tính từ chi tiết) */
  tong_khau_hao_ky?: number | null;
  ghi_chu?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Chi tiết khấu hao — một dòng = một tài sản trong kỳ */
export interface ChiTietKhauHao {
  id: string;
  id_ky_khau_hao: string;
  id_tai_san: string;
  ma_tai_san?: string | null;
  ten_tai_san?: string | null;
  id_nhom: string;
  ten_nhom?: string | null;
  nguyen_gia: number;
  gia_tri_con_lai_dau_ky: number;
  khau_hao_ky: number;
  khau_hao_luy_ke: number;
  gia_tri_con_lai_cuoi_ky: number;
  ten_noi_luu?: string | null;
  ten_nguoi_giu?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Payload tạo kỳ khấu hao */
export interface KyKhauHaoCreate {
  thang: number;
  nam: number;
  ghi_chu?: string | null;
}
