/**
 * Kiểm kê kho phân thuốc: đợt kiểm kê + chi tiết từng (kho, hàng hóa) — sổ vs thực tế.
 * Bảng: fp_farm_dot_kiem_ke_pt, _kho, _chi_tiet (xem docs/supabase-fp_farm_dot_kiem_ke_pt.sql).
 */

/** Trạng thái đợt kiểm kê */
export type TrangThaiDotKiemKePT = 'draft' | 'dang_kiem_ke' | 'hoan_thanh';

/** Kết quả kiểm kê từng dòng (so sánh số lượng sổ vs thực tế) */
export type KetQuaKiemKePT = 'khop' | 'thieu' | 'thua' | 'chua_kiem';

/** Đợt kiểm kê kho phân thuốc */
export interface DotKiemKePT {
  id: string;
  ma_dot: string;
  ten_dot: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  trang_thai: TrangThaiDotKiemKePT;
  id_nguoi_phu_trach: string;
  ten_nguoi_phu_trach?: string | null;
  ma_nguoi_phu_trach?: string | null;
  id_nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
  ma_nguoi_tao?: string | null;
  /** Phạm vi: danh sách kho cần kiểm */
  id_kho: string[];
  ghi_chu?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Số kho trong đợt */
  so_kho?: number;
  /** Tổng số dòng hàng hóa trong danh sách kiểm kê */
  so_hang_hoa?: number;
  /** Số dòng lệch (thieu + thua) */
  so_lech?: number;
}

/**
 * Bản tóm tắt — vài cột, phủ TOÀN BỘ đợt trong phạm vi xem.
 * Chip lọc và tab Thống kê phải đếm trên toàn bộ dữ liệu, không phải trang đang xem.
 */
export interface DotKiemKePTTomTat {
  id: string;
  ma_dot: string;
  ten_dot: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  trang_thai: TrangThaiDotKiemKePT;
  id_nguoi_phu_trach: string;
  ten_nguoi_phu_trach?: string | null;
  id_nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
  id_kho: string[];
  so_kho: number;
  so_hang_hoa: number;
  so_lech: number;
}

/** Chi tiết kiểm kê — một dòng = một (kho, hàng hóa) trong đợt */
export interface ChiTietKiemKePT {
  id: string;
  id_dot_kiem_ke_pt: string;
  id_kho: string;
  ten_kho?: string | null;
  ma_kho?: string | null;
  id_hang_hoa: string;
  ma_hang?: string | null;
  ten_hang?: string | null;
  don_vi_tinh?: string | null;
  /** Số lượng sổ — snapshot tồn lúc tạo danh sách */
  so_luong_so: number;
  /** Số lượng đếm thực tế; `null` = chưa kiểm */
  so_luong_thuc_te?: number | null;
  ket_qua: KetQuaKiemKePT;
  ghi_chu_dong?: string | null;
  id_nguoi_kiem?: string | null;
  ten_nguoi_kiem?: string | null;
  ngay_kiem?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Phiếu kho phân thuốc sinh ra khi điều chỉnh tồn */
  id_phieu_kho_dieu_chinh?: string | null;
  so_luong_dieu_chinh?: number | null;
  tg_dieu_chinh_ton?: string | null;
}

export interface DotKiemKePTCreate {
  ma_dot: string;
  ten_dot: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  id_nguoi_phu_trach: string;
  id_kho: string[];
  ghi_chu?: string | null;
}

export interface ChiTietKiemKePTUpdate {
  so_luong_thuc_te?: number | null;
  ghi_chu_dong?: string | null;
}

/** Bộ lọc phạm vi khi tạo danh sách kiểm kê (kho, danh mục, hàng hóa — tùy chọn) */
export interface TaoDanhSachKiemKePTFilters {
  id_kho?: string[];
  id_danh_muc?: string[];
  id_hang_hoa?: string[];
}
