/**
 * Ai duyệt / từ chối phiếu — thuần. Gọi khi lưu trạng thái (nút Chuyển trạng thái, form Sửa).
 */
import type { TrangThaiPhieu } from './types';

export interface ThongTinDuyet {
  id_nguoi_duyet: string | null;
  nguoi_duyet: string | null;
  tg_duyet: string | null;
}

/**
 * - Sang Đã duyệt / Không duyệt (từ trạng thái khác) → ghi người đang bấm + thời điểm.
 * - Quay về Chờ duyệt → xoá.
 * - Trạng thái không đổi → `null` (giữ nguyên thông tin đã có, không ghi đè).
 * - Đã duyệt ↔ Trích quỹ → `null`: trích quỹ là bước chi sau khi duyệt, giữ người duyệt cũ.
 *   (Từ Chờ duyệt / Không duyệt nhảy thẳng sang Trích quỹ thì vẫn ghi người bấm.)
 */
export function thongTinDuyet(
  trangThaiCu: TrangThaiPhieu | undefined,
  trangThaiMoi: TrangThaiPhieu | undefined,
  nguoiDung: { id: string; hoTen: string | null },
  now: Date
): ThongTinDuyet | null {
  if (!trangThaiMoi || trangThaiMoi === trangThaiCu) return null;
  const daDuyet = (s: TrangThaiPhieu | undefined) => s === 'da_duyet' || s === 'trich_quy';
  if (daDuyet(trangThaiCu) && daDuyet(trangThaiMoi)) return null;
  if (trangThaiMoi === 'cho_duyet') return { id_nguoi_duyet: null, nguoi_duyet: null, tg_duyet: null };
  return {
    id_nguoi_duyet: nguoiDung.id || null,
    nguoi_duyet: nguoiDung.hoTen?.trim() || null,
    tg_duyet: now.toISOString(),
  };
}
