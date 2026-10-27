import { describe, expect, it } from 'vitest';
import {
  cacNgayCuaTuan,
  cacNgayTrongKhoang,
  goiYThuHoach,
  ngayDauTuanIso,
  soTuanIsoTrongNam,
  tuanIsoCuaNgay,
  tuanKeTiep,
} from './tuan';

describe('tuần ISO', () => {
  it('tuần 1/2026 bắt đầu 29/12/2025, ngày đó thuộc năm ISO 2026', () => {
    expect(ngayDauTuanIso(2026, 1)).toBe('2025-12-29');
    expect(tuanIsoCuaNgay('2025-12-29')).toEqual({ nam: 2026, tuan: 1 });
  });

  it('2026 có 53 tuần, 2025 có 52; 01/01/2027 thuộc tuần 53/2026', () => {
    expect(soTuanIsoTrongNam(2026)).toBe(53);
    expect(soTuanIsoTrongNam(2025)).toBe(52);
    expect(tuanIsoCuaNgay('2027-01-01')).toEqual({ nam: 2026, tuan: 53 });
    expect(cacNgayCuaTuan(2026, 53)).toEqual([
      '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03',
    ]);
  });

  it('tuần kế tiếp qua năm: 53/2026 → 1/2027, 52/2025 → 1/2026; lùi được', () => {
    expect(tuanKeTiep({ nam: 2026, tuan: 53 })).toEqual({ nam: 2027, tuan: 1 });
    expect(tuanKeTiep({ nam: 2025, tuan: 52 })).toEqual({ nam: 2026, tuan: 1 });
    expect(tuanKeTiep({ nam: 2026, tuan: 1 }, -1)).toEqual({ nam: 2025, tuan: 52 });
  });

  it('gợi ý thu hoạch = chích bắp + 10 tuần (T2–CN → T2–CN)', () => {
    expect(goiYThuHoach('2026-08-17', '2026-08-23')).toEqual({ thu_hoach_tu: '2026-10-26', thu_hoach_den: '2026-11-01' });
    expect(tuanIsoCuaNgay('2026-08-17').tuan + 10).toBe(tuanIsoCuaNgay('2026-10-26').tuan);
    expect(goiYThuHoach(null, null)).toEqual({ thu_hoach_tu: null, thu_hoach_den: null });
  });

  it('khoảng ngày gồm cả hai đầu, ngược chiều → rỗng', () => {
    expect(cacNgayTrongKhoang('2026-02-27', '2026-03-01')).toEqual(['2026-02-27', '2026-02-28', '2026-03-01']);
    expect(cacNgayTrongKhoang('2026-03-02', '2026-03-01')).toEqual([]);
  });
});
