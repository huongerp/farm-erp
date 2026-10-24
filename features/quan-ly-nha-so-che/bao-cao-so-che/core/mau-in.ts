/**
 * Mẫu in báo cáo sơ chế: loại phiếu (tổng hợp / mục I–II / mục III–V), các mục in theo loại
 * và URL trang preview. Thuần — không phụ thuộc React.
 */

export const LOAI_IN = ['tong-hop', 'nhan-cong-so-che', 'pham-cap-kpi'] as const;
export type LoaiIn = (typeof LOAI_IN)[number];

export type MucIn = 'I' | 'II' | 'III' | 'IV' | 'V';

/** Mục nào hiện trên từng loại phiếu (tổng quan + ô ký có ở cả ba). */
export const MUC_THEO_LOAI: Record<LoaiIn, readonly MucIn[]> = {
  'tong-hop': ['I', 'II', 'III', 'IV', 'V'],
  'nhan-cong-so-che': ['I', 'II'],
  'pham-cap-kpi': ['III', 'IV', 'V'],
};

const laLoaiIn = (v: string | null | undefined): v is LoaiIn => v != null && (LOAI_IN as readonly string[]).includes(v);

/** Loại phiếu trong URL preview; thiếu / lạ → tổng hợp (link cũ không có `?loai`). */
export function docLoaiIn(sp: URLSearchParams): LoaiIn {
  const v = sp.get('loai');
  return laLoaiIn(v) ? v : 'tong-hop';
}

export function taoUrlPreview(id: string, loai: LoaiIn = 'tong-hop'): string {
  return `/quan-ly-nha-so-che/bao-cao-so-che/preview/${encodeURIComponent(id)}?loai=${loai}`;
}
