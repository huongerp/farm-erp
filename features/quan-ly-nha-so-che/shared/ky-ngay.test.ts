import { describe, expect, it } from 'vitest';
import { khoangTheoKyNgay, kyNgayCuaKhoang } from './ky-ngay';

// 2026-11-17 là Thứ 3.
const HOM_NAY = '2026-11-17';

describe('khoangTheoKyNgay', () => {
  it('ngày đơn và 7 ngày qua', () => {
    expect(khoangTheoKyNgay('today', HOM_NAY)).toEqual({ tu: HOM_NAY, den: HOM_NAY });
    expect(khoangTheoKyNgay('yesterday', '2026-03-01')).toEqual({ tu: '2026-02-28', den: '2026-02-28' });
    expect(khoangTheoKyNgay('7days', HOM_NAY)).toEqual({ tu: '2026-11-11', den: HOM_NAY });
  });

  it('tuần bắt đầu Thứ 2, kể cả khi hôm nay là Chủ nhật', () => {
    expect(khoangTheoKyNgay('thisWeek', HOM_NAY)).toEqual({ tu: '2026-11-16', den: HOM_NAY });
    expect(khoangTheoKyNgay('lastWeek', HOM_NAY)).toEqual({ tu: '2026-11-09', den: '2026-11-15' });
    expect(khoangTheoKyNgay('thisWeek', '2026-11-22')).toEqual({ tu: '2026-11-16', den: '2026-11-22' });
  });

  it('tháng trước qua ranh năm', () => {
    expect(khoangTheoKyNgay('lastMonth', '2026-01-10')).toEqual({ tu: '2025-12-01', den: '2025-12-31' });
    expect(khoangTheoKyNgay('thisMonth', HOM_NAY)).toEqual({ tu: '2026-11-01', den: HOM_NAY });
  });

  it('tất cả = không giới hạn, tuỳ chọn giữ nguyên khoảng', () => {
    expect(khoangTheoKyNgay('all', HOM_NAY)).toEqual({ tu: '', den: '' });
    expect(khoangTheoKyNgay('custom', HOM_NAY, '2026-10-05', '')).toEqual({ tu: '2026-10-05', den: '' });
  });
});

describe('kyNgayCuaKhoang', () => {
  it('suy ngược đúng kỳ, không khớp thì là tuỳ chọn', () => {
    expect(kyNgayCuaKhoang('', '', HOM_NAY)).toBe('all');
    expect(kyNgayCuaKhoang(HOM_NAY, HOM_NAY, HOM_NAY)).toBe('today');
    expect(kyNgayCuaKhoang('2026-11-01', HOM_NAY, HOM_NAY)).toBe('thisMonth');
    expect(kyNgayCuaKhoang('2026-11-03', '2026-11-05', HOM_NAY)).toBe('custom');
  });
});
