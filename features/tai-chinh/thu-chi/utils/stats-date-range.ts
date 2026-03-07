/**
 * Compute start/end dates for Thu chi stats date range presets.
 */
import type { DateRangePresetId, StatsDateRange } from '../core/stats-constants';
import { getNowAsLocalDate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfQuarter(d: Date): Date {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return new Date(d.getFullYear(), (q - 1) * 3, 1);
}

function endOfQuarter(d: Date): Date {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return new Date(d.getFullYear(), q * 3, 0);
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

function endOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31);
}

function getNowEndOfDay(d: Date): Date {
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return end;
}

function formatShort(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function getDateRangeFromPreset(
  preset: DateRangePresetId,
  customStart?: Date,
  customEnd?: Date
): StatsDateRange {
  const now = getNowAsLocalDate();
  let start: Date;
  let end: Date;
  let label: string;

  switch (preset) {
    case 'all': {
      start = new Date(2000, 0, 1);
      end = getNowEndOfDay(now);
      label = i18n.t('thuChi.stats.dateRange.all');
      break;
    }
    case 'this_week': {
      const day = now.getDay();
      const mon = now.getDate() - (day === 0 ? 6 : day - 1);
      start = new Date(now.getFullYear(), now.getMonth(), mon);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      label = `${i18n.t('thuChi.stats.dateRange.week')} ${start.getDate()}/${start.getMonth() + 1} – ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
      break;
    }
    case 'last_week': {
      const day = now.getDay();
      const mon = now.getDate() - (day === 0 ? 6 : day - 1) - 7;
      start = new Date(now.getFullYear(), now.getMonth(), mon);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      label = `${i18n.t('thuChi.stats.dateRange.week')} ${start.getDate()}/${start.getMonth() + 1} – ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
      break;
    }
    case 'this_month': {
      start = startOfMonth(now);
      end = endOfMonth(now);
      label = `${i18n.t('thuChi.stats.dateRange.month')} ${now.getMonth() + 1}/${now.getFullYear()}`;
      break;
    }
    case 'last_month': {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      start = startOfMonth(last);
      end = endOfMonth(last);
      label = `${i18n.t('thuChi.stats.dateRange.month')} ${last.getMonth() + 1}/${last.getFullYear()}`;
      break;
    }
    case 'this_quarter': {
      start = startOfQuarter(now);
      end = endOfQuarter(now);
      const q = Math.floor(now.getMonth() / 3) + 1;
      label = `${i18n.t('thuChi.stats.dateRange.quarter')} ${q}/${now.getFullYear()}`;
      break;
    }
    case 'last_quarter': {
      const lastQ = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      start = startOfQuarter(lastQ);
      end = endOfQuarter(lastQ);
      const q = Math.floor(lastQ.getMonth() / 3) + 1;
      label = `${i18n.t('thuChi.stats.dateRange.quarter')} ${q}/${lastQ.getFullYear()}`;
      break;
    }
    case 'this_year': {
      start = startOfYear(now);
      end = endOfYear(now);
      label = `${i18n.t('thuChi.stats.dateRange.year')} ${now.getFullYear()}`;
      break;
    }
    case 'custom':
    default: {
      start = customStart ? new Date(customStart) : startOfMonth(now);
      end = customEnd ? new Date(customEnd) : endOfMonth(now);
      if (customStart && customEnd) {
        label = `${formatShort(customStart)} – ${formatShort(customEnd)}`;
      } else {
        label = i18n.t('thuChi.stats.dateRange.custom');
      }
      break;
    }
  }

  return { preset, start, end, label };
}

/** Format Date to YYYY-MM-DD for API (tuNgay/denNgay). */
export function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
