/**
 * PostgREST: tham số `or=(cond1,cond2,...)` phân tách điều kiện bằng dấu phẩy.
 * Mẫu ILIKE nếu chứa phẩy (vd kích thước "1,4") phải bọc ngoặc kép, kẻo parser
 * tách sai → 400 Bad Request.
 * @see https://postgrest.org/en/stable/references/api/tables_views.html#reserved-characters
 */
export function postgrestQuotedIlikePattern(likePattern: string): string {
  return `"${String(likePattern).replace(/"/g, '""')}"`;
}
