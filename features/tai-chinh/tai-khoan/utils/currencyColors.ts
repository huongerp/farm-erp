import React from 'react';
import { cn } from '../../../../lib/utils';

/** Màu theo số tiền: âm = đỏ, dương = xanh, không = muted */
const CLASS_NEGATIVE = 'text-rose-600 dark:text-rose-400';
const CLASS_POSITIVE = 'text-emerald-600 dark:text-emerald-400';
const CLASS_ZERO = 'text-muted-foreground';

/**
 * Trả về class màu cho số tiền theo loại:
 * - balance (tồn đầu, dư cuối): âm đỏ, dương xanh, 0 muted
 * - income (tổng thu): luôn xanh
 * - expense (tổng chi): luôn đỏ
 */
export function getCurrencyAmountClass(
  value: number,
  type: 'balance' | 'income' | 'expense'
): string {
  if (type === 'income') return CLASS_POSITIVE;
  if (type === 'expense') return CLASS_NEGATIVE;
  if (value < 0) return CLASS_NEGATIVE;
  if (value > 0) return CLASS_POSITIVE;
  return CLASS_ZERO;
}

/** Trả về class cho số dư (tồn đầu, dư cuối) theo dấu */
export function getBalanceClass(value: number): string {
  return getCurrencyAmountClass(value, 'balance');
}

/** Trả về class cho tổng thu */
export function getIncomeClass(): string {
  return CLASS_POSITIVE;
}

/** Trả về class cho tổng chi */
export function getExpenseClass(): string {
  return CLASS_NEGATIVE;
}

/**
 * Render số tiền có màu (dùng trong table, card, detail).
 * type: balance | income | expense
 */
export function formatCurrencyWithColor(
  value: number,
  formatter: (n: number) => string,
  type: 'balance' | 'income' | 'expense',
  extraClass?: string
): React.ReactElement {
  const colorClass = getCurrencyAmountClass(value, type);
  return React.createElement(
    'span',
    { className: cn('tabular-nums font-medium', colorClass, extraClass) },
    formatter(value)
  );
}
