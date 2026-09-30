/** Gợi ý khi thêm phiếu — tính trên bản tóm tắt toàn bộ phiếu. */

/** Chi nhánh của phiếu gần nhất do chính người dùng tạo (theo tg_tao). */
export function chiNhanhGanNhatCuaToi(
  rows: { id_nguoi_tao: string | null; id_chi_nhanh: string | null; tg_tao: string | null }[],
  userId: string | null | undefined
): string | null {
  if (!userId) return null;
  let best: { id: string; t: number } | null = null;
  for (const r of rows) {
    if (r.id_nguoi_tao !== String(userId) || !r.id_chi_nhanh) continue;
    const t = new Date(r.tg_tao ?? 0).getTime();
    if (!best || t > best.t) best = { id: r.id_chi_nhanh, t };
  }
  return best?.id ?? null;
}

/** Giá trị đã dùng (bỏ trống / trùng), dùng nhiều nhất trước — gợi ý combobox khách hàng / loại hàng. */
export function goiYGiaTri(values: (string | null)[]): string[] {
  const m = new Map<string, number>();
  values.forEach((v) => {
    const s = v?.trim();
    if (s) m.set(s, (m.get(s) ?? 0) + 1);
  });
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k]) => k);
}
