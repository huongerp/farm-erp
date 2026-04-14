import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase chưa được cấu hình. Vui lòng tạo file .env (copy từ .env.example) và điền VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (lấy từ Supabase Dashboard → Settings → API).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
