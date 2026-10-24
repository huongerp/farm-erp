import { formatNumberVN } from '../../../../lib/utils';

/** Định dạng số/phần trăm/tiền dùng chung cho bảng desktop và thẻ mobile của Thống kê sản xuất. */

export const n = (v: unknown, d = 0) =>
  v == null || !Number.isFinite(Number(v))
    ? '—'
    : formatNumberVN(Number(v), { maxFractionDigits: d, minFractionDigits: 0 });

/** v là tỷ lệ 0–1 → hiển thị phần trăm. */
export const pct = (v: number | null) =>
  v == null ? '—' : `${formatNumberVN(v * 100, { maxFractionDigits: 1 })}%`;

/** v đã là phần trăm (0–100). */
export const pctDirect = (v: number | null) =>
  v == null ? '—' : `${formatNumberVN(v, { maxFractionDigits: 1 })}%`;

export const currency = (v: number) =>
  v === 0
    ? '0'
    : v >= 1_000_000
    ? `${formatNumberVN(v / 1_000_000, { maxFractionDigits: 2 })}tr`
    : formatNumberVN(v, { maxFractionDigits: 0 });

export const KPI_BADGE: Record<string, { label: string; cls: string }> = {
  Đạt: { label: 'Đạt', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  Tốt: { label: 'Tốt', cls: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  'Không đạt': { label: 'K.đạt', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  Kém: { label: 'Kém', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};
