import { describe, expect, it } from 'vitest';
import { docTongNhanh, tiLeLoi } from './ti-le';
import type { TieuChi } from './types';

const tc = (loai: TieuChi['loai']): TieuChi => ({ ma: 'x', ten: 'X', loai, don_vi: null, nguong_min: null, nguong_max: 4 });

describe('tiLeLoi', () => {
  it('lỗi ÷ tổng nhánh, làm tròn 1 chữ số', () => {
    expect(tiLeLoi(tc('dem_loi'), 2, 33)).toBe(6.1);
    expect(tiLeLoi(tc('dem_loi'), 1, 3)).toBe(33.3);
  });

  it('ô trống tính 0 lỗi', () => {
    expect(tiLeLoi(tc('dem_loi'), undefined, 30)).toBe(0);
    expect(tiLeLoi(tc('dem_loi'), null, 30)).toBe(0);
  });

  it('chưa có tổng nhánh → null', () => {
    expect(tiLeLoi(tc('dem_loi'), 2, null)).toBeNull();
    expect(tiLeLoi(tc('dem_loi'), 2, 0)).toBeNull();
  });

  it('tiêu chí không đếm lỗi → null', () => {
    expect(tiLeLoi(tc('do_luong'), 2, 30)).toBeNull();
    expect(tiLeLoi(tc('dat_khong'), false, 30)).toBeNull();
  });
});

describe('docTongNhanh', () => {
  it('nhận số nguyên dương', () => {
    expect(docTongNhanh(' 33 ')).toBe(33);
  });

  it('từ chối rỗng, 0, âm, thập phân', () => {
    expect(docTongNhanh('')).toBeNull();
    expect(docTongNhanh('0')).toBeNull();
    expect(docTongNhanh('-3')).toBeNull();
    expect(docTongNhanh('3,5')).toBeNull();
  });
});
