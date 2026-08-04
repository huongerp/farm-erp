/** Trạng thái chung (phòng ban, cấp bậc, chức vụ, …) – khớp giá trị text cột trang_thai trong Supabase */
export const TRANG_THAI = {
  DANG_DUNG: 'Đang dùng',
  NGUNG: 'Ngừng',
} as const;
export type TrangThai = (typeof TRANG_THAI)[keyof typeof TRANG_THAI];

/** Trạng thái đang hoạt động / ngừng hoạt động – dùng cho cột trạng thái các module (lưu text trong Supabase) */
export const TRANG_THAI_HOAT_DONG = {
  DANG_HOAT_DONG: 'Đang hoạt động',
  NGUNG_HOAT_DONG: 'Ngừng hoạt động',
} as const;
export type TrangThaiHoatDong = (typeof TRANG_THAI_HOAT_DONG)[keyof typeof TRANG_THAI_HOAT_DONG];

/** Trạng thái nhân viên – khớp giá trị text cột trang_thai trong Supabase fp_var_nhan_vien */
export const TRANG_THAI_NV = {
  DANG_LAM_VIEC: 'Đang làm việc',
  NGHI_VIEC: 'Nghỉ việc',
  THU_VIEC: 'Thử việc',
  NGHI_PHEP: 'Nghỉ phép',
} as const;
export type TrangThaiNV = (typeof TRANG_THAI_NV)[keyof typeof TRANG_THAI_NV];

/**
 * Mật khẩu cấp cho tài khoản mới khi admin không tự nhập — kèm cờ
 * `phai_doi_mat_khau = true` để buộc user đổi ở lần đăng nhập kế tiếp.
 */
export const DEFAULT_PASSWORD = '123456';

/** Độ dài mật khẩu tối thiểu – trùng ràng buộc trong RPC `rpc_set_mat_khau`. */
export const PASSWORD_MIN_LENGTH = 6;
