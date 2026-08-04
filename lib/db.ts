import { PostgrestClient } from '@supabase/postgrest-js';
import { API_URL } from './api-config';
import { layAccessToken, lamMoiNgay } from './token-store';
import { throwSupabaseError } from './supabase-errors';

export { throwSupabaseError, formatSupabaseError } from './supabase-errors';

/**
 * Client dữ liệu — PostgREST self-host trên VPS (trước đây là Supabase).
 *
 * Dùng `PostgrestClient` của `@supabase/postgrest-js`, đúng thư viện mà
 * `supabase-js` bọc bên trong, nên `.from()` và `.rpc()` giữ nguyên chữ ký:
 * toàn bộ ~345 chỗ gọi trong app không phải sửa. Chỉ phần xác thực là mới —
 * token do auth-service cấp, xem lib/token-store.ts.
 *
 * Runbook: docs/VPS_POSTGREST_PLAN.md
 */

/**
 * Đính `Authorization` vào mọi request và tự làm mới token khi hết hạn.
 *
 * Vẫn thử lại một lần khi gặp 401 dù token trông còn hạn: đồng hồ máy khách có
 * thể lệch, hoặc phiên vừa bị thu hồi phía server (nhân viên chuyển sang Nghỉ
 * việc, admin đặt lại mật khẩu).
 */
async function fetchKemToken(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const goi = async (token: string | null): Promise<Response> => {
    const headers = new Headers(init?.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  };

  const token = await layAccessToken();
  const res = await goi(token);

  if (res.status === 401 && token) {
    const tokenMoi = await lamMoiNgay();
    if (tokenMoi && tokenMoi !== token) return goi(tokenMoi);
  }

  return res;
}

/**
 * `PostgrestClient` tự ghép `${url}/${relation}` rồi `new URL(...)` — không
 * chấp nhận đường dẫn tương đối như `/api` (ném `Failed to construct 'URL':
 * Invalid URL`). Resolve về URL tuyệt đối theo origin hiện tại trước khi đưa
 * vào client; `API_URL` tuyệt đối (khi khai `VITE_API_URL`) thì giữ nguyên.
 */
const resolvedApiUrl = new URL(API_URL, window.location.origin).toString();

export const db = new PostgrestClient(resolvedApiUrl, { fetch: fetchKemToken });

/**
 * Dev-only request logger: đếm số request theo bảng trong một khoảng trượt 1 giây.
 *
 * Mục đích: phát hiện sớm regression egress (vd hook refetch chéo, useEffect
 * loop, cache key collision) ngay trong lúc phát triển — KHÔNG chạy ở production.
 *
 * Bật bằng biến môi trường:
 *   VITE_API_REQUEST_LOGGER=1   (file .env.local)
 * Hoặc chạy `localStorage.setItem('api-req-log','1')` trong DevTools console.
 */
function isLoggerEnabled(): boolean {
  if (import.meta.env.PROD) return false;
  const envFlag = import.meta.env.VITE_API_REQUEST_LOGGER;
  if (envFlag === '1' || envFlag === 'true') return true;
  if (typeof window !== 'undefined') {
    try {
      return window.localStorage.getItem('api-req-log') === '1';
    } catch {
      return false;
    }
  }
  return false;
}

if (typeof window !== 'undefined' && isLoggerEnabled()) {
  const origFetch = window.fetch.bind(window);
  const windowMs = 1000;
  const counters = new Map<string, number[]>(); // table -> timestamps
  const WARN_THRESHOLD = 10; // cảnh báo nếu >10 req/s cùng bảng — thường là loop/collision.
  const REST_PATH = `${API_URL}/`;

  window.fetch = async (input, init) => {
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes(REST_PATH)) {
        const afterRest = url.split(REST_PATH)[1] ?? '';
        const table = afterRest.split('?')[0].split('/')[0] || 'unknown';
        const now = Date.now();
        const arr = counters.get(table) ?? [];
        const pruned = arr.filter((t) => now - t < windowMs);
        pruned.push(now);
        counters.set(table, pruned);
        if (pruned.length >= WARN_THRESHOLD) {
          console.warn(`[api-logger] ${table}: ${pruned.length} req/1s (có thể đang lặp / cache key trùng)`);
        } else if (pruned.length > 1) {
          console.debug(`[api-logger] ${table}: ${pruned.length} req/1s`);
        }
      }
    } catch {
      /* ignore logger errors */
    }
    return origFetch(input, init);
  };
  console.info('[api-logger] enabled — theo dõi số request/giây theo bảng.');
}

/** Kích thước trang khi tải hết (PostgREST mặc định tối đa 1000 dòng/request) */
const DB_PAGE_SIZE = 1000;

/** PostgREST builder trả về thenable, không phải `Promise<...>` thuần — cho phép `await` giống Promise. */
/** PostgREST builder — thenable; `data` có thể là tập con cột so với `T`. */
type DbPageResult = PromiseLike<{
  data: unknown[] | null;
  error: { message: string } | null;
}>;

/**
 * Gọi một query theo từng trang (range) và gộp tất cả dòng về.
 * Dùng khi cần tải hết dữ liệu vượt quá giới hạn 1000 dòng mặc định.
 */
export async function fetchAllRows<T>(
  run: (from: number, to: number) => DbPageResult
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await run(from, from + DB_PAGE_SIZE - 1);
    if (error) throwSupabaseError(error);
    const list = (data ?? []) as T[];
    all.push(...list);
    if (list.length < DB_PAGE_SIZE) break;
    from += DB_PAGE_SIZE;
  }
  return all;
}

/** Kết quả một trang server-side (PostgREST `count: 'exact'` + `range`). */
export type PaginatedTableResult<T> = {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};

/**
 * Một trang dữ liệu — callback phải dùng `.select(..., { count: 'exact' }).range(from, to)`.
 */
type DbTablePageResult<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
  count: number | null;
}>;

export async function fetchTablePage<T>(
  page: number,
  pageSize: number,
  run: (from: number, to: number) => DbTablePageResult<T>
): Promise<PaginatedTableResult<T>> {
  const size = Math.max(1, pageSize);
  const p = Math.max(0, page);
  const from = p * size;
  const to = from + size - 1;
  const { data, error, count } = await run(from, to);
  if (error) throwSupabaseError(error);
  return { data: data ?? [], totalCount: count ?? 0, page: p, pageSize: size };
}
