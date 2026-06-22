/**
 * Quy định kích thước Dialog (modal giữa màn hình) và Drawer (slide từ phải).
 * Dùng thống nhất toàn app để giao diện chuyên nghiệp, đồng bộ.
 */

// ========== DIALOG (modal centered) ==========
/** Kích thước dialog – dùng class Tailwind cho container */
export const DIALOG_SIZE = {
  /** Xác nhận đơn giản: xóa, confirm, hủy thao tác */
  CONFIRM: 'max-w-sm',
  /** Lựa chọn nhanh: export options, picker đơn giản */
  COMPACT: 'max-w-md',
  /** Nội dung vừa */
  MEDIUM: 'max-w-lg',
  /** Nội dung nhiều: import, upload, phê duyệt (comment, lịch sử) */
  LARGE: 'max-w-2xl',
} as const;

// ========== DRAWER (slide từ phải) – Form & Detail cùng kích thước, chuẩn theo drawer nhân viên ==========
/** Drawer Form và Detail: cùng 48rem (768px) */
export const DRAWER_WIDTH_FORM = 'sm:w-[48rem] sm:min-w-[48rem] sm:max-w-[48rem]';
/** Detail dùng chung với Form */
export const DRAWER_WIDTH_DETAIL = DRAWER_WIDTH_FORM;

/** Kiểm kê kho: form + detail cùng rộng hơn chuẩn (54rem ≈ 864px) cho bảng chi tiết */
export const DRAWER_WIDTH_KIEM_KE_KHO = 'sm:w-[54rem] sm:min-w-[54rem] sm:max-w-[54rem]';

/** Phiếu kho: form + detail bảng chi tiết nhiều cột (số lot, tồn, cảnh báo) */
export const DRAWER_WIDTH_PHIEU_KHO = DRAWER_WIDTH_KIEM_KE_KHO;

/** Báo cáo nhân công: form + detail rộng hơn chút cho bảng chuyền */
export const DRAWER_WIDTH_BAO_CAO_NHAN_CONG = 'sm:w-[60rem] sm:min-w-[60rem] sm:max-w-[60rem]';

/** Báo cáo sơ chế: bảng phẩm cấp + KPI nhiều cột → cùng cỡ nhân công */
export const DRAWER_WIDTH_BAO_CAO_SO_CHE = 'sm:w-[60rem] sm:min-w-[60rem] sm:max-w-[60rem]';

/** Drawer rộng cho form phức tạp cần panel phụ bên trái (82rem ≈ 1312px) */
export const DRAWER_WIDTH_WIDE = 'sm:w-[82rem] sm:min-w-[82rem] sm:max-w-[82rem]';

/** Drawer khi mở chồng lên drawer khác: nhỏ hơn (44rem) để tạo phân tầng */
export const DRAWER_WIDTH_STACKED = 'sm:w-[44rem] sm:min-w-[44rem] sm:max-w-[44rem]';

/** Drawer detail con / compact: nhỏ hơn (36rem) dùng trong detail lồng nhau */
export const DRAWER_WIDTH_DETAIL_SMALL = 'sm:w-[36rem] sm:min-w-[36rem] sm:max-w-[36rem]';

/**
 * Trả về class width cho drawer theo stack level.
 * level 0 = drawer nền (48rem), level >= 1 = drawer chồng (44rem).
 */
export function getDrawerWidthClass(stackLevel: number): string {
  return stackLevel > 0 ? DRAWER_WIDTH_STACKED : DRAWER_WIDTH_FORM;
}

/** Z-index base cho drawer (backdrop / content) – cao hơn header (z-40) và toolbar (z-30), đồng bộ với dialog overlay */
export const DRAWER_Z_BASE = 60;
export const DRAWER_Z_CONTENT_BASE = 61;
