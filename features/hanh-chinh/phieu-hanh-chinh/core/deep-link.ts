/**
 * Deep-link từ thông báo: `/hanh-chinh/phieu-hanh-chinh?phieu=<id>`.
 *
 * Worker dựng MỘT link dùng chung cho mọi người nhận, nên tab không thể quyết
 * ở phía server: cùng một phiếu, người tạo phải mở tab "Của tôi" còn người
 * duyệt phải mở tab "Tôi quản lý".
 */

/** Phải khớp `thamSoPhieu` của mục fp_hr_phieu_hanh_chinh trong services/notify/src/core/mo-ta-bang.ts. */
export const THAM_SO_PHIEU = 'phieu';

export type KetQuaChonTab =
  | { tab: 'my' | 'managed' }
  | { tab: null; lyDo: 'khong_co_quyen' };

/**
 * Tab nào mở phiếu này cho người đang xem:
 * - phiếu của chính mình → "Của tôi", kể cả khi có viewAll (tab quản lý không
 *   phải chỗ người ta đi tìm phiếu của mình);
 * - phiếu của người khác + viewAll → "Tôi quản lý";
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
    return { tab: 'my' };
  }
  if (viewAll) return { tab: 'managed' };
  return { tab: null, lyDo: 'khong_co_quyen' };
}
