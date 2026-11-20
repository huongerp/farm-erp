import { normalizePhamCapKey } from './pham-cap';
import { round4 } from './pham-cap-derived';

export { round4 };

/** Hệ số quy đổi tối đa (khớp numeric(8,4) của cột `he_so_quy_doi`). */
export const HE_SO_QUY_DOI_MAX = 9999;

/**
 * Đọc hệ số gõ tay trên ô chọn: nhận "1,25" hoặc "1.25".
 * Trả `null` khi trống / không phải số / âm / quá lớn.
 */
export function parseHeSo(input: unknown): number | null {
  if (input == null) return null;
  if (typeof input === 'number') {
    return Number.isFinite(input) && input >= 0 && input <= HE_SO_QUY_DOI_MAX ? round4(input) : null;
  }
  const text = String(input).trim().replace(/\s/g, '');
  if (!/^\d+([.,]\d+)?$/.test(text)) return null;
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) && n <= HE_SO_QUY_DOI_MAX ? round4(n) : null;
}

export interface HeSoLichSuRow {
  ten_pham_cap: string | null;
  he_so_quy_doi: number | string | null;
}

export interface HeSoGoiY {
  /** Các hệ số đã từng lưu — không trùng, tăng dần. */
  options: number[];
  /** Hệ số lần gần nhất theo tên phẩm cấp (key = `normalizePhamCapKey`). */
  ganNhatTheoPhamCap: Record<string, number>;
}

/** Gom lịch sử (đã sắp mới → cũ) thành danh sách để chọn + hệ số gần nhất theo phẩm cấp. */
export function buildHeSoGoiY(rows: HeSoLichSuRow[]): HeSoGoiY {
  const seen = new Set<number>();
  const ganNhatTheoPhamCap: Record<string, number> = {};
  for (const r of rows) {
    const heSo = parseHeSo(typeof r.he_so_quy_doi === 'string' ? Number(r.he_so_quy_doi) : r.he_so_quy_doi);
    if (heSo == null) continue;
    seen.add(heSo);
    const key = normalizePhamCapKey(r.ten_pham_cap);
    if (key && !(key in ganNhatTheoPhamCap)) ganNhatTheoPhamCap[key] = heSo;
  }
  return { options: [...seen].sort((a, b) => a - b), ganNhatTheoPhamCap };
}
