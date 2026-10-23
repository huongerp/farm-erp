import { afterEach, describe, expect, it, vi } from 'vitest';
import { khoangNgayDatTuFilters } from './don-dat-hang-list-query';
import type { DonDatHangFilters } from '../store/useDonDatHangStore';

const base: DonDatHangFilters = { status: [], nhaCungCapIds: [], khoNhanIds: [], nguoiDatIds: [] };

describe('khoangNgayDatTuFilters', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('preset all hoặc thiếu preset → không lọc ngày', () => {
    expect(khoangNgayDatTuFilters(base)).toEqual({ ngayFrom: '', ngayTo: '' });
    expect(khoangNgayDatTuFilters({ ...base, datePreset: 'all', customDateFrom: '2026-01-01' })).toEqual({
      ngayFrom: '',
      ngayTo: '',
    });
  });

  it('custom → đúng hai ngày đã chọn (yyyy-mm-dd)', () => {
    expect(
      khoangNgayDatTuFilters({ ...base, datePreset: 'custom', customDateFrom: '2026-10-05', customDateEnd: '2026-10-23' })
    ).toEqual({ ngayFrom: '2026-10-05', ngayTo: '2026-10-23' });
  });

  it('this_month → đầu và cuối tháng hiện tại', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 14, 10, 0, 0));
    expect(khoangNgayDatTuFilters({ ...base, datePreset: 'this_month' })).toEqual({
      ngayFrom: '2026-02-01',
      ngayTo: '2026-02-28',
    });
  });
});
