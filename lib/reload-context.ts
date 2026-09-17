/**
 * Giữ chỗ người dùng đang xem qua một lần reload áp bản cập nhật.
 *
 * App tự reload để áp bản mới (xem `components/shared/PwaRegister.tsx`). Reload đúng lúc
 * rảnh thì không mất dữ liệu, nhưng vẫn đẩy người dùng về đầu một danh sách vừa cuộn xuống
 * cả trăm dòng — vẫn là "tự nhiên bị load lại". Lưu vị trí trước, khôi phục sau.
 *
 * Trang không cuộn bằng `window` mà bằng `<main id="main-content">` (xem
 * `components/layout/Layout.tsx`), nên phải lưu `scrollTop` của đúng phần tử đó.
 */

export const RELOAD_CONTEXT_KEY = 'app-reload-context';

/** Quá hạn này thì coi như ngữ cảnh của phiên khác, không khôi phục nữa. */
export const RELOAD_CONTEXT_TTL_MS = 60_000;

/** Id phần tử cuộn của khung ứng dụng. */
export const SCROLL_ROOT_ID = 'main-content';

/** Nội dung chờ khôi phục sẽ được nạp dần (React Query) — thử lại trong ngần này rồi thôi. */
const RESTORE_WINDOW_MS = 3_000;

export interface ReloadContext {
  /** `pathname + search` lúc lưu. */
  path: string;
  scrollTop: number;
  savedAt: number;
}

function getScrollRoot(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return document.getElementById(SCROLL_ROOT_ID);
}

/**
 * Kiểm tra một ngữ cảnh đã lưu có dùng được cho trang hiện tại không — thuần, để test.
 * Trả `null` khi dữ liệu hỏng, lệch trang, hoặc đã quá hạn.
 */
export function matchReloadContext(
  raw: string | null,
  currentPath: string,
  now: number = Date.now()
): ReloadContext | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const ctx = parsed as Partial<ReloadContext>;
  if (typeof ctx.path !== 'string' || typeof ctx.scrollTop !== 'number') return null;
  if (typeof ctx.savedAt !== 'number') return null;
  if (ctx.path !== currentPath) return null;
  if (now - ctx.savedAt > RELOAD_CONTEXT_TTL_MS) return null;
  if (now < ctx.savedAt) return null;
  return { path: ctx.path, scrollTop: ctx.scrollTop, savedAt: ctx.savedAt };
}

/** Ghi lại trang + vị trí cuộn hiện tại. Gọi ngay trước khi reload. */
export function saveReloadContext(now: number = Date.now()): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx: ReloadContext = {
      path: window.location.pathname + window.location.search,
      scrollTop: getScrollRoot()?.scrollTop ?? 0,
      savedAt: now,
    };
    window.sessionStorage.setItem(RELOAD_CONTEXT_KEY, JSON.stringify(ctx));
  } catch {
    /* sessionStorage bị chặn cũng không được cản việc cập nhật */
  }
}

/** Lấy ngữ cảnh hợp lệ cho trang hiện tại và xoá khỏi sessionStorage (chỉ dùng một lần). */
export function consumeReloadContext(
  currentPath: string,
  now: number = Date.now()
): ReloadContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const ctx = matchReloadContext(
      window.sessionStorage.getItem(RELOAD_CONTEXT_KEY),
      currentPath,
      now
    );
    window.sessionStorage.removeItem(RELOAD_CONTEXT_KEY);
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Khôi phục vị trí cuộn sau reload. Danh sách nạp bằng React Query nên lúc mount chiều cao
 * còn chưa đủ để cuộn tới — thử lại từng khung hình cho tới khi tới nơi hoặc hết hạn.
 * Người dùng tự cuộn thì dừng ngay, không giành tay lái.
 */
export function restoreReloadScroll(scrollTop: number): void {
  if (typeof window === 'undefined' || scrollTop <= 0) return;
  const deadline = Date.now() + RESTORE_WINDOW_MS;
  let stopped = false;

  const stop = () => {
    stopped = true;
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('keydown', stop);
  };
  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('keydown', stop);

  const tick = () => {
    if (stopped) return;
    const root = getScrollRoot();
    if (root != null) {
      root.scrollTop = scrollTop;
      if (Math.abs(root.scrollTop - scrollTop) < 1) {
        stop();
        return;
      }
    }
    if (Date.now() >= deadline) {
      stop();
      return;
    }
    window.requestAnimationFrame(tick);
  };
  window.requestAnimationFrame(tick);
}
