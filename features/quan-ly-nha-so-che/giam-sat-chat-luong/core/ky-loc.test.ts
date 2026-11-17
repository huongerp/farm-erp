import { describe, expect, it } from 'vitest';
import { getDateRangeFromPreset } from '../../../../lib/date-presets';
import { khoangTheoPreset, presetTuKhoang } from './ky-loc';

describe('khoangTheoPreset', () => {
  it('hôm nay / 7 ngày qua tính theo today truyền vào, kể cả qua tháng', () => {
    expect(khoangTheoPreset('today', '2026-11-15')).toEqual({ from: '2026-11-15', to: '2026-11-15' });
    expect(khoangTheoPreset('7days', '2026-03-03')).toEqual({ from: '2026-02-25', to: '2026-03-03' });
  });

  it('tất cả = không giới hạn, tuỳ chọn giữ nguyên khoảng, preset chuẩn lấy từ lib/date-presets', () => {
    expect(khoangTheoPreset('all', '2026-11-15')).toEqual({ from: '', to: '' });
    expect(khoangTheoPreset('custom', '2026-11-15', '2026-11-12', '2026-11-15')).toEqual({
      from: '2026-11-12',
      to: '2026-11-15',
    });
    const thang = getDateRangeFromPreset('thisMonth');
    expect(khoangTheoPreset('thisMonth', '2026-11-15')).toEqual({ from: thang.dateFrom, to: thang.dateTo });
  });
});

describe('presetTuKhoang', () => {
  it('suy ngược preset để chip sáng đúng; không khớp → custom', () => {
    expect(presetTuKhoang('', '', '2026-11-15')).toBe('all');
    expect(presetTuKhoang('2026-11-15', '2026-11-15', '2026-11-15')).toBe('today');
    expect(presetTuKhoang('2026-11-09', '2026-11-15', '2026-11-15')).toBe('7days');
    expect(presetTuKhoang('2026-11-12', '2026-11-13', '2026-11-15')).toBe('custom');
    expect(presetTuKhoang('2026-11-12', '', '2026-11-15')).toBe('custom');
  });
});
