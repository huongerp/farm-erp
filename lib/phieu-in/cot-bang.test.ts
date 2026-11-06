import { describe, expect, it } from 'vitest';
import { chiaDeu, chuanHoaPhanTram, cssCotBang, doRongHienThi, keoCot } from './cot-bang';

const tong = (ds: number[]) => ds.reduce((s, x) => s + x, 0);

describe('chuanHoaPhanTram', () => {
  it('px đo được → % tổng đúng 100', () => {
    const p = chuanHoaPhanTram([1, 1, 1]);
    expect(tong(p)).toBeCloseTo(100, 5);
    expect(chuanHoaPhanTram([100, 300])).toEqual([25, 75]);
  });

  it('cột quá hẹp được nâng lên tối thiểu', () => {
    const p = chuanHoaPhanTram([0.5, 99.5]);
    expect(p[0]).toBeGreaterThanOrEqual(2.9);
    expect(tong(p)).toBeCloseTo(100, 5);
  });

  it('toàn 0 → chia đều', () => {
    expect(chuanHoaPhanTram([0, 0])).toEqual([50, 50]);
    expect(tong(chiaDeu(3))).toBeCloseTo(100, 5);
  });
});

describe('keoCot', () => {
  it('cột kề bù đúng phần kéo, tổng giữ nguyên', () => {
    expect(keoCot([20, 30, 50], 0, 5)).toEqual([25, 25, 50]);
  });

  it('không cho cột nào hẹp hơn tối thiểu', () => {
    expect(keoCot([20, 30, 50], 0, 40, [], 3)).toEqual([47, 3, 50]);
    expect(keoCot([20, 30, 50], 1, -40, [], 3)).toEqual([20, 3, 77]);
  });

  it('mép phải cột cuối không kéo được', () => {
    expect(keoCot([50, 50], 1, 5)).toEqual([50, 50]);
  });

  it('bỏ qua cột ẩn khi tìm cột kế', () => {
    expect(keoCot([20, 30, 50], 0, 10, [1])).toEqual([30, 30, 40]);
  });
});

describe('doRongHienThi — chia lại % khi ẩn cột', () => {
  it('phần của cột ẩn chia theo tỉ lệ cho cột còn lại', () => {
    expect(doRongHienThi([20, 30, 50], [1])).toEqual([28.57, 0, 71.43]);
  });

  it('không ẩn gì → giữ nguyên', () => {
    expect(doRongHienThi([20, 30, 50], [])).toEqual([20, 30, 50]);
  });
});

describe('cssCotBang', () => {
  it('độ rộng trên col, ẩn theo data-in-o (không nth-child trên ô)', () => {
    const css = cssCotBang({ '0': [20, 30, 50] }, { '0': [1] });
    expect(css).toContain('table[data-in-bang="0"]{table-layout:fixed;width:100%}');
    expect(css).toContain('col:nth-child(1){width:28.57%}');
    expect(css).toContain('table[data-in-bang="0"] [data-in-o="1"]{display:none}');
    expect(css).not.toMatch(/td:nth-child|th:nth-child/);
  });

  it('chỉ ẩn cột, không đổi độ rộng', () => {
    const css = cssCotBang({}, { '2': [0] });
    expect(css).not.toContain('table-layout');
    expect(css).toContain('table[data-in-bang="2"] [data-in-o="0"]{display:none}');
  });
});
