/**
 * Constants for Thu chi Stats (date range presets, chart height, colors).
 */
import i18n from '../../../../lib/i18n';

export type DateRangePresetId =
  | 'all'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'custom';

export const DATE_RANGE_PRESETS: { id: DateRangePresetId; label: string }[] = [
  { id: 'all', get label() { return i18n.t('thuChi.stats.preset.all'); } },
  { id: 'this_week', get label() { return i18n.t('thuChi.stats.preset.thisWeek'); } },
  { id: 'last_week', get label() { return i18n.t('thuChi.stats.preset.lastWeek'); } },
  { id: 'this_month', get label() { return i18n.t('thuChi.stats.preset.thisMonth'); } },
  { id: 'last_month', get label() { return i18n.t('thuChi.stats.preset.lastMonth'); } },
  { id: 'this_quarter', get label() { return i18n.t('thuChi.stats.preset.thisQuarter'); } },
  { id: 'last_quarter', get label() { return i18n.t('thuChi.stats.preset.lastQuarter'); } },
  { id: 'this_year', get label() { return i18n.t('thuChi.stats.preset.thisYear'); } },
  { id: 'custom', get label() { return i18n.t('thuChi.stats.preset.custom'); } },
];

export interface StatsDateRange {
  preset: DateRangePresetId;
  start: Date;
  end: Date;
  label: string;
}

/** Chiều cao biểu đồ thống kê (px) */
export const STATS_CHART_HEIGHT = 220;

/** Màu biểu đồ: Thu, Chi, Chuyển quỹ + các màu phụ */
export const THU_CHI_CHART_COLORS = ['#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899'];
