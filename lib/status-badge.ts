/**
 * Bảng màu badge trạng thái dùng chung toàn app.
 *
 * Trước đây mỗi module tự pha màu Tailwind cho badge trạng thái, dẫn tới 3 sắc độ khác nhau cho
 * cùng một ý nghĩa "thành công" (bg-500/10, bg-50/700, bg-100/700) và có màu mang 2 nghĩa trái
 * ngược nhau giữa các module (ví dụ amber vừa là "xuất" ở kho-vận vừa là "chuyển" ở
 * phieu-kho-phan-thuoc). getStatusBadgeClass() gom về một họ màu duy nhất
 * (bg-<c>-500/10 text-<c>-700 dark:text-<c>-300 border-<c>-500/20 — họ đang phổ biến nhất ở
 * kho-vận/mua-hàng), theo semantic trung tính thay vì theo tên trạng thái cụ thể của từng module.
 */

export type StatusBadgeSemantic =
  | 'success' // đã duyệt, đã hoàn thành, nhập
  | 'pending' // chờ duyệt, đang xử lý
  | 'waiting' // đang chờ (thụ động, không phải chờ duyệt) — vd chờ chuyển, chờ giao
  | 'rejected' // từ chối, thiếu, xuất
  | 'neutral' // trung tính — nháp, chưa xác định
  | 'info' // thông tin — chuyển, liên kết
  | 'warning'; // cảnh báo — thừa, chênh lệch

const SEMANTIC_CLASS: Record<StatusBadgeSemantic, string> = {
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  waiting: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
  rejected: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  neutral: 'bg-muted text-muted-foreground border-border',
  info: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  warning: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
};

/** Trả về class Tailwind (bg + text + dark:text + border) cho một semantic trạng thái. */
export function getStatusBadgeClass(semantic: StatusBadgeSemantic): string {
  return SEMANTIC_CLASS[semantic];
}
