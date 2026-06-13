/**
 * Sentry — chỉ dynamic import, không kéo @sentry/react vào main chunk.
 */
let initPromise: Promise<void> | null = null;

export function ensureSentryInitialized(): Promise<void> {
  if (initPromise) return initPromise;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || typeof dsn !== 'string' || dsn.trim() === '') {
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
