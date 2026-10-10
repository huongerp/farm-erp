import { describe, expect, it } from 'vitest';
import {
  chuanHoaCaiDatIn,
  coChuHienThi,
  doiCoChu,
  dungLuoiBang,
  keoCot,
  kichThuocGiayIn,
  sangPhanTram,
} from './cai-dat-in';

describe('chuanHoaCaiDatIn', () => {
  it('rỗng → mặc định của mẫu', () => {
    const c = chuanHoaCaiDatIn(undefined, { kho: 'a5', huong: 'ngang', leMm: 8 });
    expect(c).toMatchObject({ kho: 'a5', huong: 'ngang', leMm: 8, font: 'mac-dinh', tiLeChu: 1 });
  });

  it('giá trị đã lưu đè mặc định, kẹp lề và tỉ lệ chữ', () => {
    const c = chuanHoaCaiDatIn({ kho: 'a4', leMm: 99, tiLeChu: 5, font: 'times' }, { kho: 'a5' });
    expect(c.kho).toBe('a4');
    expect(c.leMm).toBe(25);
    expect(c.tiLeChu).toBe(1.6);
    expect(c.font).toBe('times');
  });

  it('bỏ giá trị lạ và mảng cột không tổng 100', () => {
    const c = chuanHoaCaiDatIn({ kho: 'a3', font: 'comic', cot: { '0': [50, 50], '1': [10, 10], '2': 'x' } });
    expect(c.kho).toBe('a4');
    expect(c.font).toBe('mac-dinh');
    expect(c.cot).toEqual({ '0': [50, 50] });
  });
});

describe('kichThuocGiayIn', () => {
  it('A5 ngang = 210 × 148', () => {
    expect(kichThuocGiayIn('a5', 'ngang')).toEqual({ wMm: 210, hMm: 148 });
    expect(kichThuocGiayIn('a4', 'doc')).toEqual({ wMm: 210, hMm: 297 });
  });
});

describe('cỡ chữ', () => {
  it('hiển thị pt làm tròn 0,5 và đổi từng bước', () => {
    expect(coChuHienThi(10.5, 1)).toBe(10.5);
    expect(doiCoChu(10, 1, 1)).toBe(1.05);
    expect(doiCoChu(10, 1, -2)).toBe(0.9);
  });

  it('không vượt giới hạn tỉ lệ', () => {
    expect(doiCoChu(10, 1.6, 3)).toBe(1.6);
    expect(doiCoChu(10, 0.6, -3)).toBe(0.6);
  });
});

describe('sangPhanTram', () => {
  it('tổng đúng 100 dù làm tròn', () => {
    const p = sangPhanTram([1, 1, 1]);
    expect(p.reduce((s, x) => s + x, 0)).toBeCloseTo(100, 5);
  });
});

describe('keoCot', () => {
  it('cột kề bù đúng phần kéo, tổng giữ nguyên', () => {
    expect(keoCot([20, 30, 50], 0, 5)).toEqual([25, 25, 50]);
  });

  it('không cho cột nào hẹp hơn tối thiểu', () => {
    expect(keoCot([20, 30, 50], 0, 40, 3)).toEqual([47, 3, 50]);
    expect(keoCot([20, 30, 50], 1, -40, 3)).toEqual([20, 3, 77]);
  });

  it('mép phải cột cuối không kéo được', () => {
    expect(keoCot([50, 50], 1, 5)).toEqual([50, 50]);
  });
});

describe('dungLuoiBang', () => {
  it('tiêu đề hai tầng có rowSpan + colSpan', () => {
    // | STT (rs2) | Mẫu 1 (cs2) | Mẫu 2 (cs2) |
    // |           | a | b       | a | b       |
    const { soCot, o } = dungLuoiBang([
      [
        { colSpan: 1, rowSpan: 2 },
        { colSpan: 2, rowSpan: 1 },
        { colSpan: 2, rowSpan: 1 },
      ],
      [
        { colSpan: 1, rowSpan: 1 },
        { colSpan: 1, rowSpan: 1 },
        { colSpan: 1, rowSpan: 1 },
        { colSpan: 1, rowSpan: 1 },
      ],
    ]);
    expect(soCot).toBe(5);
    expect(o.filter((x) => x.hang === 1).map((x) => x.cotDau)).toEqual([1, 2, 3, 4]);
    expect(o.find((x) => x.hang === 0 && x.o === 2)?.cotDau).toBe(3);
  });
});
