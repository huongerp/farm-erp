/**
 * Kiểm kê kho: Đợt kiểm kê + Chi tiết từng (kho, hàng hóa) — sổ vs thực tế (số lượng).
 */

/** Trạng thái đợt kiểm kê */
export type TrangThaiDotKiemKeKho = 'draft' | 'dang_kiem_ke' | 'hoan_thanh';

/** Kết quả kiểm kê từng dòng (so sánh số lượng sổ vs thực tế) */
export type KetQuaKiemKeKho = 'khop' | 'thieu' | 'thua' | 'chua_kiem';

/** Đợt kiểm kê kho */
export interface DotKiemKeKho {
  id: string;
  ma_dot: string;
  ten_dot: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  trang_thai: TrangThaiDotKiemKeKho;
  id_nguoi_phu_trach: string;
  ten_nguoi_phu_trach?: string | null;
  ma_nguoi_phu_trach?: string | null;
  /** Phạm vi: danh sách kho cần kiểm */
  id_kho: string[];
  ghi_chu?: string | null;
  trang_thai_active: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Số kho trong đợt ( = id_kho.length, có thể từ list) */
  so_kho?: number;
  /** Tổng số dòng hàng hóa trong danh sách kiểm kê */
  so_hang_hoa?: number;
  /** Số dòng lệch (thieu + thua) */
  so_lech?: number;
}

/** Chi tiết kiểm kê — một dòng = một (kho, hàng hóa) trong đợt */
export interface ChiTietKiemKeKho {
  id: string;
  id_dot_kiem_ke_kho: string;
  id_kho: string;
  ten_kho?: string | null;
  ma_kho?: string | null;
  id_hang_hoa: string;
  ma_hang?: string | null;
  ten_hang?: string | null;
  don_vi_tinh?: string | null;
  /** Sổ sách (snapshot khi tạo danh sách) */
  so_luong_so: number;
  /** Thực tế (người kiểm nhập) */
  so_luong_thuc_te?: number | null;
  /** Kết quả so sánh */
  ket_qua: KetQuaKiemKeKho;
  ghi_chu_dong?: string | null;
  id_nguoi_kiem?: string | null;
  ten_nguoi_kiem?: string | null;
  ngay_kiem?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Phiếu nhập/xuất điều chỉnh tồn (sau khi post) */
  id_phieu_kho_dieu_chinh?: string | null;
  /** |thực tế − sổ| đã ghi nhận lên phiếu */
  so_luong_dieu_chinh?: number | null;
  tg_dieu_chinh_ton?: string | null;
}

/** Payload tạo đợt */
export interface DotKiemKeKhoCreate {
  ma_dot: string;
  ten_dot: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  id_nguoi_phu_trach: string;
  id_kho: string[];
  ghi_chu?: string | null;
}

/** Payload cập nhật kết quả một dòng chi tiết */
export interface ChiTietKiemKeKhoUpdate {
  so_luong_thuc_te?: number | null;
  ghi_chu_dong?: string | null;
}
