/**
 * Chia các bộ lọc của toolbar thành phần hiện ngoài và phần gom vào nút Filter.
 * Quy ước toàn app: tối đa 5 bộ lọc ngoài toolbar (màn ≥ 1024px), 3 bộ lọc ở màn hẹp
 * (640–1024px); dư thì vào nút Filter. Dùng qua components/shared/ResponsiveFilterChips.
 */
import type React from 'react';
import type { FilterGroup } from '../components/ui/MobileFilterSheet';

/** Số bộ lọc tối đa ngoài toolbar ở màn rộng / màn hẹp. */
export const MAX_FILTER_CHIP = 5;
export const MAX_FILTER_CHIP_HEP = 3;

export type FilterChipItem =
  /** Chip chọn nhiều — được phép gom vào nút Filter. */
  | { kind: 'group'; group: FilterGroup; className?: string }
  /**
   * Control khác (chọn khoảng ngày, ô ngày, nút gạt…) — luôn hiện ngoài vì nút Filter chỉ
   * chứa được chip chọn nhiều, nhưng vẫn chiếm một chỗ trong giới hạn.
   */
  | { kind: 'custom'; key: string; node: React.ReactNode };

export const itemKey = (it: FilterChipItem) => (it.kind === 'group' ? it.group.key : it.key);

export interface KetQuaChiaChip {
  hien: FilterChipItem[];
  vaoFilter: FilterGroup[];
}

/**
 * Giữ nguyên thứ tự. Item `custom` luôn hiện; chip lấp các chỗ còn lại theo thứ tự, dư thì
 * vào Filter. `luonVaoFilter`: key luôn nằm trong Filter (bộ lọc ít dùng) dù còn chỗ.
 */
export function chiaChipLoc(
  items: FilterChipItem[],
  gioiHan: number,
  luonVaoFilter: ReadonlySet<string> | readonly string[] = []
): KetQuaChiaChip {
  const luonVao = new Set(luonVaoFilter);
  const coDinh = items.filter((it) => it.kind === 'custom').length;
  let conCho = Math.max(0, gioiHan - coDinh);
  const hien: FilterChipItem[] = [];
  const vaoFilter: FilterGroup[] = [];
  for (const it of items) {
    if (it.kind === 'custom') {
      hien.push(it);
    } else if (!luonVao.has(it.group.key) && conCho > 0) {
      hien.push(it);
      conCho -= 1;
    } else {
      vaoFilter.push(it.group);
    }
  }
  return { hien, vaoFilter };
}
