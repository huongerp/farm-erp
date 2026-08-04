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
 */

let stack: number[] = [];
let nextId = 1;

/** Đăng ký một overlay mới lên đỉnh stack, trả về id để dùng cho pop/isTop. */
export function pushOverlay(): number {
  const id = nextId++;
  stack = [...stack, id];
  return id;
}

/** Gỡ overlay khỏi stack (khi unmount hoặc đóng). An toàn khi gọi nhiều lần / id không tồn tại. */
export function popOverlay(id: number): void {
  stack = stack.filter((x) => x !== id);
}

/** true nếu overlay này đang ở trên cùng (là overlay duy nhất nên phản hồi Escape). */
export function isTopOverlay(id: number): boolean {
  return stack.length > 0 && stack[stack.length - 1] === id;
}
