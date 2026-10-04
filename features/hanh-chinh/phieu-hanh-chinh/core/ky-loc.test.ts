import { describe, expect, it } from 'vitest';
import { khoangKyLoc, phieuChamKy } from './ky-loc';

const ngayLocal = (y: number, m: number, d: number) => new Date(y, m - 1, d);

describe('khoangKyLoc', () => {
  it('tháng này lấy trọn tháng, không cắt ở hôm nay (tháng 2 năm nhuận)', () => {
    expect(khoangKyLoc('thisMonth', '', '', ngayLocal(2028, 2, 3))).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });

  it('tháng trước khi đang tháng 1 lùi sang tháng 12 năm trước', () => {
    expect(khoangKyLoc('lastMonth', '', '', ngayLocal(2026, 1, 15))).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });

  it('quý này và năm nay lấy trọn kỳ', () => {
    expect(khoangKyLoc('thisQuarter', '', '', ngayLocal(2026, 10, 4))).toEqual({ from: '2026-10-01', to: '2026-12-31' });
    expect(khoangKyLoc('thisYear', '', '', ngayLocal(2026, 10, 4))).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });

  it('tuỳ chọn giữ đúng khoảng nhập, cho phép một đầu; rỗng hoặc all = không lọc', () => {
    expect(khoangKyLoc('custom', '2026-09-15', '2026-10-10', new Date())).toEqual({ from: '2026-09-15', to: '2026-10-10' });
    expect(khoangKyLoc('custom', '2026-09-15', '', new Date())).toEqual({ from: '2026-09-15' });
    expect(khoangKyLoc('custom', '', '', new Date())).toBeNull();
    expect(khoangKyLoc('all', '2026-09-15', '2026-10-10', new Date())).toBeNull();
  });
});

describe('phieuChamKy', () => {
  const ky = { from: '2026-10-01', to: '2026-10-31' };
  it('phiếu vắt qua đầu hoặc cuối kỳ vẫn khớp', () => {
    expect(phieuChamKy({ ngay: '2026-09-29', den_ngay: '2026-10-02' }, ky)).toBe(true);
    expect(phieuChamKy({ ngay: '2026-10-30', den_ngay: '2026-11-03' }, ky)).toBe(true);
  });
  it('phiếu nằm ngoài kỳ không khớp; không có kỳ thì khớp hết', () => {
    expect(phieuChamKy({ ngay: '2026-09-20', den_ngay: '2026-09-30' }, ky)).toBe(false);
    expect(phieuChamKy({ ngay: '2026-11-01', den_ngay: '2026-11-01' }, ky)).toBe(false);
    expect(phieuChamKy({ ngay: '2026-01-01', den_ngay: '2026-01-01' }, null)).toBe(true);
  });
});
