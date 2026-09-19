/**
 * Badge số chưa đọc trên icon app ngoài màn hình chính (Badging API).
 *
 * Service worker đã đặt badge lúc nhận push, nhưng nó chỉ biết số tại thời điểm
 * đó. Khi app đang mở, người dùng đọc/xoá thông báo liên tục nên phải đồng bộ
 * lại theo số thật, nếu không badge cứ đứng ở con số cũ mãi.
 */

import { useEffect } from 'react';

type NavigatorCoBadge = Navigator & {
  setAppBadge?: (so?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

export function hoTroBadge(): boolean {
  return typeof navigator !== 'undefined' && 'setAppBadge' in navigator;
}

/**
 * iOS chỉ cho đặt badge khi PWA đã thêm vào màn hình chính và đã cấp quyền thông
 * báo; chưa đủ điều kiện thì lời gọi ném lỗi. Badge là phần điểm xuyết nên nuốt
 * lỗi, không để nó nổi lên thành toast.
 */
export async function datBadgeApp(so: number): Promise<void> {
  if (!hoTroBadge()) return;
  const nav = navigator as NavigatorCoBadge;
  try {
    if (so > 0) await nav.setAppBadge?.(so);
    else await nav.clearAppBadge?.();
  } catch {
    // Trình duyệt không hỗ trợ hoặc chưa đủ quyền.
  }
}

/** Đồng bộ badge mỗi khi số chưa đọc đổi. */
export function useAppBadge(soChuaDoc: number): void {
  useEffect(() => {
    void datBadgeApp(soChuaDoc);
  }, [soChuaDoc]);
}
