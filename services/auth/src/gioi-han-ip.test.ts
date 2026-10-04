import { describe, it, expect } from 'vitest';
import { taoBoGioiHan } from './gioi-han-ip.ts';

const PHUT = 60_000;

describe('taoBoGioiHan', () => {
  it('chặn khi đủ số lần sai trong cửa sổ', () => {
    const bo = taoBoGioiHan(3, 15 * PHUT);
    for (let i = 0; i < 2; i++) bo.ghiLanSai('1.2.3.4', i);
    expect(bo.biChan('1.2.3.4', 10)).toBe(false);
    bo.ghiLanSai('1.2.3.4', 20);
    expect(bo.biChan('1.2.3.4', 30)).toBe(true);
  });

  it('mở lại khi các lần sai đã ra khỏi cửa sổ', () => {
    const bo = taoBoGioiHan(3, 15 * PHUT);
    for (let i = 0; i < 3; i++) bo.ghiLanSai('ip', 0);
    expect(bo.biChan('ip', 15 * PHUT - 1)).toBe(true);
    expect(bo.biChan('ip', 15 * PHUT)).toBe(false);
  });

  it('mỗi IP đếm riêng', () => {
    const bo = taoBoGioiHan(2, PHUT);
    bo.ghiLanSai('a', 0);
    bo.ghiLanSai('a', 0);
    expect(bo.biChan('a', 1)).toBe(true);
    expect(bo.biChan('b', 1)).toBe(false);
  });

  it('không phình bộ nhớ quá số khoá tối đa', () => {
    const bo = taoBoGioiHan(1, PHUT, 2);
    bo.ghiLanSai('a', 0);
    bo.ghiLanSai('b', 0);
    bo.ghiLanSai('c', 0); // đẩy 'a' ra
    expect(bo.biChan('a', 1)).toBe(false);
    expect(bo.biChan('c', 1)).toBe(true);
  });
});
