/**
 * Logic quyết định "khi nào được áp bản cập nhật mới" — tách thuần khỏi React/DOM để test.
 *
 * Nguyên tắc: không hỏi người dùng, cũng không reload ngay lúc phát hiện. Chờ tới thời
 * điểm an toàn — vừa lưu xong một phiếu, vừa đóng drawer, vừa đổi trang, hoặc vừa quay
 * lại tab — rồi mới reload. Không bao giờ reload khi đang có form mở/đang nhập dở.
 */

/** Điều gì vừa xảy ra khiến ta xét lại xem có nên áp bản mới. */
export type UpdateTrigger =
  /** Service Worker vừa báo có bản mới sẵn sàng. */
  | 'ready'
  /** Người dùng vừa đổi route. */
  | 'route'
  /** App vừa hết bận: lưu xong (CRUD), đóng drawer/dialog cuối cùng. */
  | 'idle'
  /** Tab vừa hiện lại sau khi bị ẩn đủ lâu. */
  | 'visible'
  /** Nhịp kiểm tra định kỳ — chỉ dùng cho lưới an toàn mềm, không tự reload. */
  | 'tick';

export type UpdateDecision =
  /** Reload ngay bây giờ. */
  | 'apply'
  /** Hiện toast có nút "Tải lại" để người dùng tự quyết. */
  | 'notify'
  /** Chưa làm gì, chờ thời điểm khác. */
  | 'wait';

/** Chu kỳ chủ động hỏi server xem có bản mới chưa — SPA không navigate nên SW không tự hỏi. */
export const UPDATE_CHECK_INTERVAL_MS = 15 * 60 * 1000;

/** Chờ một nhịp sau trigger rồi mới xét, tránh reload chồng lên toast "Lưu thành công". */
export const SAFE_MOMENT_DEBOUNCE_MS = 1_500;

/** Tab ẩn lâu hơn mức này thì lúc quay lại coi như người dùng đã rời việc. */
export const HIDDEN_THRESHOLD_MS = 30 * 1000;

/** Thời gian hiện toast "đang cập nhật" trước khi reload, để người dùng hiểu vì sao trang chớp. */
export const APPLY_TOAST_MS = 800;

/**
 * Lưới an toàn mềm: người dùng ngồi lì trong một form cả buổi thì sau ngần này mới nhắc
 * bằng toast — vẫn KHÔNG ép reload.
 */
export const SOFT_NOTIFY_AFTER_MS = 60 * 60 * 1000;

export interface UpdateState {
  /** Service Worker đã có bản mới đang chờ kích hoạt. */
  updateReady: boolean;
  /** `isAppBusy()` tại thời điểm xét. */
  busy: boolean;
  trigger: UpdateTrigger;
  /** Đã bao lâu kể từ lúc bản mới sẵn sàng. */
  msSinceReady: number;
  /** Đã hiện toast nhắc thủ công rồi thì thôi, không nhắc lại. */
  alreadyNotified: boolean;
}

export function decideUpdateAction(state: UpdateState): UpdateDecision {
  if (!state.updateReady) return 'wait';
  if (!state.busy) return 'apply';
  // Đang bận: chỉ nhịp định kỳ mới được nhắc, và chỉ sau khi đã chờ đủ lâu.
  if (
    state.trigger === 'tick' &&
    !state.alreadyNotified &&
    state.msSinceReady >= SOFT_NOTIFY_AFTER_MS
  ) {
    return 'notify';
  }
  return 'wait';
}

/**
 * Yêu cầu reload còn treo do chunk cũ 404 (`vite:preloadError`) trong lúc app đang bận.
 *
 * Khác với bản cập nhật do Service Worker báo: ở đây trang đã HỎNG một phần (không tải
 * được chunk), reload là bắt buộc — chỉ là phải chờ tới lúc người dùng không nhập dở.
 */
let pendingReloadAt: number | null = null;

/** Khoá chống lặp: chỉ tự reload vì chunk cũ đúng một lần mỗi phiên. */
export const PRELOAD_ERROR_RELOAD_KEY = 'vite-preload-error-reloaded';

export function requestReloadWhenIdle(): void {
  if (pendingReloadAt == null) pendingReloadAt = Date.now();
}

export function getPendingReloadAt(): number | null {
  return pendingReloadAt;
}

/** Chỉ dùng trong test. */
export function __resetPendingReload(): void {
  pendingReloadAt = null;
}
