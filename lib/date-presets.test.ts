import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDateRangeFromPreset } from './date-presets';

describe('getDateRangeFromPreset — tuần (Thứ 2 → CN)', () => {
  afterEach(() => vi.useRealTimers());

  it('Chủ nhật 11/10/2026: tuần này 05/10 → hôm nay, tuần trước 28/09 → 04/10', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 11, 9));
    expect(getDateRangeFromPreset('thisWeek')).toEqual({ dateFrom: '2026-10-05', dateTo: '2026-10-11' });
    expect(getDateRangeFromPreset('lastWeek')).toEqual({ dateFrom: '2026-09-28', dateTo: '2026-10-04' });
  });

  it('Thứ 2 đầu năm: tuần trước vắt sang năm cũ', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 0, 4, 9));
    expect(getDateRangeFromPreset('thisWeek')).toEqual({ dateFrom: '2027-01-04', dateTo: '2027-01-04' });
    expect(getDateRangeFromPreset('lastWeek')).toEqual({ dateFrom: '2026-12-28', dateTo: '2027-01-03' });
  });
});
