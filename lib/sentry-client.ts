/**
 * Sentry — chỉ dynamic import, không kéo @sentry/react vào main chunk.
 */
let initPromise: Promise<void> | null = null;

/**
 * DSN hợp lệ có dạng `https://<khoá>@<host>/<id dự án>`.
 *
 * Trước đây chỉ kiểm tra chuỗi rỗng, nên một giá trị đặt nhầm (thực tế trên production
 * là đúng một chữ "a") vẫn lọt vào Sentry.init. Sentry chỉ ném ra `Invalid Sentry Dsn`
 * trong console rồi thôi — nhìn bề ngoài vẫn như đang chạy, nhưng thực chất KHÔNG có
 * lỗi nào được gửi đi, giám sát production coi như tắt mà không ai biết.
 */
function dsnHopLe(dsn: string): boolean {
  return /^https?:\/\/[^@/\s]+@[^/\s]+\/\d+$/.test(dsn);
}

export function ensureSentryInitialized(): Promise<void> {
  if (initPromise) return initPromise;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || typeof dsn !== 'string' || dsn.trim() === '') {
    initPromise = Promise.resolve();
    return initPromise;
  }
  if (!dsnHopLe(dsn.trim())) {
    // Báo rõ ràng thay vì để Sentry ném lỗi khó hiểu rồi im lặng bỏ qua.
    console.warn(
      '[sentry] VITE_SENTRY_DSN sai định dạng nên KHÔNG bật giám sát lỗi. ' +
        'Cần dạng https://<khoá>@<host>/<id dự án>. Giá trị đang nhận có độ dài ' +
        `${dsn.trim().length} ký tự.`
    );
    initPromise = Promise.resolve();
    return initPromise;
  }
  initPromise = import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: dsn.trim(),
      environment: import.meta.env.MODE || 'production',
      enabled: true,
    });
  });
  return initPromise;
}

export async function captureExceptionWithSentry(
  error: Error,
  extra?: Record<string, unknown>
): Promise<void> {
  if (import.meta.env.DEV) return;
  await ensureSentryInitialized();
  const Sentry = await import('@sentry/react');
  Sentry.captureException(error, extra ? { extra } : undefined);
}
