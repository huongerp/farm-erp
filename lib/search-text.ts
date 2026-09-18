/**
 * So khớp chuỗi cho ô tìm kiếm trên list view.
 *
 * Vì sao bỏ dấu: người dùng gõ nhanh không bỏ dấu ("ke toan", "nguyen van an").
 * `String.includes` trên chuỗi có dấu trượt hết những ca đó.
 */

/** Bỏ dấu tiếng Việt + thường hoá. `đ`/`Đ` không phải dấu tổ hợp nên xử riêng. */
export function foldVi(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Khớp khi **mọi** từ trong `query` xuất hiện ở ít nhất một `field`.
 *
 * Tách theo từ chứ không so nguyên chuỗi: gõ "an kinh doanh" vẫn ra
 * "Nguyễn Văn An — Phòng Kinh doanh" dù hai mảnh nằm ở hai trường khác nhau.
 */
export function matchesSearch(
  fields: ReadonlyArray<string | null | undefined>,
  query: string
): boolean {
  const q = foldVi(query);
  if (!q) return true;
  const hay = fields.map(foldVi).filter(Boolean).join(' ');
  return q.split(/\s+/).every((word) => hay.includes(word));
}
