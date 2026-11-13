/** Chuỗi hiển thị dùng chung cho danh sách, chi tiết, xuất file. */
import { formatNumberVN } from '../../../../lib/utils';
import type { NhatKyPhaPhen } from '../core/types';

/** kg hiển thị kiểu vi-VN, tối đa 3 số lẻ; null → «—». */
export const formatKg = (n: number | null | undefined) => formatNumberVN(n, { maxFractionDigits: 3 });

/** Chênh lệch có dấu (+1,2 / −8,8 / 0). */
export function formatChenhLech(n: number): string {
  if (n === 0) return '0';
  return `${n > 0 ? '+' : ''}${formatNumberVN(n, { maxFractionDigits: 3 })}`;
}

/** Số kg của lần pha thứ `lan` (1..5); chưa có dòng → null. */
export const kgCuaLan = (p: NhatKyPhaPhen, lan: number): number | null =>
  p.lan.find((l) => l.lan === lan)?.so_kg ?? null;
