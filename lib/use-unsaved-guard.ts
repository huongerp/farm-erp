import { useEffect } from 'react';
import { registerBusy } from './app-busy';

/**
 * Báo cho `lib/app-busy.ts` biết form này đang có thay đổi chưa lưu.
 *
 * `GenericDrawer` đã tự gọi theo prop `isDirty`, nên chỉ cần hook này cho form full-page
 * không nằm trong drawer. Tác dụng: app sẽ không tự reload để áp bản cập nhật mới, và F5
 * hay đóng tab sẽ bị trình duyệt hỏi lại.
 */
export function useUnsavedGuard(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return;
    return registerBusy('dirty');
  }, [isDirty]);
}
