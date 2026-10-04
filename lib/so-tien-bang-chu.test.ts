import { describe, it, expect } from 'vitest';
import { soTienBangChu } from './so-tien-bang-chu';

describe('soTienBangChu', () => {
  it.each([
    [0, 'Không đồng'],
    [5, 'Năm đồng'],
    [10, 'Mười đồng'],
    [15, 'Mười lăm đồng'],
    [21, 'Hai mươi mốt đồng'],
    [24, 'Hai mươi tư đồng'],
    [105, 'Một trăm linh năm đồng'],
    [110, 'Một trăm mười đồng'],
    [1_000, 'Một nghìn đồng'],
    [1_005, 'Một nghìn không trăm linh năm đồng'],
    [1_250_000, 'Một triệu hai trăm năm mươi nghìn đồng'],
    [2_000_500, 'Hai triệu năm trăm đồng'],
    [5_000_001, 'Năm triệu không trăm linh một đồng'],
    [1_000_000_000, 'Một tỷ đồng'],
    [3_500_000_000, 'Ba tỷ năm trăm triệu đồng'],
    [1_000_000_000_000, 'Một nghìn tỷ đồng'],
    [2_000_015_000, 'Hai tỷ không trăm mười lăm nghìn đồng'],
  ])('%d → %s', (n, chu) => {
    expect(soTienBangChu(n)).toBe(chu);
  });

  it('làm tròn phần lẻ và đọc số âm', () => {
    expect(soTienBangChu(1499.6)).toBe('Một nghìn năm trăm đồng');
    expect(soTienBangChu(-15)).toBe('Âm mười lăm đồng');
  });
});
