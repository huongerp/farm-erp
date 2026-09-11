/**
 * Registry đơn giản cho các overlay đang mở (drawer, modal, confirm dialog).
 *
 * Vấn đề: mỗi GenericDrawer/ConfirmDialog tự đăng ký `document.addEventListener('keydown', ...)`
 * độc lập, không stopPropagation — nên khi có nhiều overlay xếp lớp (ví dụ: form PO → mở
 * drawer thêm dòng hàng → mở Combobox), một lần bấm Escape sẽ chạy TẤT CẢ các handler cùng
 * lúc, đóng luôn mọi thứ từ trên xuống dưới. Người dùng chỉ định huỷ dòng hàng đang sửa nhưng
 * mất luôn cả phiếu đang điền.
 *
 * Registry này cho từng overlay biết "tôi có đang là overlay trên cùng không" để chỉ overlay
 * đó phản hồi Escape.
 *
 * Registry cũng là nguồn tín hiệu 'overlay' của `lib/app-busy.ts`: hễ còn overlay đang mở
 * thì app được coi là bận và không tự reload để áp bản cập nhật mới. Nối ở đây thay vì ở
 * từng component để mọi GenericDrawer/ConfirmDialog được tính mà không phải sửa nơi gọi.
 */

import { registerBusy } from './app-busy';

let stack: number[] = [];
let nextId = 1;
/** Hàm gỡ "bận" tương ứng từng overlay đang mở. */
const busyReleases = new Map<number, () => void>();

/** Đăng ký một overlay mới lên đỉnh stack, trả về id để dùng cho pop/isTop. */
export function pushOverlay(): number {
  const id = nextId++;
  stack = [...stack, id];
  busyReleases.set(id, registerBusy('overlay'));
  return id;
}

/** Gỡ overlay khỏi stack (khi unmount hoặc đóng). An toàn khi gọi nhiều lần / id không tồn tại. */
export function popOverlay(id: number): void {
  stack = stack.filter((x) => x !== id);
  busyReleases.get(id)?.();
  busyReleases.delete(id);
}

/** true nếu overlay này đang ở trên cùng (là overlay duy nhất nên phản hồi Escape). */
export function isTopOverlay(id: number): boolean {
  return stack.length > 0 && stack[stack.length - 1] === id;
}
