/**
 * MỘT cửa duy nhất cho mọi lệnh gọi Google (không dùng `googleapis` cho image nhẹ).
 *
 * - 429: Google từ chối TRƯỚC khi xử lý → luôn thử lại được.
 * - 5xx: chỉ thử lại khi lệnh `idempotent` (GET, PUT values, batchClear, định dạng).
 *   `append` / tạo file mà thử lại sau 5xx có thể ghi trùng hai lần.
 * - Đọc body dạng text trước rồi mới parse: Google đôi khi trả HTML lỗi.
 */

export class GoogleLoi extends Error {
  readonly status: number;
  readonly lyDo: string;
  constructor(status: number, lyDo: string, message: string) {
    super(message);
    this.status = status;
    this.lyDo = lyDo;
  }
}

const NGHI_MS = [1000, 2000, 4000];

function ngu(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function goiGoogle<T>(
  url: string,
  opts: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    accessToken?: string;
    body?: unknown;
    /** Form urlencoded (endpoint token OAuth). */
    form?: Record<string, string>;
    idempotent: boolean;
  },
): Promise<T> {
  const headers: Record<string, string> = {};
  let body: string | undefined;
  if (opts.accessToken) headers.Authorization = `Bearer ${opts.accessToken}`;
  if (opts.form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = new URLSearchParams(opts.form).toString();
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  for (let lan = 0; ; lan++) {
    let res: Response;
    try {
      res = await fetch(url, { method: opts.method ?? 'GET', headers, body, signal: AbortSignal.timeout(60_000) });
    } catch (e) {
      // Lỗi mạng/timeout: không biết Google đã nhận chưa → chỉ thử lại lệnh idempotent.
      if (opts.idempotent && lan < NGHI_MS.length) {
        await ngu(NGHI_MS[lan]!);
        continue;
      }
      throw new GoogleLoi(0, 'mang', `Không gọi được Google: ${(e as Error).message}`);
    }

    const text = await res.text();
    if (res.ok) return (text ? JSON.parse(text) : {}) as T;

    const thuLai = res.status === 429 || (res.status >= 500 && opts.idempotent);
    if (thuLai && lan < NGHI_MS.length) {
      await ngu(NGHI_MS[lan]!);
      continue;
    }

    let lyDo = '';
    let thongDiep = text.slice(0, 300);
    try {
      const j = JSON.parse(text) as { error?: string | { status?: string; message?: string }; error_description?: string };
      if (typeof j.error === 'string') {
        lyDo = j.error; // endpoint OAuth: { error: 'invalid_grant', error_description }
        thongDiep = j.error_description ?? j.error;
      } else if (j.error) {
        lyDo = j.error.status ?? '';
        thongDiep = j.error.message ?? thongDiep;
      }
    } catch {
      /* body không phải JSON — giữ nguyên text */
    }
    throw new GoogleLoi(res.status, lyDo, thongDiep);
  }
}
