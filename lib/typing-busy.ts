/**
 * Coi "đang gõ" là app đang bận — nguồn tín hiệu `typing` của `lib/app-busy.ts`.
 *
 * Vì sao cần: chỉ `GenericDrawer` mới báo `isDirty`, nên app chỉ biết người dùng đang nhập
 * dở khi đó là form trong drawer. Gõ dở từ khoá ở ô tìm kiếm, đang lọc một bảng, hay điền
 * số trực tiếp trên lưới kiểm kê đều KHÔNG được tính — và app tự reload để áp bản mới ngay
 * giữa lúc đó. Nghe focus ở tầng document bắt được hết mọi ô nhập mà không phải sửa từng
 * nơi gọi.
 *
 * Module thuần DOM, không phụ thuộc React.
 */

import { registerBusy } from './app-busy';

/**
 * Rời khỏi ô nhập rồi vẫn giữ "đang bận" thêm ngần này. Người dùng hay blur khỏi ô rồi mới
 * với tay bấm nút Lưu — reload chen vào đúng khoảng trống đó là mất trắng những gì vừa gõ.
 */
export const TYPING_GRACE_MS = 15_000;

/** Các `type` của `<input>` không phải ô nhập liệu — bấm vào là một hành động, không phải gõ. */
const NON_TEXT_INPUT_TYPES = new Set(['button', 'submit', 'reset', 'image']);

/** true nếu phần tử này là chỗ người dùng nhập liệu. */
export function isEditableElement(el: EventTarget | null): boolean {
  if (el == null || typeof (el as HTMLElement).tagName !== 'string') return false;
  const node = el as HTMLElement;
  // `isContentEditable` là thuộc tính tính toán — jsdom không dựng nên phải soi cả attribute.
  if (node.isContentEditable) return true;
  const editableAttr = node.getAttribute?.('contenteditable');
  if (editableAttr != null && editableAttr !== 'false') return true;
  const tag = node.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    return !NON_TEXT_INPUT_TYPES.has((node as HTMLInputElement).type);
  }
  return false;
}

let release: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Ghi nhận "vừa có hoạt động nhập liệu": bật cờ bận và hẹn giờ tự tắt.
 *
 * Cố ý KHÔNG tắt cờ theo `focusout`: khi ô nhập bị xoá khỏi DOM lúc đóng drawer, hay khi
 * cửa sổ mất focus, trình duyệt không phát `focusout` — bám vào nó thì cờ kẹt vĩnh viễn và
 * app không bao giờ cập nhật nữa. Ở đây cờ luôn tự hết hạn.
 */
function touch(): void {
  if (release == null) release = registerBusy('typing');
  if (timer != null) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    release?.();
    release = null;
  }, TYPING_GRACE_MS);
}

/**
 * Con trỏ có đang đậu trong một ô nhập ngay lúc này không — đọc thẳng DOM nên không có
 * trạng thái để kẹt. Dùng kèm `isAppBusy()` ở nơi quyết định reload: người dùng ngừng gõ
 * nhưng vẫn để con trỏ trong ô thì vẫn chưa được reload.
 */
export function isTypingNow(): boolean {
  if (typeof document === 'undefined') return false;
  return isEditableElement(document.activeElement);
}

/**
 * Bắt đầu theo dõi. Trả về hàm dừng — gọi khi unmount để không rò listener trong test
 * hay StrictMode.
 */
export function startTypingBusy(): () => void {
  if (typeof document === 'undefined') return () => {};

  const onActivity = (e: Event) => {
    if (isEditableElement(e.target)) touch();
  };

  // `focusout` ở đây không phải để TẮT cờ mà để hẹn lại giờ: hết 15 giây sau khi rời ô,
  // `app-busy` phát tín hiệu "vừa hết bận" — đúng khoảnh khắc để áp bản cập nhật.
  document.addEventListener('focusin', onActivity);
  document.addEventListener('focusout', onActivity);
  document.addEventListener('input', onActivity, true);
  document.addEventListener('keydown', onActivity, true);

  // Ô nhập có thể đang được focus sẵn lúc gắn listener (vd. drawer tự focus ô đầu tiên).
  if (isTypingNow()) touch();

  return () => {
    document.removeEventListener('focusin', onActivity);
    document.removeEventListener('focusout', onActivity);
    document.removeEventListener('input', onActivity, true);
    document.removeEventListener('keydown', onActivity, true);
    __resetTypingBusy();
  };
}

/** Chỉ dùng trong test. */
export function __resetTypingBusy(): void {
  if (timer != null) {
    clearTimeout(timer);
    timer = null;
  }
  release?.();
  release = null;
}
