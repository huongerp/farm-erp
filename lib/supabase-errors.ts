/**
 * Chuẩn hoá thông báo lỗi từ Supabase / PostgREST / fetch (403, mạng, …)
 * để toast / UI hiển thị rõ tên loại lỗi thay vì chỉ `error.message` mặc định.
 */
import i18n from './i18n';

export type SupabaseLikeError = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
  status?: number;
};

function isRecord(e: unknown): e is Record<string, unknown> {
  return e != null && typeof e === 'object';
}

function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message || '';
  if (isRecord(err) && typeof err.message === 'string') return err.message;
  return String(err ?? '');
}

function extractCode(err: unknown): string {
  if (!isRecord(err)) return '';
  const c = err.code;
  return typeof c === 'string' ? c : '';
}

/** Một số phiên bản client gắn status HTTP trên object lỗi. */
function extractHttpStatus(err: unknown): number | undefined {
  if (!isRecord(err)) return undefined;
  const s = err.status;
  if (typeof s === 'number' && Number.isFinite(s)) return s;
  const sc = err.statusCode;
  if (typeof sc === 'number' && Number.isFinite(sc)) return sc;
  const ctx = err.context;
  if (isRecord(ctx)) {
    const sc = ctx.status;
    if (typeof sc === 'number' && Number.isFinite(sc)) return sc;
  }
  return undefined;
}

function isNetworkFailure(message: string, err: unknown): boolean {
  const m = message.toLowerCase();
  if (
    m.includes('failed to fetch') ||
    m.includes('networkerror') ||
    m.includes('network request failed') ||
    m.includes('load failed') ||
    (m.includes('fetch') && m.includes('aborted'))
  ) {
    return true;
  }
  if (
    m.includes('err_connection_closed') ||
    m.includes('connection_closed') ||
    m.includes('connection reset') ||
    m.includes('econnreset') ||
    m.includes('etimedout') ||
    m.includes('socket hang up')
  ) {
    return true;
  }
  if (err instanceof TypeError && m.includes('fetch')) return true;
  return false;
}

/**
 * Trả về chuỗi hiển thị cho người dùng (đã qua i18n).
 * Luôn gắn mã lỗi kỹ thuật trong ngoặc vuông khi có, để dễ tra cứu.
 */
export function formatSupabaseError(err: unknown, ctx?: { resource?: string }): string {
  const resource = ctx?.resource?.trim();
  const suffix = resource ? ` — ${resource}` : '';
  const msg = extractMessage(err);
  const code = extractCode(err);
  const status = extractHttpStatus(err);

  if (isNetworkFailure(msg, err)) {
    return i18n.t('errors.db.network') + suffix;
  }

  if (status === 403) {
    return i18n.t('errors.db.forbidden403') + suffix;
  }
  if (
    status == null &&
    (/\b403\b/i.test(msg) || /^forbidden$/i.test(msg.trim()) || /new row violates row-level security/i.test(msg))
  ) {
    return i18n.t('errors.db.forbidden403') + suffix;
  }
  if (status === 401) {
    return i18n.t('errors.db.unauthorized401') + suffix;
  }
  if (status === 404) {
    return i18n.t('errors.db.notFound404') + suffix;
  }
  if (status != null && status >= 500 && status < 600) {
    return i18n.t('errors.db.serverError', { status: String(status) }) + suffix;
  }

  if (code === '42501' || /permission denied for|violates row-level security|row-level security/i.test(msg)) {
    return i18n.t('errors.db.forbiddenRls', { code: code || '42501' }) + suffix;
  }

  if (code === 'PGRST301' || /jwt expired|invalid jwt|jwt/i.test(msg)) {
    return i18n.t('errors.db.jwt', { code: code || 'JWT' }) + suffix;
  }

  const parts: string[] = [];
  if (code) parts.push(`[${code}]`);
  else if (status) parts.push(`[HTTP ${status}]`);
  parts.push(msg.trim() || i18n.t('errors.db.noMessage'));

  if (isRecord(err) && typeof err.hint === 'string' && err.hint.trim()) {
    parts.push(i18n.t('errors.db.hintLine', { hint: err.hint.trim() }));
  } else if (isRecord(err) && typeof err.details === 'string' && err.details.trim()) {
    parts.push(i18n.t('errors.db.detailsLine', { details: err.details.trim() }));
  }

  return parts.join(' ') + suffix;
}

export function throwSupabaseError(err: unknown, ctx?: { resource?: string }): never {
  throw new Error(formatSupabaseError(err, ctx));
}
