/** Một khoản cộng hoặc trừ lương (tiền) */
export type CongTruLuongLoai = 'cong' | 'tru';

export interface CongTruLuongItem {
  id: string;
  loai: CongTruLuongLoai;
  so_tien: number;
  ly_do?: string;
}

/** Cấu hình lương theo nhân viên (mức tháng) */
export interface LuongNhanVienConfig {
  id: string;
  id_nhan_vien: string;
  /** Mức lương cơ bản tháng */
  luong_co_ban: number;
  /** Mức lương KPI tháng (đủ điều kiện đạt KPI) */
  luong_kpi: number;
  /** Mức lương trách nhiệm tháng */
  luong_trach_nhiem: number;
  /** Tổng phụ cấp tháng (hoặc mức cố định) */
  phu_cap: number;
  tg_tao?: string;
  tg_cap_nhat?: string;
}

/** Bản ghi bảng lương theo nhân viên + kỳ (tháng) */
export interface BangLuongRecord {
  id: string;
  id_nhan_vien: string;
  ten_nhan_vien?: string;
  ma_nhan_vien?: string;
  id_phong_ban?: string;
  ten_phong_ban?: string;
  nam: number;
  thang: number;

  /** Số ngày công thực tế */
  ngay_cong: number;
  /** Số ngày công chuẩn tháng (vd 22) */
  ngay_cong_chuan: number;

  /** Mức lương cơ bản tháng */
  luong_co_ban: number;
  /** Lương cơ bản đã tính theo ngày công */
  luong_co_ban_tinh: number;

  /** Mức lương KPI tháng (khi đạt) */
  luong_kpi: number;
  /** Điểm KPI (từ bảng chấm điểm KPI) */
  diem_kpi: number;
  /** Đạt KPI (>= ngưỡng, vd 85) */
  kpi_dat: boolean;
  /** Tỷ lệ áp dụng khi không đạt (vd 0.7) */
  ty_le_kpi_khong_dat: number;
  /** Lương KPI đã tính (có nhân % nếu không đạt) */
  luong_kpi_tinh: number;

  /** Mức lương trách nhiệm tháng */
  luong_trach_nhiem: number;
  /** Lương trách nhiệm đã tính theo ngày công */
  luong_trach_nhiem_tinh: number;

  /** Mức phụ cấp tháng */
  phu_cap: number;
  /** Phụ cấp đã tính theo ngày công */
  phu_cap_tinh: number;

  /** Các khoản cộng/trừ lương khác */
  cong_tru_khac: CongTruLuongItem[];
  /** Tổng cộng - trừ (số dương = được cộng, âm = bị trừ) */
  cong_tru_net: number;

  /** Tổng lương thực lĩnh */
  tong_luong: number;

  ghi_chu?: string;

  tg_tao: string;
  tg_cap_nhat: string;
}

/** Điểm KPI theo kỳ — trước đây lấy từ module chấm điểm KPI; có thể nối Supabase sau. */
export interface ChamDiemKpiRecord {
  id_nhan_vien: string;
  nam: number;
  thang: number;
  tong_kpi: number;
}

/** Tổng hợp ngày công — trước đây từ module chấm công. */
export interface EmployeeAttendanceRow {
  user_id: string;
  user_name?: string;
  department_name?: string | null;
  total_days: number;
}
