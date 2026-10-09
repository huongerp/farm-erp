/**
 * Chuẩn hoá thông báo lỗi từ PostgREST / fetch (403, mạng, …)
 * để toast / UI hiển thị rõ tên loại lỗi thay vì chỉ `error.message` mặc định.
 */
import i18n from './i18n';

export type DbLikeError = {
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
export function formatDbError(err: unknown, ctx?: { resource?: string }): string {
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

  const rlsEnglish = /permission denied for|violates row-level security|row-level security/i.test(msg);
  if (code === '42501' || rlsEnglish) {
    // Trigger/RPC tự RAISE … USING ERRCODE = '42501' kèm câu tiếng Việt → giữ nguyên câu đó.
    if (!rlsEnglish && msg.trim()) return `[42501] ${msg.trim()}${suffix}`;
    return i18n.t('errors.db.forbiddenRls', { code: code || '42501' }) + suffix;
  }

  // 23505 — đụng unique index (vd uq_fp_farm_danh_sach_hang_hoa_ma). Xảy ra khi hai
  // người lưu cùng lúc, hoặc khi import chen vào giữa lúc app vừa kiểm tra trùng.
  if (code === '23505' || /duplicate key value violates unique constraint/i.test(msg)) {
    const field = /Key \((?<col>[^)]+)\)=\((?<val>[^)]*)\)/.exec(
      (isRecord(err) && typeof err.details === 'string' ? err.details : '') || msg
    );
    return (
      i18n.t('errors.db.uniqueViolation', {
        code: code || '23505',
        field: field?.groups ? `${field.groups.col} = ${field.groups.val}` : msg.trim(),
      }) + suffix
    );
  }

  // 23503 — khoá ngoại: xoá/sửa bản ghi đang được phiếu khác tham chiếu, hoặc ghi tham chiếu
  // tới bản ghi đã bị xoá. 23001 — cùng ca xoá, nhưng khoá khai ON DELETE RESTRICT.
  if (
    code === '23503' ||
    code === '23001' ||
    /violates (RESTRICT setting of )?foreign key constraint/i.test(msg)
  ) {
    const key = /^insert or update on table/i.test(msg) ? 'errors.db.foreignKeyMissing' : 'errors.db.foreignKeyInUse';
    return i18n.t(key, { code: code || '23503' }) + suffix;
  }

  if (code === '23502' || /null value in column/i.test(msg)) {
    const col = /null value in column "(?<col>[^"]+)"/i.exec(msg)?.groups?.col ?? '';
    return i18n.t('errors.db.notNull', { code: code || '23502', column: col }) + suffix;
  }

  if (code === '23514' || /violates check constraint/i.test(msg)) {
    const ten = /check constraint "(?<ten>[^"]+)"/i.exec(msg)?.groups?.ten ?? '';
    return i18n.t('errors.db.checkViolation', { code: code || '23514', constraint: ten }) + suffix;
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

export function throwDbError(err: unknown, ctx?: { resource?: string }): never {
  throw new Error(formatDbError(err, ctx));
}
