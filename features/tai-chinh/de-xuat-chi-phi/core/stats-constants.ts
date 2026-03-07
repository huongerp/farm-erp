/**
 * Constants for Đề xuất chi phí Stats (date range presets, etc.)
 */
import i18n from '../../../../lib/i18n';

export type DateRangePresetId =
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'custom';

export const DATE_RANGE_PRESETS: { id: DateRangePresetId; label: string }[] = [
  { id: 'this_week', get label() { return i18n.t('deXuatChiPhi.stats.preset.thisWeek'); } },
  { id: 'last_week', get label() { return i18n.t('deXuatChiPhi.stats.preset.lastWeek'); } },
  { id: 'this_month', get label() { return i18n.t('deXuatChiPhi.stats.preset.thisMonth'); } },
  { id: 'last_month', get label() { return i18n.t('deXuatChiPhi.stats.preset.lastMonth'); } },
  { id: 'this_quarter', get label() { return i18n.t('deXuatChiPhi.stats.preset.thisQuarter'); } },
  { id: 'last_quarter', get label() { return i18n.t('deXuatChiPhi.stats.preset.lastQuarter'); } },
  { id: 'this_year', get label() { return i18n.t('deXuatChiPhi.stats.preset.thisYear'); } },
  { id: 'last_year', get label() { return i18n.t('deXuatChiPhi.stats.preset.lastYear'); } },
  { id: 'custom', get label() { return i18n.t('deXuatChiPhi.stats.preset.custom'); } },
];

export interface StatsDateRange {
  preset: DateRangePresetId;
  start: Date;
  end: Date;
  label: string;
}
