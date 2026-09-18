/**
 * Ô tìm kiếm của list view ở TẦNG SERVER (module phân trang bằng PostgREST).
 *
 * Đối trọng của `lib/list-search-matcher.ts` (phía client). Luật vẫn là luật cũ:
 * tìm trên mọi cột có chữ của bảng/view đang truy vấn.
 *
 * Khai một `SearchColumnSpec` cạnh service rồi gọi `buildPostgrestSearchOr` —
 * đừng ghép chuỗi `.or(...)` bằng tay nữa. Ba thứ hay quên khi viết tay, ở đây
 * có sẵn:
 *
 * - **cột số**: gõ `3` phải ra id 3, nhưng `ilike` trên cột số làm PostgREST trả
 *   400. `numeric` chỉ tham gia khi từ khoá là số nguyên.
 * - **cột ngày**: người dùng gõ `15/03/2024` chứ không gõ ISO. `dates` đổi sang
 *   khoảng `[ngày, ngày]`.
 * - **ký tự đặc biệt**: `%`, `_` phải escape; mẫu chứa dấu phẩy phải bọc ngoặc
 *   kép, nếu không parser của PostgREST tách sai điều kiện.
 */
import { postgrestQuotedIlikePattern } from './postgrest-or-ilike';

export interface SearchColumnSpec {
  /** Cột chữ — so bằng `ilike %từ khoá%`. */
  text?: readonly string[];
  /** Cột số nguyên — chỉ tham gia khi từ khoá là một số nguyên. */
  numeric?: readonly string[];
  /** Cột ngày (`date` / `timestamptz`) — khớp khi gõ dd/mm/yyyy hoặc yyyy-mm-dd. */
  dates?: readonly string[];
}

const DMY = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/;
const YMD = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

/** `15/03/2024` | `2024-03-15` → `YYYY-MM-DD`; dạng khác → `null`. */
export function parseNgayNhap(term: string): string | null {
  const s = term.trim();
  const dmy = DMY.exec(s);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const ymd = YMD.exec(s);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

/**
 * Các điều kiện `or=(...)` cho một từ khoá. Mảng RỖNG nghĩa là không lọc gì —
 * chỗ gọi phải bỏ qua `.or()` chứ đừng truyền chuỗi rỗng (PostgREST trả 400).
 */
export function buildPostgrestSearchOr(
  term: string | null | undefined,
  spec: SearchColumnSpec
): string[] {
  const search = term?.trim();
  if (!search) return [];

  const esc = search.replace(/%/g, '\\%').replace(/_/g, '\\_');
  const pat = postgrestQuotedIlikePattern(`%${esc}%`);
  const parts: string[] = (spec.text ?? []).map((col) => `${col}.ilike.${pat}`);

  const asNumber = Number(search);
  if (Number.isSafeInteger(asNumber) && String(asNumber) === search) {
    for (const col of spec.numeric ?? []) parts.push(`${col}.eq.${asNumber}`);
  }

  const day = parseNgayNhap(search);
  if (day) {
    // Phải bọc `and(...)`: để rời hai vế trong `or` thì thành "ngày >= X HOẶC
    // ngày <= X", tức khớp mọi bản ghi.
    for (const col of spec.dates ?? []) parts.push(`and(${col}.gte.${day},${col}.lte.${day})`);
  }

  return parts;
}

/** Gắn điều kiện tìm kiếm vào builder nếu có; không có thì trả nguyên builder. */
export function applyPostgrestSearch<T>(builder: T, term: string | null | undefined, spec: SearchColumnSpec): T {
  const parts = buildPostgrestSearchOr(term, spec);
  if (parts.length === 0) return builder;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (builder as any).or(parts.join(','));
}

/** Khoảng ngày `[from, to]` của một năm `yyyy` hoặc một tháng `yyyy-mm`. */
export function khoangNgay(moc: string): { from: string; to: string } | null {
  if (/^\d{4}$/.test(moc)) return { from: `${moc}-01-01`, to: `${moc}-12-31` };
  if (/^\d{4}-\d{2}$/.test(moc)) {
    const [y, m] = moc.split('-').map(Number);
    if (m < 1 || m > 12) return null;
    // Ngày 0 của tháng kế = ngày cuối tháng này (tự đúng cả năm nhuận).
    const cuoiThang = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
    return { from: `${moc}-01`, to: cuoiThang };
  }
  return null;
}

/**
 * Điều kiện PostgREST cho bộ lọc năm + tháng: `or=(and(ngay.gte.X,ngay.lte.Y),…)`.
 * Rỗng nghĩa là không lọc theo kỳ — chỗ gọi phải bỏ qua `.or()`.
 */
export function dieuKienKyTheoNgay(nam: string[], thang: string[], cot = 'ngay'): string[] {
  const parts: string[] = [];
  for (const moc of [...nam, ...thang]) {
    const khoang = khoangNgay(moc);
    if (khoang) parts.push(`and(${cot}.gte.${khoang.from},${cot}.lte.${khoang.to})`);
  }
  return parts;
}
