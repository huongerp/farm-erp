import { describe, expect, it } from 'vitest';
import { laSoLieuRowTuTinh, tinhTonCuoiNgay } from './so-lieu-row-meta';

describe('tinhTonCuoiNgay — mục 10 = mục 6 + mục 7 − mục 8 − mục 9', () => {
  it('ví dụ thật: 0 + 271 − 5 − 266 = 0', () => {
    expect(tinhTonCuoiNgay(0, 271, 5, 266)).toBe(0);
  });

  it('cộng tồn đầu ngày', () => {
    expect(tinhTonCuoiNgay(20, 300, 10, 250)).toBe(60);
  });

  it('giữ số âm khi sơ chế nhập lớn hơn tồn đầu + thu − không sơ chế', () => {
    expect(tinhTonCuoiNgay(10, 100, 5, 120)).toBe(-15);
  });

  it('ô trống / null / chuỗi coi như 0', () => {
    expect(tinhTonCuoiNgay(null, null, undefined, '')).toBe(0);
    expect(tinhTonCuoiNgay('', '50', null, '20')).toBe(30);
    expect(tinhTonCuoiNgay('5', '50', null, '20')).toBe(35);
  });
});

describe('laSoLieuRowTuTinh', () => {
  it('chỉ tồn cuối ngày là ô tự tính', () => {
    expect(laSoLieuRowTuTinh('sl_buong_ton_cuoi_ngay')).toBe(true);
    expect(laSoLieuRowTuTinh('sl_buong_ton_dau_ngay')).toBe(false);
    expect(laSoLieuRowTuTinh('tong_buong_so_che')).toBe(false);
  });
});
