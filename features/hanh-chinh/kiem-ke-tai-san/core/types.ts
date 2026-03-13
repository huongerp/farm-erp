/**
 * Kiểm kê tài sản: Đợt kiểm kê + Chi tiết từng tài sản (sổ vs thực tế).
 */

/** Trạng thái đợt kiểm kê (lưu tiếng Việt trong DB) */
export type TrangThaiDotKiemKe = 'Nháp' | 'Đang kiểm kê' | 'Hoàn thành';

/** Trạng thái hoạt động đợt (lưu tiếng Việt trong DB) */
export type TrangThaiActive = 'Đang hoạt động' | 'Ngừng hoạt động';

/** Kết quả kiểm kê từng dòng (lưu tiếng Việt trong DB) */
export type KetQuaKiemKe =
  | 'Chưa kiểm'
  | 'Khớp'
  | 'Chênh nơi lưu'
  | 'Chênh người giữ'
  | 'Chênh trạng thái'
  | 'Thiếu';

/** Đợt kiểm kê */
export interface DotKiemKe {
  id: string;
  ma_dot: string;
  ten_dot: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  trang_thai: TrangThaiDotKiemKe;
  id_nguoi_phu_trach: string;
  ten_nguoi_phu_trach?: string | null;
  ma_nguoi_phu_trach?: string | null;
  /** Phạm vi: id nhóm (rỗng = tất cả) */
  id_nhom: string[];
  /** Phạm vi: id nơi lưu (rỗng = tất cả) */
  id_noi_luu: string[];
  ghi_chu?: string | null;
  trang_thai_active: TrangThaiActive;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Chi tiết kiểm kê — một dòng = một tài sản trong đợt */
export interface ChiTietKiemKe {
  id: string;
  id_dot_kiem_ke: string;
  id_tai_san: string;
  ma_tai_san?: string;
  ten_tai_san?: string;
  /** Sổ sách (snapshot khi tạo đợt) */
  id_noi_luu_so: string;
  ten_noi_luu_so?: string | null;
  id_nguoi_giu_so?: string | null;
  ten_nguoi_giu_so?: string | null;
  id_trang_thai_so: string;
  ten_trang_thai_so?: string | null;
  /** Thực tế (người kiểm nhập) */
  id_noi_luu_thuc_te?: string | null;
  ten_noi_luu_thuc_te?: string | null;
  id_nguoi_giu_thuc_te?: string | null;
  ten_nguoi_giu_thuc_te?: string | null;
  id_trang_thai_thuc_te?: string | null;
  ten_trang_thai_thuc_te?: string | null;
  /** Kết quả so sánh */
  ket_qua: KetQuaKiemKe;
  ghi_chu_dong?: string | null;
  id_nguoi_kiem?: string | null;
  ten_nguoi_kiem?: string | null;
  ngay_kiem?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Payload tạo đợt */
export interface DotKiemKeCreate {
  ma_dot: string;
  ten_dot: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  id_nguoi_phu_trach: string;
  id_nhom: string[];
  id_noi_luu: string[];
  ghi_chu?: string | null;
}

/** Payload cập nhật kết quả một dòng chi tiết */
export interface ChiTietKiemKeUpdate {
  id_noi_luu_thuc_te?: string | null;
  id_nguoi_giu_thuc_te?: string | null;
  id_trang_thai_thuc_te?: string | null;
  ghi_chu_dong?: string | null;
}
