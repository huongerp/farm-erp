/**
 * Deep-link từ thông báo: `/hanh-chinh/phieu-hanh-chinh?phieu=<id>`.
 *
 * Worker dựng MỘT link dùng chung cho mọi người nhận. Từ khi gộp "Của tôi" +
 * "Tôi quản lý" thành một tab "Phiếu", chỉ còn phải quyết người xem có được
 * mở phiếu này không.
 */

/** Phải khớp `thamSoPhieu` của mục fp_hr_phieu_hanh_chinh trong services/notify/src/core/mo-ta-bang.ts. */
export const THAM_SO_PHIEU = 'phieu';

export type KetQuaChonTab =
  | { tab: 'list' }
  | { tab: null; lyDo: 'khong_co_quyen' };

/**
 * - phiếu của chính mình → mở;
 * - phiếu của người khác + viewAll → mở;
 * - phiếu của người khác, không viewAll → không mở. Bảng fp_hr_phieu_hanh_chinh
 *   chưa có RLS nên truy vấn theo id vẫn trả về phiếu của bất kỳ ai; cổng quyền
 *   thật sự nằm ở đây.
 */
export function chonTabChoPhieu(args: {
  nguoiTaoId: string;
  currentUserId: string;
  viewAll: boolean;
}): KetQuaChonTab {
  const { nguoiTaoId, currentUserId, viewAll } = args;
  if (currentUserId !== '' && nguoiTaoId !== '' && nguoiTaoId === currentUserId) {
    return { tab: 'list' };
  }
  if (viewAll) return { tab: 'list' };
  return { tab: null, lyDo: 'khong_co_quyen' };
}
