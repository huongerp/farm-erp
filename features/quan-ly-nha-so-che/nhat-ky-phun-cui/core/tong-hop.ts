/** Số liệu tổng hợp của một nhật ký (hiện ở danh sách / chi tiết). */

/** Tổng lượng nước (lít) của các lần pha, làm tròn 3 số lẻ. */
export function tongNuocLit(lan: readonly { luong_nuoc_lit: number | null }[]): number {
  const tong = lan.reduce((s, l) => s + (l.luong_nuoc_lit ?? 0), 0);
  return Math.round(tong * 1000) / 1000;
}

/** Tên các thuốc khác nhau theo thứ tự xuất hiện (bỏ dòng chưa rõ tên). */
export function cacThuoc(lan: readonly { ten_hang_hoa: string | null }[]): string[] {
  const seen = new Set<string>();
  for (const l of lan) {
    const ten = (l.ten_hang_hoa ?? '').trim();
    if (ten) seen.add(ten);
  }
  return [...seen];
}
