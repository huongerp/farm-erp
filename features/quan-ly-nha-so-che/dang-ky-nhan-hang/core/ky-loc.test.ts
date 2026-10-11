import { describe, expect, it } from 'vitest';
import { getDateRangeFromPreset } from '../../../../lib/date-presets';
import { addDaysIso, khoangTheoPreset, presetTuKhoang } from './ky-loc';

describe('khoangTheoPreset', () => {
  it('hôm nay / ngày mai / 7 ngày qua tính theo today truyền vào, qua tháng và qua năm', () => {
    expect(khoangTheoPreset('today', '2026-10-11')).toEqual({ from: '2026-10-11', to: '2026-10-11' });
    expect(khoangTheoPreset('tomorrow', '2026-12-31')).toEqual({ from: '2027-01-01', to: '2027-01-01' });
    expect(khoangTheoPreset('7days', '2026-03-03')).toEqual({ from: '2026-02-25', to: '2026-03-03' });
    expect(addDaysIso('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('tất cả = không giới hạn, tuỳ chọn giữ nguyên khoảng, preset chuẩn lấy từ lib/date-presets', () => {
    expect(khoangTheoPreset('all', '2026-10-11')).toEqual({ from: '', to: '' });
    expect(khoangTheoPreset('custom', '2026-10-11', '2026-10-01', '')).toEqual({ from: '2026-10-01', to: '' });
    const nam = getDateRangeFromPreset('thisYear');
    expect(khoangTheoPreset('thisYear', '2026-10-11')).toEqual({ from: nam.dateFrom, to: nam.dateTo });
  });
});

describe('presetTuKhoang', () => {
  it('suy ngược preset để chip sáng đúng; không khớp → custom', () => {
    expect(presetTuKhoang('', '', '2026-10-11')).toBe('all');
    expect(presetTuKhoang('2026-10-11', '2026-10-11', '2026-10-11')).toBe('today');
    expect(presetTuKhoang('2026-10-12', '2026-10-12', '2026-10-11')).toBe('tomorrow');
    expect(presetTuKhoang('2026-10-05', '2026-10-11', '2026-10-11')).toBe('7days');
    expect(presetTuKhoang('2026-10-02', '2026-10-03', '2026-10-11')).toBe('custom');
    expect(presetTuKhoang('2026-10-02', '', '2026-10-11')).toBe('custom');
  });
});
