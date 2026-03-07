/** Hạng mục phiếu: Bảo trì hoặc Sửa chữa */
export type HangMuc = 'bao_tri' | 'sua_chua';

/** Phiếu bảo trì / sửa chữa – yêu cầu bảo trì hoặc sửa chữa tài sản */
export interface PhieuBaoTriSuaChua {
  id: string;
  hang_muc: HangMuc;
  id_tai_san: string;
  ma_tai_san?: string;
  ten_tai_san?: string;
  ngay_yeu_cau: string;
  ngay_hen: string;
  ngay_bat_dau?: string | null;
  ngay_hoan_thanh?: string | null;
  mo_ta: string;
  ghi_chu?: string | null;
  id_nguoi_tao: string;
  ten_nguoi_tao?: string | null;
  id_nguoi_phu_trach?: string | null;
  ten_nguoi_phu_trach?: string | null;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Payload tạo/sửa phiếu */
export interface PhieuBaoTriSuaChuaCreate {
  hang_muc: HangMuc;
  id_tai_san: string;
  ngay_yeu_cau: string;
  ngay_hen: string;
  ngay_bat_dau?: string | null;
  ngay_hoan_thanh?: string | null;
  mo_ta: string;
  ghi_chu?: string | null;
  id_nguoi_phu_trach?: string | null;
  /** Chỉ dùng khi cập nhật phiếu */
  trang_thai?: 0 | 1;
}
