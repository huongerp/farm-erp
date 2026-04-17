import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase chưa được cấu hình. Vui lòng tạo file .env (copy từ .env.example) và điền VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (lấy từ Supabase Dashboard → Settings → API).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Dev-only request logger: intercept `fetch` chỉ cho các request đi Supabase REST
 * (`/rest/v1/<table>`) và đếm số request theo bảng trong một khoảng trượt 1 giây.
 *
 * Mục đích: phát hiện sớm regression egress (vd hook refetch chéo, useEffect
 * loop, cache key collision) ngay trong lúc phát triển — KHÔNG chạy ở production.
 *
 * Bật bằng biến môi trường:
 *   VITE_SUPABASE_REQUEST_LOGGER=1   (file .env.local)
 * Hoặc chạy `localStorage.setItem('supabase-req-log','1')` trong DevTools console.
 */
const SUPABASE_REST_PATH = '/rest/v1/';
function isLoggerEnabled(): boolean {
  if (import.meta.env.PROD) return false;
  const envFlag = import.meta.env.VITE_SUPABASE_REQUEST_LOGGER;
  if (envFlag === '1' || envFlag === 'true') return true;
  if (typeof window !== 'undefined') {
    try {
      return window.localStorage.getItem('supabase-req-log') === '1';
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

  window.fetch = async (input, init) => {
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes(SUPABASE_REST_PATH)) {
        const afterRest = url.split(SUPABASE_REST_PATH)[1] ?? '';
        const table = afterRest.split('?')[0].split('/')[0] || 'unknown';
        const now = Date.now();
        const arr = counters.get(table) ?? [];
        const pruned = arr.filter((t) => now - t < windowMs);
        pruned.push(now);
        counters.set(table, pruned);
        if (pruned.length >= WARN_THRESHOLD) {
          // eslint-disable-next-line no-console
          console.warn(`[supabase-logger] ${table}: ${pruned.length} req/1s (có thể đang lặp / cache key trùng)`);
        } else if (pruned.length > 1) {
          // eslint-disable-next-line no-console
          console.debug(`[supabase-logger] ${table}: ${pruned.length} req/1s`);
        }
      }
    } catch {
      /* ignore logger errors */
    }
    return origFetch(input, init);
  };
  // eslint-disable-next-line no-console
  console.info('[supabase-logger] enabled — theo dõi số request/giây theo bảng.');
}

/** Kích thước trang khi tải hết (Supabase/PostgREST mặc định tối đa 1000 dòng/request) */
const SUPABASE_PAGE_SIZE = 1000;

/**
 * Gọi một query Supabase theo từng trang (range) và gộp tất cả dòng về.
 * Dùng khi cần tải hết dữ liệu vượt quá giới hạn 1000 dòng mặc định.
 */
export async function fetchAllRows<T>(
  run: (from: number, to: number) => Promise<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await run(from, from + SUPABASE_PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const list = data ?? [];
    all.push(...list);
    if (list.length < SUPABASE_PAGE_SIZE) break;
    from += SUPABASE_PAGE_SIZE;
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
export async function fetchTablePage<T>(
  page: number,
  pageSize: number,
  run: (
    from: number,
    to: number
  ) => Promise<{ data: T[] | null; error: { message: string } | null; count: number | null }>
): Promise<PaginatedTableResult<T>> {
  const size = Math.max(1, pageSize);
  const p = Math.max(0, page);
  const from = p * size;
  const to = from + size - 1;
  const { data, error, count } = await run(from, to);
  if (error) throw new Error(error.message);
  return { data: data ?? [], totalCount: count ?? 0, page: p, pageSize: size };
}
