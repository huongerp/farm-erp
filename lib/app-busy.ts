/**
 * Registry "app đang bận" — nguồn sự thật duy nhất để biết người dùng có đang làm dở
 * việc gì không.
 *
 * Vì sao cần: app tự áp bản cập nhật mới bằng cách reload trang (xem
 * `components/shared/PwaRegister.tsx`). Reload đúng lúc người dùng đang điền phiếu là
 * mất trắng dữ liệu, nên phải có một chỗ tập trung trả lời câu hỏi "giờ reload có an
 * toàn không?". `index.tsx` (xử lý chunk cũ 404) cũng hỏi cùng câu hỏi đó.
 *
 * Ba nguồn tín hiệu:
 * - `overlay`: có drawer/modal/confirm đang mở — nối tự động từ `lib/overlay-stack.ts`,
 *   nên mọi `GenericDrawer` và `ConfirmDialog` được tính mà không phải sửa từng nơi gọi.
 * - `dirty`: form bên trong có thay đổi CHƯA LƯU (GenericDrawer báo qua prop `isDirty`,
 *   form full-page báo qua `useUnsavedGuard`). Chỉ loại này mới chặn F5/đóng tab.
 * - `mutation`: đang có request ghi dữ liệu chạy dở (cầu nối từ `useIsMutating`).
 *
 * Module thuần, không phụ thuộc React, để `index.tsx` dùng được trước khi React mount.
 */

export type BusyKind = 'overlay' | 'dirty' | 'mutation';

const counts: Record<BusyKind, number> = { overlay: 0, dirty: 0, mutation: 0 };
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* một listener lỗi không được chặn các listener còn lại */
    }
  });
}

/**
 * Đánh dấu app đang bận vì một lý do. Trả về hàm gỡ — gọi nhiều lần chỉ có tác dụng
 * một lần (an toàn khi React StrictMode chạy cleanup hai lượt).
 */
export function registerBusy(kind: BusyKind): () => void {
  counts[kind] += 1;
  notify();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    counts[kind] = Math.max(0, counts[kind] - 1);
    notify();
  };
}

/** Cầu nối từ `useIsMutating()` — đặt thẳng số lượng thay vì đếm tăng/giảm. */
export function setMutationCount(n: number): void {
  const next = Math.max(0, n);
  if (counts.mutation === next) return;
  counts.mutation = next;
  notify();
}

/** true khi có bất kỳ lý do nào khiến reload lúc này là thô lỗ. */
export function isAppBusy(): boolean {
  return counts.overlay > 0 || counts.dirty > 0 || counts.mutation > 0;
}

/**
 * true khi có dữ liệu người dùng đã gõ mà chưa lưu. Hẹp hơn `isAppBusy` — chỉ dùng cho
 * cảnh báo `beforeunload`, vì chặn F5 chỉ vì có drawer xem chi tiết đang mở là phiền.
 */
export function hasUnsavedInput(): boolean {
  return counts.dirty > 0;
}

/** Nghe mỗi lần trạng thái đổi — dùng để bắt khoảnh khắc "vừa hết bận". */
export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Chỉ dùng trong test. */
export function __resetAppBusy(): void {
  counts.overlay = 0;
  counts.dirty = 0;
  counts.mutation = 0;
  listeners.clear();
}

/**
 * Cảnh báo của trình duyệt khi F5/đóng tab lúc còn dữ liệu chưa lưu. Cài một lần ở tầng
 * module: trước đây app không chặn gì cả, lỡ tay F5 là mất phiếu đang điền.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', (e: BeforeUnloadEvent) => {
    if (!hasUnsavedInput()) return;
    e.preventDefault();
    // Chrome cũ vẫn cần returnValue; nội dung chuỗi bị trình duyệt bỏ qua.
    e.returnValue = '';
  });
}
