import { afterEach, describe, expect, it, vi } from 'vitest';
import { getYmdRangeFromPreset } from './stats-date-range';

describe('getYmdRangeFromPreset', () => {
  afterEach(() => vi.useRealTimers());

  it('preset all hoặc rỗng → không lọc', () => {
    expect(getYmdRangeFromPreset('all')).toEqual({ start: '', end: '' });
    expect(getYmdRangeFromPreset(undefined)).toEqual({ start: '', end: '' });
  });

  it('custom đủ hai đầu → giữ nguyên ngày', () => {
    expect(getYmdRangeFromPreset('custom', '2026-10-21', '2026-10-28')).toEqual({
      start: '2026-10-21',
      end: '2026-10-28',
    });
  });

  it('this_month → đầu tới cuối tháng hiện tại', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-15T05:00:00Z'));
    expect(getYmdRangeFromPreset('this_month')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
  });

  it('custom thiếu đầu cuối → lấy cuối tháng hiện tại', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-25T05:00:00Z'));
    expect(getYmdRangeFromPreset('custom', '2026-11-03', '')).toEqual({ start: '2026-11-03', end: '2026-11-30' });
  });
});
