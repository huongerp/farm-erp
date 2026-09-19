/**
 * Chuẩn hoá một dòng outbox đọc từ Postgres.
 *
 * node-postgres trả cột `bigint` dưới dạng CHUỖI để không mất chính xác với số
 * vượt 2^53. Nếu để nguyên thì hai chỗ hỏng lặng lẽ:
 *
 *   - `dinhTuyen` gọi `ketQua.delete(dong.actor_id)` với khoá số, xoá bằng chuỗi
 *     "7" không trúng khoá 7 → người vừa thao tác vẫn nhận thông báo về chính
 *     việc mình vừa làm.
 *   - Tra tên người thao tác bằng Map khoá số cũng trượt → nội dung lui về
 *     "Có người…" thay vì tên thật.
 *
 * Id nhân viên và id phiếu trong hệ thống này thừa sức nằm trong Number an toàn.
 */

import type { DongOutbox } from './types.ts';

export function soHoacNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function chuanHoaDongOutbox(row: Record<string, unknown>): DongOutbox {
  return {
    id: soHoacNull(row['id']) ?? 0,
    module_id: String(row['module_id'] ?? ''),
    bang: String(row['bang'] ?? ''),
    ban_ghi_id: soHoacNull(row['ban_ghi_id']) ?? 0,
    thao_tac: row['thao_tac'] === 'INSERT' ? 'INSERT' : 'UPDATE',
    trang_thai_cu: (row['trang_thai_cu'] as string | null) ?? null,
    trang_thai_moi: (row['trang_thai_moi'] as string | null) ?? null,
    actor_id: soHoacNull(row['actor_id']),
    payload: (row['payload'] as Record<string, unknown>) ?? {},
    payload_cu: (row['payload_cu'] as Record<string, unknown> | null) ?? null,
  };
}
