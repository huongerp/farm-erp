import { formatNumberVN } from '../../../../lib/utils';
import type { KpiSnapshot } from './types';

/** Hiển thị cột Thực tế KPI preset (index 0–2) — đồng bộ list/detail. */
export function kpiThucTeDisplay(k: KpiSnapshot | null | undefined, index: number): string {
  const row = k?.rows[index];
  const raw = row?.thuc_te?.trim();
  if (!raw) return '—';
  const numVal = parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(numVal)) return raw;
  const digits = row?.don_vi_tinh === '%' ? 1 : 2;
  const formatted = formatNumberVN(numVal, { maxFractionDigits: digits, minFractionDigits: 0 });
  return row?.don_vi_tinh === '%' ? `${formatted}%` : formatted;
}
