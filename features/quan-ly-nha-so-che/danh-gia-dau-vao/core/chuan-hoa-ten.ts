/**
 * So khớp tên gõ tay (lô, tổ trưởng, lý do): bỏ khoảng trắng thừa, không phân biệt hoa thường.
 * «  Võ thị  Cưng » và «Võ Thị Cưng» là một người / một lô.
 */
export function khoaTen(s: string | null | undefined): string {
  return (s ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
}

/** Tên đã gọn khoảng trắng; rỗng → null. */
export function gonTen(s: string | null | undefined): string | null {
  const v = (s ?? '').trim().replace(/\s+/g, ' ');
  return v === '' ? null : v;
}

/** Lý do vừa gõ chưa có trong danh sách chọn nhanh (rỗng thì không tính). */
export function laTenMoi(ten: string | null | undefined, dsTen: readonly string[]): boolean {
  const k = khoaTen(ten);
  return k !== '' && !dsTen.some((x) => khoaTen(x) === k);
}

/** Danh sách tên gợi ý không trùng (giữ cách viết của lần gặp đầu), bỏ rỗng, xếp A→Z. */
export function tenKhongTrung(dsTen: readonly (string | null | undefined)[]): string[] {
  const m = new Map<string, string>();
  for (const t of dsTen) {
    const g = gonTen(t);
    if (g && !m.has(khoaTen(g))) m.set(khoaTen(g), g);
  }
  return [...m.values()].sort((a, b) => a.localeCompare(b, 'vi'));
}
