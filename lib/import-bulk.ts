import { db } from './db';
import { formatSupabaseError } from './supabase-errors';

/**
 * Ghi hàng loạt cho luồng import Excel.
 *
 * Mục tiêu là số REQUEST, không phải số dòng: PostgREST nhận cả mảng trong một
 * request nên insert/upsert chạy theo lô 500. Riêng UPDATE theo từng id khác nhau
 * thì PostgREST không gộp được — chỉ dùng khi không upsert được (xem `bulkUpsert`).
 */

export const INSERT_CHUNK = 500;
export const UPDATE_CHUNK = 50;

/** PostgREST/Postgres: không có unique index nào khớp mệnh đề ON CONFLICT. */
const NO_MATCHING_UNIQUE = '42P10';

/**
 * `payload` để `unknown`: các service khai payload bằng interface riêng, mà interface
 * không có index signature nên không gán được vào `Record<string, unknown>`.
 */
export interface WriteItem {
  payload: unknown;
}

export interface BulkOutcome<T> {
  done: T[];
  failed: { item: T; msg: string }[];
}

interface PostgrestErrorLike {
  message?: string;
  code?: string;
}

export function chunkBy<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function errMessage(error: PostgrestErrorLike | null): string {
  if (error == null) return 'Unknown error';
  return formatSupabaseError(error);
}

/** INSERT theo lô. Lô nào lỗi thì mọi dòng trong lô đó được báo lỗi kèm thông điệp của DB. */
export async function bulkInsert<T extends WriteItem>(
  table: string,
  items: T[],
  chunkSize = INSERT_CHUNK
): Promise<BulkOutcome<T>> {
  const result: BulkOutcome<T> = { done: [], failed: [] };
  for (const group of chunkBy(items, chunkSize)) {
    const { error } = await db.from(table).insert(group.map((g) => g.payload) as never);
    if (error) {
      const msg = errMessage(error as PostgrestErrorLike);
      group.forEach((item) => result.failed.push({ item, msg }));
    } else {
      result.done.push(...group);
    }
  }
  return result;
}

/**
 * UPDATE từng dòng theo id — mỗi dòng một request, chỉ dùng làm đường lui.
 * Chạy theo cụm `Promise.allSettled` để không tuần tự hóa toàn bộ.
 */
export async function bulkUpdateById<T extends WriteItem>(
  table: string,
  items: (T & { id: string })[],
  chunkSize = UPDATE_CHUNK
): Promise<BulkOutcome<T & { id: string }>> {
  const result: BulkOutcome<T & { id: string }> = { done: [], failed: [] };
  for (const group of chunkBy(items, chunkSize)) {
    const settled = await Promise.allSettled(
      group.map((item) => db.from(table).update(item.payload as never).eq('id', Number(item.id)))
    );
    settled.forEach((res, i) => {
      const item = group[i];
      if (res.status === 'fulfilled' && !res.value.error) {
        result.done.push(item);
      } else {
        const msg =
          res.status === 'rejected'
            ? (res.reason as Error).message
            : errMessage(res.value.error as PostgrestErrorLike);
        result.failed.push({ item, msg });
      }
    });
  }
  return result;
}

export interface BulkUpsertOutcome<T> extends BulkOutcome<T> {
  /** `true` khi DB chưa có unique index cho `onConflict` — caller phải chạy đường lui. */
  unsupported: boolean;
}

/**
 * UPSERT theo lô trên một cột UNIQUE (1 request/lô cho cả thêm mới lẫn ghi đè).
 *
 * `payload` cố ý KHÔNG chứa `id` (cột `GENERATED ALWAYS AS IDENTITY` từ chối giá trị
 * tường minh) và không chứa `tg_tao` (cột vắng mặt thì nhánh ON CONFLICT DO UPDATE
 * không đụng tới, nên thời điểm tạo của bản ghi cũ được giữ nguyên).
 *
 * Chưa chạy migration unique thì trả `unsupported: true` ngay ở lô đầu, không ghi gì.
 */
export async function bulkUpsert<T extends WriteItem>(
  table: string,
  items: T[],
  onConflict: string,
  chunkSize = INSERT_CHUNK
): Promise<BulkUpsertOutcome<T>> {
  const result: BulkUpsertOutcome<T> = { done: [], failed: [], unsupported: false };
  for (const group of chunkBy(items, chunkSize)) {
    const { error } = await db.from(table).upsert(group.map((g) => g.payload) as never, { onConflict });
    if (error) {
      const err = error as PostgrestErrorLike;
      if (err.code === NO_MATCHING_UNIQUE) {
        return { done: [], failed: [], unsupported: true };
      }
      const msg = errMessage(err);
      group.forEach((item) => result.failed.push({ item, msg }));
    } else {
      result.done.push(...group);
    }
  }
  return result;
}
