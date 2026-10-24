import type { CSSProperties } from 'react';

/**
 * Style badge từ màu hex người dùng chọn ở danh mục (nền nhạt, viền vừa, chữ đậm).
 * Chữ pha với màu chữ hiện hành để đọc rõ cả nền sáng lẫn nền tối.
 */
export function styleBadgeTheoMau(mau: string): CSSProperties {
  return {
    backgroundColor: `color-mix(in srgb, ${mau} 14%, transparent)`,
    borderColor: `color-mix(in srgb, ${mau} 40%, transparent)`,
    color: `color-mix(in srgb, ${mau} 75%, currentColor)`,
  };
}
