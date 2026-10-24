/**
 * Tên các kho của một đợt kiểm kê để hiện gọn trên thẻ điện thoại: tối đa `toiDa` tên đầu,
 * phần còn lại gộp thành số "còn n kho". Id không có trong danh mục kho bị bỏ qua (không hiện id thô).
 */
export interface TomTatTenKho {
  ten: string[];
  conLai: number;
}

export function tomTatTenKho(
  idKho: readonly string[] | null | undefined,
  khoList: ReadonlyArray<{ id: string; ten_kho: string }>,
  toiDa = 2
): TomTatTenKho {
  const tenTheoId = new Map(khoList.map((k) => [String(k.id), k.ten_kho]));
  const ten: string[] = [];
  for (const id of idKho ?? []) {
    const t = tenTheoId.get(String(id));
    if (t) ten.push(t);
  }
  return { ten: ten.slice(0, toiDa), conLai: Math.max(0, ten.length - toiDa) };
}
