/**
 * Cài đặt hệ số quy đổi theo farm (chi nhánh) × phẩm cấp — bảng `fp_var_bcsc_he_so_quy_doi`.
 * Form phiếu tra ở đây trước; không có mới rơi về gợi ý lịch sử (`he-so-quy-doi.ts`).
 */
import { normalizePhamCapKey } from './pham-cap';
import { parseHeSo } from './he-so-quy-doi';

export interface HeSoCaiDatRow {
  id?: string | number;
  id_chi_nhanh: string | number;
  ten_pham_cap: string;
  /** numeric(8,4) từ PostgREST: số hoặc chuỗi thập phân. */
  he_so_quy_doi: number | string;
}

/**
 * Hệ số mặc định của farm × phẩm cấp. So id bằng `String()`, so tên bằng
 * `normalizePhamCapKey` (bỏ hoa/thường, khoảng trắng đầu cuối).
 * Thiếu farm / tên / không khớp dòng nào → `null`.
 */
export function heSoTheoCaiDat(
  caiDat: HeSoCaiDatRow[] | null | undefined,
  idChiNhanh: string | number | null | undefined,
  tenPhamCap: string | null | undefined
): number | null {
  if (idChiNhanh == null || idChiNhanh === '') return null;
  const tenKey = normalizePhamCapKey(tenPhamCap);
  if (!tenKey) return null;
  const id = String(idChiNhanh);
  const row = (caiDat ?? []).find(
    (r) => String(r.id_chi_nhanh) === id && normalizePhamCapKey(r.ten_pham_cap) === tenKey
  );
  return row ? parseHeSo(row.he_so_quy_doi) : null;
}
