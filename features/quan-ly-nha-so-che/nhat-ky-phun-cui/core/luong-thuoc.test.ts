import { describe, expect, it } from 'vitest';
import { tinhLuongThuoc } from './luong-thuoc';

describe('tinhLuongThuoc', () => {
  it('nồng độ × lượng nước: 2 ml/lít × 200 lít = 400 ml', () => {
    expect(tinhLuongThuoc(2, 200)).toBe(400);
  });

  it('thiếu nồng độ hoặc lượng nước (null/0) → 0', () => {
    expect(tinhLuongThuoc(2, null)).toBe(0);
    expect(tinhLuongThuoc(2, 0)).toBe(0);
    expect(tinhLuongThuoc(null, 200)).toBe(0);
  });

  it('làm tròn 3 số lẻ', () => {
    expect(tinhLuongThuoc(0.3333, 3)).toBe(1);
    expect(tinhLuongThuoc(0.125, 3)).toBe(0.375);
  });
});
