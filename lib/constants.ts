/** Trạng thái chung (phòng ban, cấp bậc, chức vụ, …) – khớp giá trị text cột trang_thai trong Supabase */
export const TRANG_THAI = {
  DANG_DUNG: 'Đang dùng',
  NGUNG: 'Ngừng',
} as const;
export type TrangThai = (typeof TRANG_THAI)[keyof typeof TRANG_THAI];

/** Trạng thái nhân viên – khớp giá trị text cột trang_thai trong Supabase fp_var_nhan_vien */
export const TRANG_THAI_NV = {
  DANG_LAM_VIEC: 'Đang làm việc',
  NGHI_VIEC: 'Nghỉ việc',
  THU_VIEC: 'Thử việc',
  NGHI_PHEP: 'Nghỉ phép',
} as const;
export type TrangThaiNV = (typeof TRANG_THAI_NV)[keyof typeof TRANG_THAI_NV];
